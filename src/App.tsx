import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Box, Chip, Paper, Switch, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import {
  Computer,
  DeveloperBoard,
  Dns,
  Download,
  Memory,
  Router,
  Speed,
  Storage,
  Upload
} from '@mui/icons-material'
import { invoke } from '@tauri-apps/api/core'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'
import TitleBar from './components/TitleBar/TitleBar'
import styles from './App.module.scss'

echarts.use([BarChart, LineChart, PieChart, GridComponent, CanvasRenderer])

type OSInfo = {
  platform: string
  arch: string
  version: string
  release: string
  type_name: string
}

type StorageDevice = {
  name: string
  total: number
  used: number
  usage_percent: number
}

type PerformanceInfo = {
  hostname: string
  cpu: {
    model: string
    speed: number
    cores: number
    usage: string[]
  }
  gpu?: {
    model: string
    usage_percent?: number | null
    temperature_celsius?: number | null
    memory_used?: number | null
    memory_total?: number | null
  } | null
  memory: {
    total: number
    free: number
    used: number
    usage_percent: string
  }
  network: {
    interfaces: string[]
    rx_bytes_per_sec?: number
    tx_bytes_per_sec?: number
  }
  storage?: StorageDevice[]
  uptime: number
  loadavg: number[]
}

type RuntimeInfo = {
  rust: string
  tauri: string
  webview: string
}

type DashboardInfo = {
  os: OSInfo
  runtime: RuntimeInfo
  performance: PerformanceInfo
}

type MetricHistory = {
  cpu: number[]
  memory: number[]
  download: number[]
  upload: number[]
}

const cardSx = {
  p: 'var(--card-padding)',
  borderRadius: 'var(--card-radius)',
  bgcolor: 'rgba(243, 244, 246, 0.6)',
  border: '1px solid #E5E7EB',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
  backdropFilter: 'blur(12px)',
  overflow: 'hidden'
}

const labelSx = {
  color: '#4B5563',
  fontSize: 'var(--label-font)',
  fontWeight: 800,
  letterSpacing: '0.05em',
  lineHeight: 'var(--label-line)',
  textTransform: 'uppercase'
}

const emptyHistory = Array.from({ length: 8 }, () => 0)

const formatBytes = (value?: number) => {
  if (!value || value <= 0) {
    return '0 GB'
  }

  const gb = value / 1024 / 1024 / 1024
  return gb >= 1024 ? `${(gb / 1024).toFixed(1)} TB` : `${gb.toFixed(1)} GB`
}

const formatRate = (value?: number) => {
  if (!value || value <= 0) {
    return { value: '0', unit: 'KB/s' }
  }

  if (value >= 1024 * 1024) {
    return { value: (value / 1024 / 1024).toFixed(1), unit: 'MB/s' }
  }

  return { value: Math.round(value / 1024).toString(), unit: 'KB/s' }
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

const parsePercent = (value?: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? clampPercent(parsed) : 0
}

const rotateMetricHistory = (values: number[], nextValue: number) => [...values.slice(1), nextValue]
const appendPercentHistory = (values: number[], nextValue: number) => [...values.slice(-7), clampPercent(nextValue)]
const appendMetricHistory = (values: number[], nextValue: number) => [...values.slice(-7), Math.max(0, nextValue)]

const EChart = ({ option, height }: { option: EChartsCoreOption; height: number | string }) => {
  const chartRef = useRef<HTMLDivElement | null>(null)
  const chartInstanceRef = useRef<ReturnType<typeof echarts.init> | null>(null)
  const resizeFrameRef = useRef<number | null>(null)

  const scheduleResize = () => {
    if (resizeFrameRef.current !== null) {
      window.cancelAnimationFrame(resizeFrameRef.current)
    }

    resizeFrameRef.current = window.requestAnimationFrame(() => {
      resizeFrameRef.current = null
      chartInstanceRef.current?.resize()
    })
  }

  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    chartInstanceRef.current = echarts.getInstanceByDom(chartRef.current) ?? echarts.init(chartRef.current, undefined, { renderer: 'canvas' })
    const resizeObserver = new ResizeObserver(scheduleResize)

    resizeObserver.observe(chartRef.current)
    window.addEventListener('resize', scheduleResize)
    scheduleResize()

    return () => {
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current)
        resizeFrameRef.current = null
      }

      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleResize)
      chartInstanceRef.current?.dispose()
      chartInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    chartInstanceRef.current?.setOption(option, { notMerge: false, lazyUpdate: true })
  }, [option])

  return <Box ref={chartRef} sx={{ width: '100%', minWidth: 0, height, overflow: 'hidden' }} />
}

