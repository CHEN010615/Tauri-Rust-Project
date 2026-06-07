const resources = {
  zh: {
    translation: {
      app: {
        brand: 'Precision Monitor',
        title: 'PC 资源监控看板'
      },
      language: {
        zh: '中文',
        en: 'EN',
        switchLabel: '切换语言'
      },
      status: {
        syncing: '同步中',
        live: '实时',
        localhost: '本地主机',
        notAvailable: '未获取',
        waitingTelemetry: '等待遥测数据'
      },
      errors: {
        os: '获取操作系统信息失败',
        performance: '获取系统性能信息失败',
        node: '获取运行时信息失败'
      },
      metrics: {
        cpuLoad: 'CPU 负载',
        processor: '处理器',
        cores: '{{coreCount}} 核',
        busy: '繁忙',
        stable: '稳定',
        uptime: '{{hours}} 小时运行',
        gpuPerformance: 'GPU 性能',
        graphics: '显卡',
        vramUsed: '显存已用',
        vramUsage: '显存使用率',
        memoryAllocation: '内存分配',
        systemRam: '系统内存',
        highUsage: '高占用',
        healthy: '健康',
        active: '活跃',
        standby: '待机',
        networkActivity: '网络活动',
        download: '下载',
        upload: '上传',
        interfaces: '网络接口',
        detectingAdapters: '正在检测网络适配器',
        storageDevices: '存储设备',
        cpu: 'CPU',
        gpu: 'GPU',
        motherboard: '主板',
        loadAvg: '系统负载',
        release: '发行版'
      },
      hardware: {
        processorLoading: '正在加载处理器信息',
        driveC: 'Drive C: (SSD)',
        driveD: 'Drive D: (HDD)',
        systemDisk: '系统磁盘',
        gpuModel: 'NVIDIA GeForce RTX 4090',
        motherboardModel: 'ASUS ROG Z790'
      }
    }
  },
  en: {
    translation: {
      app: {
        brand: 'Precision Monitor',
        title: 'PC Resource Dashboard'
      },
      language: {
        zh: '中文',
        en: 'EN',
        switchLabel: 'Switch language'
      },
      status: {
        syncing: 'SYNCING',
        live: 'LIVE',
        localhost: 'LOCALHOST',
        notAvailable: 'Unavailable',
        waitingTelemetry: 'Waiting for telemetry'
      },
      errors: {
        os: 'Failed to fetch operating system information',
        performance: 'Failed to fetch system performance information',
        node: 'Failed to fetch runtime information'
      },
      metrics: {
        cpuLoad: 'CPU Load',
        processor: 'Processor',
        cores: '{{coreCount}} cores',
        busy: 'BUSY',
        stable: 'STABLE',
        uptime: '{{hours}}h uptime',
        gpuPerformance: 'GPU Performance',
        graphics: 'Graphics',
        vramUsed: 'VRAM USED',
        vramUsage: 'VRAM Usage',
        memoryAllocation: 'Memory Allocation',
        systemRam: 'System RAM',
        highUsage: 'HIGH USAGE',
        healthy: 'HEALTHY',
        active: 'Active',
        standby: 'Standby',
        networkActivity: 'Network Activity',
        download: 'Download',
        upload: 'Upload',
        interfaces: 'Interfaces',
        detectingAdapters: 'Detecting network adapters',
        storageDevices: 'Storage Devices',
        cpu: 'CPU',
        gpu: 'GPU',
        motherboard: 'Motherboard',
        loadAvg: 'Load Avg',
        release: 'Release'
      },
      hardware: {
        processorLoading: 'Processor information loading',
        driveC: 'Drive C: (SSD)',
        driveD: 'Drive D: (HDD)',
        systemDisk: 'System Disk',
        gpuModel: 'NVIDIA GeForce RTX 4090',
        motherboardModel: 'ASUS ROG Z790'
      }
    }
  }
}

export default resources
