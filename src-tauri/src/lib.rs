use serde::Serialize;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use sysinfo::{Disks, Networks, System};
use tauri::Manager;

mod pal_database;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const GPU_REFRESH_INTERVAL: Duration = Duration::from_secs(6);
const STORAGE_REFRESH_INTERVAL: Duration = Duration::from_secs(30);

struct TelemetryState {
    system: System,
    networks: Networks,
    previous_network_timestamp: Option<Instant>,
    cached_gpu: Option<GpuInfo>,
    last_gpu_refresh: Option<Instant>,
    cached_storage: Vec<StorageDevice>,
    last_storage_refresh: Option<Instant>,
}

impl Default for TelemetryState {
    fn default() -> Self {
        Self {
            system: System::new_all(),
            networks: Networks::new_with_refreshed_list(),
            previous_network_timestamp: None,
            cached_gpu: None,
            last_gpu_refresh: None,
            cached_storage: Vec::new(),
            last_storage_refresh: None,
        }
    }
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
struct DashboardInfo {
    os: OsInfo,
    runtime: RuntimeInfo,
    performance: PerformanceInfo,
}

#[derive(Serialize)]
struct CpuInfo {
    model: String,
    speed: u64,
    cores: usize,
    usage: Vec<String>,
}

#[derive(Clone, Serialize)]
struct GpuInfo {
    model: String,
    usage_percent: Option<f64>,
    temperature_celsius: Option<u64>,
    memory_used: Option<u64>,
    memory_total: Option<u64>,
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

#[derive(Clone, Serialize)]
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
    gpu: Option<GpuInfo>,
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
    collect_performance_info(&mut telemetry)
}

#[tauri::command]
fn get_dashboard_info(state: tauri::State<'_, Mutex<TelemetryState>>) -> DashboardInfo {
    let mut telemetry = state.lock().expect("telemetry state lock poisoned");

    DashboardInfo {
        os: get_os_info(),
        runtime: get_runtime_info(),
        performance: collect_performance_info(&mut telemetry),
    }
}

#[tauri::command]
fn get_pal_wiki_data(
    database: tauri::State<'_, pal_database::PalDatabase>,
) -> Result<Vec<pal_database::PalWikiEntry>, String> {
    database.get_pals()
}

#[tauri::command]
fn get_pal_breeding_results(
    database: tauri::State<'_, pal_database::PalDatabase>,
) -> Result<Vec<pal_database::PalBreedingResult>, String> {
    database.get_breeding_results()
}

#[tauri::command]
fn get_pal_element_images(
    database: tauri::State<'_, pal_database::PalDatabase>,
) -> Result<Vec<pal_database::PalElementImage>, String> {
    database.get_element_images()
}

#[tauri::command]
fn get_pal_work_images(
    database: tauri::State<'_, pal_database::PalDatabase>,
) -> Result<Vec<pal_database::PalWorkImage>, String> {
    database.get_work_images()
}

fn collect_performance_info(telemetry: &mut TelemetryState) -> PerformanceInfo {
    telemetry.system.refresh_cpu_all();
    telemetry.system.refresh_memory();

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

    let now = Instant::now();
    telemetry.networks.refresh(true);
    let elapsed = telemetry
        .previous_network_timestamp
        .map(|timestamp| now.duration_since(timestamp).as_secs_f64().max(1.0))
        .unwrap_or(1.0);
    telemetry.previous_network_timestamp = Some(now);

    let rx_bytes = telemetry
        .networks
        .iter()
        .map(|(_, data)| data.received())
        .sum::<u64>();
    let tx_bytes = telemetry
        .networks
        .iter()
        .map(|(_, data)| data.transmitted())
        .sum::<u64>();
    let network_interfaces = telemetry
        .networks
        .iter()
        .filter(|(name, data)| {
            !name.to_ascii_lowercase().contains("loopback")
                && (data.total_received() > 0 || data.total_transmitted() > 0)
        })
        .map(|(name, _)| name.to_string())
        .collect::<Vec<_>>();

    let load = System::load_average();

    PerformanceInfo {
        hostname: System::host_name().unwrap_or_else(|| "localhost".to_string()),
        cpu: CpuInfo {
            model: cpu_model,
            speed: cpu_speed,
            cores: cpu_cores,
            usage: cpu_usage,
        },
        gpu: get_cached_gpu_info(telemetry, now),
        memory: MemoryInfo {
            total: total_memory,
            free: free_memory,
            used: used_memory,
            usage_percent: format!("{memory_percent:.2}"),
        },
        network: NetworkInfo {
            interfaces: network_interfaces,
            rx_bytes_per_sec: rx_bytes as f64 / elapsed,
            tx_bytes_per_sec: tx_bytes as f64 / elapsed,
        },
        storage: get_cached_storage_devices(telemetry, now),
        uptime: System::uptime(),
        loadavg: if cfg!(windows) {
            Vec::new()
        } else {
            vec![load.one, load.five, load.fifteen]
        },
    }
}

fn should_refresh(last_refresh: Option<Instant>, now: Instant, interval: Duration) -> bool {
    last_refresh
        .map(|last_refresh| now.duration_since(last_refresh) >= interval)
        .unwrap_or(true)
}

fn get_cached_gpu_info(telemetry: &mut TelemetryState, now: Instant) -> Option<GpuInfo> {
    if should_refresh(telemetry.last_gpu_refresh, now, GPU_REFRESH_INTERVAL) {
        if let Some(gpu) = get_gpu_info() {
            telemetry.cached_gpu = Some(gpu);
        }

        telemetry.last_gpu_refresh = Some(now);
    }

    telemetry.cached_gpu.clone()
}

fn get_cached_storage_devices(telemetry: &mut TelemetryState, now: Instant) -> Vec<StorageDevice> {
    if should_refresh(
        telemetry.last_storage_refresh,
        now,
        STORAGE_REFRESH_INTERVAL,
    ) {
        let storage = get_storage_devices();

        if !storage.is_empty() {
            telemetry.cached_storage = storage;
        }

        telemetry.last_storage_refresh = Some(now);
    }

    telemetry.cached_storage.clone()
}

fn get_storage_devices() -> Vec<StorageDevice> {
    if let Ok(output) = background_command("df").args(["-kP"]).output() {
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

fn get_gpu_info() -> Option<GpuInfo> {
    get_nvidia_gpu_info().or_else(get_windows_gpu_info)
}

fn get_nvidia_gpu_info() -> Option<GpuInfo> {
    let output = background_command("nvidia-smi")
        .args([
            "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total",
            "--format=csv,noheader,nounits",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8_lossy(&output.stdout);
    let columns = text
        .lines()
        .find(|line| !line.trim().is_empty())?
        .split(',')
        .map(str::trim)
        .collect::<Vec<_>>();

    let mib_to_bytes = |value: &str| {
        value
            .parse::<u64>()
            .ok()
            .map(|mib| mib.saturating_mul(1024 * 1024))
    };

    Some(GpuInfo {
        model: columns.first()?.to_string(),
        usage_percent: columns.get(1).and_then(|value| value.parse::<f64>().ok()),
        temperature_celsius: columns.get(2).and_then(|value| value.parse::<u64>().ok()),
        memory_used: columns.get(3).and_then(|value| mib_to_bytes(value)),
        memory_total: columns.get(4).and_then(|value| mib_to_bytes(value)),
    })
}

fn get_windows_gpu_info() -> Option<GpuInfo> {
    if !cfg!(windows) {
        return None;
    }

    let output = background_command("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name",
        ])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let model = String::from_utf8_lossy(&output.stdout).trim().to_string();
    (!model.is_empty()).then_some(GpuInfo {
        model,
        usage_percent: None,
        temperature_celsius: None,
        memory_used: None,
        memory_total: None,
    })
}

fn background_command(program: &str) -> Command {
    let command = Command::new(program);

    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    command
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
        .setup(|app| {
            let pal_database = app
                .path()
                .app_data_dir()
                .ok()
                .and_then(|app_data_dir| pal_database::PalDatabase::new(&app_data_dir).ok())
                .or_else(|| pal_database::PalDatabase::new_fallback().ok());

            if let Some(pal_database) = pal_database {
                app.manage(pal_database);
            } else {
                eprintln!("PAL-HUB database initialization failed");
            }

            if let Some(window) = app.get_webview_window("main") {
                if let Err(error) = window.set_decorations(cfg!(target_os = "macos")) {
                    eprintln!("failed to set window decorations: {error}");
                }
                if let Err(error) = window.show() {
                    eprintln!("failed to show main window: {error}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_dashboard_info,
            get_pal_breeding_results,
            get_pal_element_images,
            get_pal_wiki_data,
            get_pal_work_images,
            get_os_info,
            get_performance_info,
            get_runtime_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