const donutOption = (value: number, color = '#0065CC'): EChartsCoreOption => ({
  animationDuration: 500,
  series: [
    {
      type: 'pie',
      radius: ['80%', '92%'],
      center: ['50%', '50%'],
      startAngle: 90,
      clockwise: true,
      silent: true,
      label: { show: false },
      data: [
        { value, itemStyle: { color, borderRadius: 10 } },
        { value: Math.max(100 - value, 0), itemStyle: { color: '#E5E7EB' } }
      ]
    }
  ]
})

const lineOption = (values: number[], color = '#6AA0E0'): EChartsCoreOption => ({
  animationDuration: 450,
  grid: { top: 8, right: 4, bottom: 6, left: 4 },
  xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map((_, index) => index) },
  yAxis: { type: 'value', show: false, min: 0, max: Math.max(1, ...values) },
  series: [{ type: 'line', data: values, showSymbol: false, smooth: false, lineStyle: { width: 4, color, cap: 'round', join: 'round' }, emphasis: { disabled: true } }]
})

const progressOption = (value: number, color = '#0065CC'): EChartsCoreOption => ({
  animationDuration: 450,
  grid: { top: 0, right: 0, bottom: 0, left: 0 },
  xAxis: { type: 'value', show: false, min: 0, max: 100 },
  yAxis: { type: 'category', show: false, data: ['value'] },
  series: [
    { type: 'bar', data: [100], barWidth: 10, silent: true, itemStyle: { color: '#E5E7EB', borderRadius: 10 }, barGap: '-100%' },
    { type: 'bar', data: [clampPercent(value)], barWidth: 10, silent: true, itemStyle: { color, borderRadius: 10 } }
  ]
})

const CircularMetric = ({ value, label, color = '#0065CC' }: { value: number; label: string; color?: string }) => (
  <Box sx={{ width: 'var(--donut-size)', height: 'var(--donut-size)', mx: 'auto', mt: 'calc(var(--dashboard-gap) * 0.75)', position: 'relative' }}>
    <EChart option={donutOption(value, color)} height="var(--donut-size)" />
    <Box sx={{ position: 'absolute', inset: 'var(--donut-inner-inset)', borderRadius: '50%', bgcolor: '#F9FAFB', display: 'grid', placeItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ color, fontSize: 'var(--donut-value-font)', fontWeight: 800, lineHeight: 1 }}>{Math.round(value)}%</Typography>
        <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.25)', color: '#6B7280', fontSize: 'var(--donut-label-font)', fontWeight: 800, letterSpacing: '0.04em' }}>{label}</Typography>
      </Box>
    </Box>
  </Box>
)

