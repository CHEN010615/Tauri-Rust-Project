use serde::Serialize;
use std::process::Command;
use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{Disks, System};

struct TelemetryState {
    system: System,
    previous_network_sample: Option<NetworkSample>,
}

impl Default for TelemetryState {
    fn default() -> Self {
        Self {
            system: System::new_all(),
            previous_network_sample: None,
        }
    }
}

#[derive(Clone, Copy)]
struct NetworkSample {
    rx_bytes: u64,
    tx_bytes: u64,
    timestamp: Instant,
}

#[derive(Serialize)]
struct OsInfo {
    platform: String,
    arch: String,
    version: String,
    release: String,
    type_name: String,
}

#[derive(Serialize)]
struct RuntimeInfo {
    rust: String,
    tauri: String,
    webview: String,
}

#[derive(Serialize)]
struct CpuInfo {
    model: String,
    speed: u64,
    cores: usize,
    usage: Vec<String>,
}

#[derive(Serialize)]
struct MemoryInfo {
    total: u64,
    free: u64,
    used: u64,
    usage_percent: String,
}

#[derive(Serialize)]
struct NetworkInfo {
    interfaces: Vec<String>,
    rx_bytes_per_sec: f64,
    tx_bytes_per_sec: f64,
}

#[derive(Serialize)]
struct StorageDevice {
    name: String,
    total: u64,
    used: u64,
    usage_percent: f64,
}

#[derive(Serialize)]
struct PerformanceInfo {
    hostname: String,
    cpu: CpuInfo,
    memory: MemoryInfo,
    network: NetworkInfo,
    storage: Vec<StorageDevice>,
    uptime: u64,
    loadavg: Vec<f64>,
}

#[tauri::command]
fn get_os_info() -> OsInfo {
    OsInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: System::long_os_version().unwrap_or_else(|| "Unknown".to_string()),
        release: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        type_name: System::name().unwrap_or_else(|| std::env::consts::OS.to_string()),
    }
}

#[tauri::command]
fn get_runtime_info() -> RuntimeInfo {
    RuntimeInfo {
        rust: "native".to_string(),
        tauri: env!("CARGO_PKG_VERSION").to_string(),
        webview: "system webview".to_string(),
    }
}

#[tauri::command]
fn get_performance_info(state: tauri::State<'_, Mutex<TelemetryState>>) -> PerformanceInfo {
    let mut telemetry = state.lock().expect("telemetry state lock poisoned");
    telemetry.system.refresh_all();

    let total_memory = telemetry.system.total_memory();
    let free_memory = telemetry.system.free_memory();
    let used_memory = total_memory.saturating_sub(free_memory);
    let memory_percent = if total_memory > 0 {
        (used_memory as f64 / total_memory as f64) * 100.0
    } else {
        0.0
    };

    let cpus = telemetry.system.cpus();
    let cpu_model = cpus
        .first()
        .map(|cpu| cpu.brand().to_string())
        .filter(|brand| !brand.is_empty())
        .unwrap_or_else(|| "Unknown".to_string());
    let cpu_speed = cpus.first().map(|cpu| cpu.frequency()).unwrap_or_default();
    let cpu_cores = cpus.len();
    let cpu_usage = cpus
        .iter()
        .map(|cpu| format!("{:.2}", cpu.cpu_usage()))
        .collect::<Vec<_>>();

    let network_sample = get_network_sample();
    let (rx_bytes_per_sec, tx_bytes_per_sec) = {
        let rates = match telemetry.previous_network_sample {
            Some(previous) => {
                let elapsed = network_sample
                    .timestamp
                    .duration_since(previous.timestamp)
                    .as_secs_f64()
                    .max(1.0);
                (
                    network_sample.rx_bytes.saturating_sub(previous.rx_bytes) as f64 / elapsed,
                    network_sample.tx_bytes.saturating_sub(previous.tx_bytes) as f64 / elapsed,
                )
            }
            None => (0.0, 0.0),
        };
        rates
    };
    telemetry.previous_network_sample = Some(network_sample);

    let load = System::load_average();

    PerformanceInfo {
        hostname: System::host_name().unwrap_or_else(|| "localhost".to_string()),
        cpu: CpuInfo {
            model: cpu_model,
            speed: cpu_speed,
            cores: cpu_cores,
            usage: cpu_usage,
        },
        memory: MemoryInfo {
            total: total_memory,
            free: free_memory,
            used: used_memory,
            usage_percent: format!("{memory_percent:.2}"),
        },
        network: NetworkInfo {
            interfaces: get_network_interfaces(),
            rx_bytes_per_sec,
            tx_bytes_per_sec,
        },
        storage: get_storage_devices(),
        uptime: System::uptime(),
        loadavg: vec![load.one, load.five, load.fifteen],
    }
}

