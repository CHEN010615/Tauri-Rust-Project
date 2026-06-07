import { useEffect, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { Close, CropSquare, Remove } from '@mui/icons-material'
import { getCurrentWindow } from '@tauri-apps/api/window'
import styles from './TitleBar.module.scss'

const appWindow = getCurrentWindow()

const isMac = /mac/i.test(navigator.platform) || navigator.userAgent.toLowerCase().includes('mac os')

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const syncWindowState = async () => {
      try {
        const [maximized, fullscreen] = await Promise.all([
          appWindow.isMaximized(),
          appWindow.isFullscreen()
        ])
        setIsMaximized(maximized)
        setIsFullScreen(fullscreen)
      } catch {
        // The Vite-only browser preview has no native Tauri window.
      }
    }

    void syncWindowState()
    void appWindow.onResized(syncWindowState).then(unlisten => {
      cleanup = unlisten
    })

    return () => cleanup?.()
  }, [])

  const stopWindowDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const handleMinimize = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    await appWindow.minimize()
  }

  const handleMaximizeToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const maximized = await appWindow.isMaximized()

    if (maximized) {
      await appWindow.unmaximize()
      setIsMaximized(false)
    } else {
      await appWindow.maximize()
      setIsMaximized(true)
    }
  }

  const handleClose = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    await appWindow.close()
  }

  if (isMac || isFullScreen) {
    return null
  }

  return (
    <header className={`${styles.titlebar} ${isMac ? styles.titlebarMac : ''}`}>
      <div className={styles.dragRegion} data-tauri-drag-region>
        <div className={styles.titleContent} data-tauri-drag-region>
          <span className={styles.logoIcon}>PC</span>
          <span className={styles.appName}>PluginCore</span>
          <span className={styles.version}>v0.1.0</span>
        </div>
      </div>
      {!isMac && (
        <div className={styles.windowControls}>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnMinimize}`} onPointerDown={stopWindowDrag} onClick={handleMinimize} title="最小化">
            <Remove sx={{ fontSize: 14 }} />
          </button>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnMaximize}`} onPointerDown={stopWindowDrag} onClick={handleMaximizeToggle} title={isMaximized ? '还原' : '最大化'}>
            <CropSquare sx={{ fontSize: 12 }} />
          </button>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnClose}`} onPointerDown={stopWindowDrag} onClick={handleClose} title="关闭">
            <Close sx={{ fontSize: 14 }} />
          </button>
        </div>
      )}
    </header>
  )
}

export default TitleBar