const MemoryBarChart = ({ values, color }: { values: number[]; color: string }) => (
  <Box sx={{ height: 'var(--memory-chart-height)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 'clamp(8px, 1vw, 14px)', overflow: 'hidden' }}>
    {values.map((value, index) => (
      <Box key={index} sx={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end', minWidth: 0 }}>
        <Box
          sx={{
            width: '100%',
            height: `${clampPercent(value)}%`,
            minHeight: value > 0 ? 4 : 0,
            borderRadius: '4px 4px 0 0',
            bgcolor: color,
            transition: 'height 850ms cubic-bezier(0.22, 1, 0.36, 1), background-color 220ms ease'
          }}
        />
      </Box>
    ))}
  </Box>
)

const SmallMetricChart = ({ icon, label, rate, values }: { icon: ReactNode; label: string; rate: { value: string; unit: string }; values: number[] }) => (
  <Box sx={{ p: 'calc(var(--card-padding) * 0.82)', borderRadius: 'var(--small-radius)', bgcolor: 'rgba(239, 246, 255, 0.75)' }}>
    <Box sx={{ display: 'flex', gap: 'calc(var(--dashboard-gap) * 0.65)', alignItems: 'center' }}>
      {icon}
      <Typography sx={labelSx}>{label}</Typography>
    </Box>
    <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.45)', color: '#0065CC', fontSize: 'var(--card-title-font)', fontWeight: 900 }}>
      {rate.value} <Box component="span" sx={{ fontSize: 'var(--body-font)', fontWeight: 700 }}>{rate.unit}</Box>
    </Typography>
    <EChart option={lineOption(values, '#6AA0E0')} height="var(--sparkline-height)" />
  </Box>
)

const StorageIcon = ({ index }: { index: number }) => (
  <Box sx={{ color: '#0065CC', display: 'grid', placeItems: 'center', '& svg': { fontSize: 'var(--summary-icon-font)' } }}>
    {index === 0 ? <Storage /> : <Dns />}
  </Box>
)

const StorageDeviceRow = ({ device, index, name, isLast }: { device: StorageDevice; index: number; name: string; isLast: boolean }) => (
  <Box sx={{ p: 'calc(var(--card-padding) * 0.78)', mb: isLast ? 0 : 'calc(var(--dashboard-gap) * 0.55)', borderRadius: 'var(--small-radius)', border: '1px solid #E5E7EB', bgcolor: 'rgba(255, 255, 255, 0.7)' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'var(--summary-icon-size) 1fr', sm: 'var(--summary-icon-size) 1fr auto' }, alignItems: 'center', gap: 'var(--dashboard-gap)' }}>
      <StorageIcon index={index} />
      <Typography sx={{ fontSize: 'var(--summary-font)', fontWeight: 900 }}>{name}</Typography>
      <Typography sx={{ color: '#4B5563', fontSize: 'var(--body-font)', fontWeight: 700, gridColumn: { xs: '2', sm: 'auto' } }}>{formatBytes(device.used)} / {formatBytes(device.total)}</Typography>
    </Box>
    <Box sx={{ mt: 'calc(var(--dashboard-gap) * 0.45)', ml: { xs: 0, sm: 'calc(var(--summary-icon-size) + var(--dashboard-gap))' } }}>
      <EChart option={progressOption(device.usage_percent)} height="var(--progress-height)" />
    </Box>
  </Box>
)

const StorageDeviceTile = ({ device, index, name }: { device: StorageDevice; index: number; name: string }) => (
  <Box sx={{ minHeight: 0, height: '100%', p: 'clamp(6px, min(0.75vw, 1.05vh), 10px)', borderRadius: 'var(--small-radius)', border: '1px solid #E5E7EB', bgcolor: 'rgba(255, 255, 255, 0.7)', display: 'grid', gridTemplateRows: 'minmax(0, 1fr) var(--progress-height)', alignItems: 'center', gap: 'clamp(3px, 0.55vh, 6px)', overflow: 'hidden' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'clamp(24px, min(2.35vw, 3.3vh), 34px) minmax(0, 1fr)', alignItems: 'center', gap: 'calc(var(--dashboard-gap) * 0.55)', minWidth: 0, minHeight: 0 }}>
      <Box sx={{ color: '#0065CC', display: 'grid', placeItems: 'center', '& svg': { fontSize: 'clamp(18px, min(1.8vw, 2.52vh), 24px)' } }}>
        {index === 0 ? <Storage /> : <Dns />}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 'var(--body-font)', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
        <Typography sx={{ color: '#4B5563', fontSize: 'var(--interface-font)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatBytes(device.used)} / {formatBytes(device.total)}</Typography>
      </Box>
    </Box>
    <Box sx={{ height: 'var(--progress-height)', borderRadius: 999, bgcolor: '#E5E7EB', overflow: 'hidden', minWidth: 0 }}>
      <Box sx={{ width: `${clampPercent(device.usage_percent)}%`, height: '100%', borderRadius: 999, bgcolor: '#0065CC', transition: 'width 450ms ease' }} />
    </Box>
  </Box>
)

const StorageDeviceRing = ({ device, name }: { device: StorageDevice; name: string }) => (
  <Box sx={{ minHeight: 0, height: '100%', minWidth: 'var(--storage-scroll-item-width)', px: 'calc(var(--card-padding) * 0.72)', py: 'var(--storage-ring-padding-y)', borderRadius: 'var(--small-radius)', border: '1px solid #E5E7EB', bgcolor: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'calc(var(--dashboard-gap) * 0.5)' }}>
    <Box sx={{ width: 'var(--storage-ring-size)', height: 'var(--storage-ring-size)', position: 'relative' }}>
      <EChart option={donutOption(device.usage_percent)} height="var(--storage-ring-size)" />
      <Box sx={{ position: 'absolute', inset: 'calc(var(--donut-inner-inset) * 0.7)', borderRadius: '50%', bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ color: '#0065CC', fontSize: 'var(--body-font)', fontWeight: 900, lineHeight: 1 }}>{Math.round(device.usage_percent)}%</Typography>
      </Box>
    </Box>
    <Box sx={{ width: '100%', minWidth: 0, textAlign: 'center' }}>
      <Typography sx={{ fontSize: 'var(--body-font)', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Typography>
      <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.2)', color: '#4B5563', fontSize: 'var(--interface-font)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatBytes(device.used)} / {formatBytes(device.total)}</Typography>
    </Box>
  </Box>
)

function App() {
  const { t, i18n } = useTranslation()
  const [osInfo, setOsInfo] = useState<OSInfo | null>(null)
  const [performanceInfo, setPerformanceInfo] = useState<PerformanceInfo | null>(null)
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null)
  const [history, setHistory] = useState<MetricHistory>({ cpu: emptyHistory, memory: emptyHistory, download: emptyHistory, upload: emptyHistory })
  const [loading, setLoading] = useState({ os: false, runtime: false, performance: false })
  const [error, setError] = useState<{ os: string | null; runtime: string | null; performance: string | null }>({ os: null, runtime: null, performance: null })

  const applyPerformanceInfo = (info: PerformanceInfo) => {
    const cpuValues = info.cpu.usage.map(Number).filter(Number.isFinite)
    const cpuUsage = cpuValues.length ? cpuValues.reduce((sum, value) => sum + value, 0) / cpuValues.length : 0
    const memoryUsage = parsePercent(info.memory.usage_percent)

    setPerformanceInfo(info)
    setHistory(prev => ({
      cpu: appendPercentHistory(prev.cpu, cpuUsage),
      memory: rotateMetricHistory(prev.memory, memoryUsage),
      download: appendMetricHistory(prev.download, info.network.rx_bytes_per_sec ?? 0),
      upload: appendMetricHistory(prev.upload, info.network.tx_bytes_per_sec ?? 0)
    }))
  }

  const handleGetDashboardInfo = async () => {
    setLoading({ os: true, runtime: true, performance: true })
    setError({ os: null, runtime: null, performance: null })

    try {
      const info = await invoke<DashboardInfo>('get_dashboard_info')

      setOsInfo(info.os)
      setRuntimeInfo(info.runtime)
      applyPerformanceInfo(info.performance)
    } catch {
      setError({
        os: t('errors.os'),
        runtime: t('errors.node'),
        performance: t('errors.performance')
      })
    } finally {
      setLoading({ os: false, runtime: false, performance: false })
    }
  }

  const handleGetPerformanceInfo = async (silent = false) => {
    if (!silent) {
      setLoading(prev => ({ ...prev, performance: true }))
    }
    setError(prev => ({ ...prev, performance: null }))

    try {
      applyPerformanceInfo(await invoke<PerformanceInfo>('get_performance_info'))
    } catch {
      setError(prev => ({ ...prev, performance: t('errors.performance') }))
    } finally {
      if (!silent) {
        setLoading(prev => ({ ...prev, performance: false }))
      }
    }
  }

  useEffect(() => {
    void handleGetDashboardInfo()

    const timer = window.setInterval(() => {
      void handleGetPerformanceInfo(true)
    }, 2000)

    return () => window.clearInterval(timer)
  }, [])

  const cpuUsage = useMemo(() => history.cpu.at(-1) ?? 0, [history.cpu])
  const gpuInfo = performanceInfo?.gpu
  const hasGpu = Boolean(gpuInfo?.model)
  const gpuUsage = clampPercent(gpuInfo?.usage_percent ?? 0)
  const gpuMemoryUsage = gpuInfo?.memory_used && gpuInfo.memory_total
    ? clampPercent((gpuInfo.memory_used / gpuInfo.memory_total) * 100)
    : gpuUsage
  const gpuTemperature = gpuInfo?.temperature_celsius ? `${gpuInfo.temperature_celsius} C` : '--'
  const gpuMemoryText = gpuInfo?.memory_used && gpuInfo.memory_total
    ? `${formatBytes(gpuInfo.memory_used)} / ${formatBytes(gpuInfo.memory_total)}`
    : '--'
  const memoryUsage = parsePercent(performanceInfo?.memory.usage_percent)
  const memoryStatus = memoryUsage >= 80 ? t('metrics.highUsage') : t('metrics.healthy')
  const memoryColor = memoryUsage >= 80 ? '#C45A00' : '#0F8A55'
  const uptimeHours = performanceInfo ? (performanceInfo.uptime / 3600).toFixed(1) : '--'
  const loadAverage = performanceInfo?.loadavg.length ? performanceInfo.loadavg.map(value => value.toFixed(2)).join(' / ') : '--'
  const downloadRate = formatRate(performanceInfo?.network.rx_bytes_per_sec)
  const uploadRate = formatRate(performanceInfo?.network.tx_bytes_per_sec)
  const networkInterfaces = performanceInfo?.network.interfaces ?? []
  const isEnglish = i18n.language === 'en'
  const storageDevices = performanceInfo?.storage?.length
    ? performanceInfo.storage
    : [
        { name: t('hardware.driveC'), total: 1024 ** 4, used: 450 * 1024 ** 3, usage_percent: 45 },
        { name: t('hardware.driveD'), total: 4 * 1024 ** 4, used: 2 * 1024 ** 4, usage_percent: 50 }
      ]
  const topMetricSpan = hasGpu ? 4 : 6
  const summaryItems = [
    { icon: <Speed />, label: t('metrics.cpu'), value: performanceInfo?.cpu.model ?? t('status.notAvailable') },
    ...(hasGpu ? [{ icon: <Memory />, label: t('metrics.gpu'), value: gpuInfo?.model ?? t('status.notAvailable') }] : []),
    { icon: <DeveloperBoard />, label: isEnglish ? 'System' : '系统', value: osInfo ? `${osInfo.type_name} ${osInfo.arch}` : t('status.notAvailable') }
  ]
  const summarySpan = summaryItems.length === 2 ? 6 : 4

  return (
    <Box className={styles.appShell} sx={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#111827', background: 'radial-gradient(circle at 15% 0%, rgba(59, 130, 246, 0.08), transparent 28%), linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 48%, #F4F7FF 100%)' }}>
      <TitleBar />
      <Box className={styles.mainContent} component="main" sx={{ flex: 1, minHeight: 0, overflow: 'hidden', py: 'var(--page-pad-y)', px: 'var(--page-pad-x)' }}>
        <Box className={styles.contentFrame} sx={{ mx: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--dashboard-gap)', flexWrap: 'wrap', mb: 'var(--dashboard-gap)' }}>
            <Box>
              <Typography sx={{ ...labelSx, color: '#2563EB' }}>{t('app.brand')}</Typography>
              <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.2)', fontSize: 'var(--page-title-font)', fontWeight: 800, lineHeight: 1.08 }}>{t('app.title')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 'var(--control-gap)', flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--control-gap) * 0.75)', px: 'var(--control-pad-x)', py: 'var(--control-pad-y)', borderRadius: 'var(--small-radius)', bgcolor: 'rgba(255, 255, 255, 0.72)', border: '1px solid #E5E7EB' }}>
                <Typography sx={{ color: isEnglish ? '#6B7280' : '#1D4ED8', fontSize: 'var(--body-font)', fontWeight: 800 }}>{t('language.zh')}</Typography>
                <Switch size="small" checked={isEnglish} onChange={event => void i18n.changeLanguage(event.target.checked ? 'en' : 'zh')} inputProps={{ 'aria-label': t('language.switchLabel') }} />
                <Typography sx={{ color: isEnglish ? '#1D4ED8' : '#6B7280', fontSize: 'var(--body-font)', fontWeight: 800 }}>{t('language.en')}</Typography>
              </Box>
              <Chip label={loading.os || loading.performance || loading.runtime ? t('status.syncing') : t('status.live')} sx={{ bgcolor: '#E8F7EF', color: '#047857', fontWeight: 800, borderRadius: 2 }} />
              <Chip label={performanceInfo?.hostname ?? t('status.localhost')} sx={{ bgcolor: '#EEF2FF', color: '#1D4ED8', fontWeight: 800, borderRadius: 2 }} />
            </Box>
          </Box>

          {(error.os || error.performance || error.runtime) && (
            <Alert severity="error" sx={{ mb: 'var(--dashboard-gap)', borderRadius: 'var(--small-radius)' }}>{error.os || error.performance || error.runtime}</Alert>
          )}

          <Box className={styles.dashboardGrid} sx={{ flex: 1, minHeight: 0, height: '100%', display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gridTemplateRows: { xs: 'none', md: 'minmax(0, 1.55fr) minmax(0, 1.05fr) minmax(0, 0.48fr) minmax(0, 0.36fr)' }, gap: 'var(--dashboard-gap)' }}>
            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: `span ${topMetricSpan}` } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--dashboard-gap)' }}>
                <Box>
                  <Typography sx={labelSx}>{t('metrics.cpuLoad')}</Typography>
                  <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.3)', fontSize: 'var(--card-title-font)', fontWeight: 800 }}>{t('metrics.processor')}</Typography>
                </Box>
                <Chip label={performanceInfo ? t('metrics.cores', { coreCount: performanceInfo.cpu.cores }) : '--'} sx={{ bgcolor: '#DBEAFE', color: '#075BBF', fontWeight: 800 }} />
              </Box>
              <CircularMetric value={cpuUsage} label={cpuUsage > 75 ? t('metrics.busy') : t('metrics.stable')} />
              <Box sx={{ mt: 'calc(var(--dashboard-gap) * 0.75)', color: '#4B5563', fontSize: 'var(--body-font)', fontWeight: 600 }}>
                <Typography sx={{ fontWeight: 800, color: '#111827' }}>{performanceInfo?.cpu.model ?? t('hardware.processorLoading')}</Typography>
                <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.3)' }}>{performanceInfo ? `${performanceInfo.cpu.speed} MHz | ${t('metrics.uptime', { hours: uptimeHours })}` : t('status.waitingTelemetry')}</Typography>
              </Box>
            </Paper>

            {hasGpu && (
              <Paper elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: `span ${topMetricSpan}` } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--dashboard-gap)' }}>
                  <Box>
                    <Typography sx={labelSx}>{t('metrics.gpuPerformance')}</Typography>
                    <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.3)', fontSize: 'var(--card-title-font)', fontWeight: 800 }}>{t('metrics.graphics')}</Typography>
                  </Box>
                  <Chip label={gpuTemperature} sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 800 }} />
                </Box>
                <CircularMetric value={gpuUsage} label={gpuInfo?.usage_percent != null ? (isEnglish ? 'GPU USED' : 'GPU 使用率') : t('status.notAvailable')} />
                <Box sx={{ mt: 'calc(var(--dashboard-gap) * 0.75)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 'calc(var(--dashboard-gap) * 0.6)' }}>
                    <Typography sx={labelSx}>{t('metrics.vramUsage')}</Typography>
                    <Typography sx={{ color: '#4B5563', fontWeight: 800 }}>{gpuMemoryText}</Typography>
                  </Box>
                  <EChart option={progressOption(gpuMemoryUsage)} height="var(--progress-height)" />
                </Box>
              </Paper>
            )}

            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: `span ${topMetricSpan}` } }}>
              <Typography sx={labelSx}>{t('metrics.memoryAllocation')}</Typography>
              <Typography sx={{ mt: 'calc(var(--dashboard-gap) * 0.3)', fontSize: 'var(--card-title-font)', fontWeight: 800 }}>{t('metrics.systemRam')}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 'calc(var(--dashboard-gap) * 0.65)', mt: 'calc(var(--dashboard-gap) * 0.9)', flexWrap: 'wrap' }}>
                <Typography sx={{ color: memoryColor, fontSize: 'var(--metric-font)', fontWeight: 900, lineHeight: 1 }}>{formatBytes(performanceInfo?.memory.used).replace(/ (GB|TB)$/, '')}</Typography>
                <Typography sx={{ color: '#6B7280', fontSize: 'var(--metric-sub-font)', fontWeight: 800 }}>/ {formatBytes(performanceInfo?.memory.total)}</Typography>
              </Box>
              <Chip label={`${Math.round(memoryUsage)}% - ${memoryStatus}`} sx={{ mt: 'calc(var(--dashboard-gap) * 0.6)', bgcolor: memoryUsage >= 80 ? '#C45A00' : '#D1FAE5', color: memoryUsage >= 80 ? '#FFFFFF' : '#065F46', fontWeight: 900, borderRadius: 'var(--small-radius)' }} />
              <Box sx={{ height: 'var(--memory-chart-height)', mt: 'calc(var(--dashboard-gap) * 0.75)' }}>
                <MemoryBarChart values={history.memory} color={memoryColor} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'calc(var(--dashboard-gap) * 0.6)' }}>
                <Typography sx={{ fontWeight: 800 }}><Box component="span" sx={{ display: 'inline-block', width: 'var(--legend-dot-size)', height: 'var(--legend-dot-size)', mr: 'calc(var(--control-gap) * 0.75)', borderRadius: '50%', bgcolor: memoryColor }} />{t('metrics.active')}</Typography>
                <Typography sx={{ color: '#374151', fontWeight: 800 }}><Box component="span" sx={{ display: 'inline-block', width: 'var(--legend-dot-size)', height: 'var(--legend-dot-size)', mr: 'calc(var(--control-gap) * 0.75)', borderRadius: '50%', bgcolor: '#D1D5DB' }} />{t('metrics.standby')}</Typography>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: 'span 6' }, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 'calc(var(--dashboard-gap) * 0.75)' }}>
                <Typography sx={{ fontSize: 'var(--section-title-font)', fontWeight: 800 }}>{t('metrics.networkActivity')}</Typography>
                <Router sx={{ color: '#0065CC', fontSize: 'calc(var(--section-title-font) * 1.25)' }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 'var(--dashboard-gap)' }}>
                <SmallMetricChart icon={<Download sx={{ color: '#0065CC' }} />} label={t('metrics.download')} rate={downloadRate} values={history.download} />
                <SmallMetricChart icon={<Upload sx={{ color: '#0065CC' }} />} label={t('metrics.upload')} rate={uploadRate} values={history.upload} />
              </Box>
              <Box sx={{ mt: 'calc(var(--dashboard-gap) * 0.6)', display: 'flex', alignItems: 'flex-start', gap: 'calc(var(--dashboard-gap) * 0.5)', minHeight: 'var(--network-interface-height)', pb: 'calc(var(--card-padding) * 0.35)' }}>
                <Typography sx={{ color: '#6B7280', fontSize: 'var(--interface-font)', fontWeight: 800, lineHeight: 1.5, flexShrink: 0 }}>{t('metrics.interfaces')}:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--dashboard-gap) * 0.35)', minWidth: 0 }}>
                  {networkInterfaces.length ? networkInterfaces.map(networkInterface => (
                    <Box key={networkInterface} component="span" sx={{ px: 'calc(var(--control-pad-x) * 0.55)', py: '1px', borderRadius: 'var(--small-radius)', bgcolor: 'rgba(219, 234, 254, 0.8)', color: '#1D4ED8', fontSize: 'var(--interface-font)', fontWeight: 800, lineHeight: 1.45 }}>{networkInterface}</Box>
                  )) : (
                    <Typography sx={{ color: '#6B7280', fontSize: 'var(--interface-font)', fontWeight: 600, lineHeight: 1.5 }}>{t('metrics.detectingAdapters')}</Typography>
                  )}
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: 'span 6' }, display: 'flex', flexDirection: 'column', pb: 'calc(var(--card-padding) * 0.85)' }}>
              <Typography sx={{ fontSize: 'var(--section-title-font)', fontWeight: 800, mb: 'calc(var(--dashboard-gap) * 0.75)' }}>{t('metrics.storageDevices')}</Typography>
              {storageDevices.length <= 2 && <Box sx={{ minHeight: 0 }}>{storageDevices.map((device, index) => <StorageDeviceRow key={`${device.name}-${index}`} device={device} index={index} name={device.name === 'System Disk' ? t('hardware.systemDisk') : device.name} isLast={index === storageDevices.length - 1} />)}</Box>}
              {storageDevices.length > 2 && storageDevices.length <= 4 && (
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gridTemplateRows: { sm: 'repeat(2, minmax(0, 1fr))' }, gap: 'clamp(5px, min(0.75vw, 1.05vh), 10px)' }}>
                  {storageDevices.map((device, index) => <StorageDeviceTile key={`${device.name}-${index}`} device={device} index={index} name={device.name === 'System Disk' ? t('hardware.systemDisk') : device.name} />)}
                </Box>
              )}
              {storageDevices.length > 4 && (
                <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 'calc(var(--dashboard-gap) * 0.65)', overflowX: 'auto', overflowY: 'hidden', pb: 'calc(var(--card-padding) * 0.55)', scrollSnapType: 'x proximity', '&::-webkit-scrollbar': { height: 8 }, '&::-webkit-scrollbar-track': { bgcolor: 'rgba(229, 231, 235, 0.75)', borderRadius: 999 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0, 101, 204, 0.45)', borderRadius: 999 } }}>
                  {storageDevices.map((device, index) => <Box key={`${device.name}-${index}`} sx={{ height: '100%', scrollSnapAlign: 'start' }}><StorageDeviceRing device={device} name={device.name === 'System Disk' ? t('hardware.systemDisk') : device.name} /></Box>)}
                </Box>
              )}
            </Paper>

            {summaryItems.map(item => (
              <Paper key={item.label} elevation={0} sx={{ ...cardSx, gridColumn: { xs: '1', md: `span ${summarySpan}` }, display: 'flex', alignItems: 'center', gap: 'var(--dashboard-gap)' }}>
                <Box sx={{ width: 'var(--summary-icon-size)', height: 'var(--summary-icon-size)', borderRadius: 'var(--small-radius)', bgcolor: '#E8F1FF', color: '#0065CC', display: 'grid', placeItems: 'center', flexShrink: 0, '& svg': { fontSize: 'var(--summary-icon-font)' } }}>{item.icon}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={labelSx}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 'var(--summary-font)', fontWeight: 900, lineHeight: 1.15, overflowWrap: 'anywhere' }}>{item.value}</Typography>
                </Box>
              </Paper>
            ))}

            <Paper elevation={0} sx={{ ...cardSx, py: 'calc(var(--card-padding) * 0.7)', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--dashboard-gap)', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 'var(--dashboard-gap)' }}>
                <Computer sx={{ color: '#0065CC' }} />
                <Typography sx={{ color: '#4B5563', fontSize: 'var(--body-font)', fontWeight: 700 }}>Rust {runtimeInfo?.rust || t('status.notAvailable')} | App {runtimeInfo?.tauri || t('status.notAvailable')} | {runtimeInfo?.webview || 'WebView'}</Typography>
              </Box>
              <Typography sx={{ color: '#4B5563', fontSize: 'var(--body-font)', fontWeight: 700, display: 'flex', alignItems: 'center', minHeight: 'var(--summary-icon-size)' }}>{t('metrics.loadAvg')}: {loadAverage} | {t('metrics.release')}: {osInfo?.release || '--'}</Typography>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default App