fn get_network_sample() -> NetworkSample {
    if cfg!(target_os = "macos") {
        return get_darwin_network_sample();
    }

    if cfg!(target_os = "linux") {
        return get_linux_network_sample();
    }

    NetworkSample {
        rx_bytes: 0,
        tx_bytes: 0,
        timestamp: Instant::now(),
    }
}

fn get_darwin_network_sample() -> NetworkSample {
    let mut sample = NetworkSample {
        rx_bytes: 0,
        tx_bytes: 0,
        timestamp: Instant::now(),
    };

    let Ok(output) = Command::new("netstat").arg("-ibn").output() else {
        return sample;
    };
    let text = String::from_utf8_lossy(&output.stdout);

    for row in text.lines().skip(1) {
        let columns = row.split_whitespace().collect::<Vec<_>>();
        let iface = columns.first().copied().unwrap_or_default();
        let rx = columns.get(6).and_then(|value| value.parse::<u64>().ok());
        let tx = columns.get(9).and_then(|value| value.parse::<u64>().ok());

        if !iface.starts_with("lo") {
            sample.rx_bytes = sample.rx_bytes.saturating_add(rx.unwrap_or_default());
            sample.tx_bytes = sample.tx_bytes.saturating_add(tx.unwrap_or_default());
        }
    }

    sample
}

fn get_linux_network_sample() -> NetworkSample {
    let mut sample = NetworkSample {
        rx_bytes: 0,
        tx_bytes: 0,
        timestamp: Instant::now(),
    };

    let Ok(text) = std::fs::read_to_string("/proc/net/dev") else {
        return sample;
    };

    for row in text.lines().skip(2) {
        let Some((iface, data)) = row.split_once(':') else {
            continue;
        };
        let iface = iface.trim();
        let columns = data
            .split_whitespace()
            .filter_map(|value| value.parse::<u64>().ok())
            .collect::<Vec<_>>();

        if !iface.starts_with("lo") {
            sample.rx_bytes = sample.rx_bytes.saturating_add(columns.first().copied().unwrap_or_default());
            sample.tx_bytes = sample.tx_bytes.saturating_add(columns.get(8).copied().unwrap_or_default());
        }
    }

    sample
}

fn get_network_interfaces() -> Vec<String> {
    if cfg!(target_os = "macos") {
        if let Ok(output) = Command::new("ifconfig").arg("-l").output() {
            return String::from_utf8_lossy(&output.stdout)
                .split_whitespace()
                .filter(|name| !name.starts_with("lo"))
                .map(ToString::to_string)
                .collect();
        }
    }

    if cfg!(target_os = "linux") {
        if let Ok(entries) = std::fs::read_dir("/sys/class/net") {
            return entries
                .filter_map(Result::ok)
                .filter_map(|entry| entry.file_name().into_string().ok())
                .filter(|name| !name.starts_with("lo"))
                .collect();
        }
    }

    Vec::new()
}

fn get_storage_devices() -> Vec<StorageDevice> {
    if let Ok(output) = Command::new("df").args(["-kP"]).output() {
        let text = String::from_utf8_lossy(&output.stdout);
        let devices = text
            .lines()
            .skip(1)
            .filter_map(parse_df_row)
            .collect::<Vec<_>>();

        if !devices.is_empty() {
            return devices;
        }
    }

    Disks::new_with_refreshed_list()
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let used = total.saturating_sub(disk.available_space());
            let usage_percent = if total > 0 {
                (used as f64 / total as f64) * 100.0
            } else {
                0.0
            };

            StorageDevice {
                name: disk.name().to_string_lossy().to_string(),
                total,
                used,
                usage_percent,
            }
        })
        .collect()
}

fn parse_df_row(row: &str) -> Option<StorageDevice> {
    let columns = row.split_whitespace().collect::<Vec<_>>();
    if columns.len() < 6 {
        return None;
    }

    let mounted_on = columns[5..].join(" ");
    if mounted_on.starts_with("/dev") || mounted_on.starts_with("/System/Volumes") {
        return None;
    }

    let total = columns.get(1)?.parse::<u64>().ok()?.saturating_mul(1024);
    let used = columns.get(2)?.parse::<u64>().ok()?.saturating_mul(1024);
    let usage_percent = if total > 0 {
        (used as f64 / total as f64) * 100.0
    } else {
        0.0
    };

    Some(StorageDevice {
        name: if mounted_on == "/" {
            "System Disk".to_string()
        } else {
            mounted_on
        },
        total,
        used,
        usage_percent,
    })
}

pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(TelemetryState::default()))
        .invoke_handler(tauri::generate_handler![
            get_os_info,
            get_performance_info,
            get_runtime_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
