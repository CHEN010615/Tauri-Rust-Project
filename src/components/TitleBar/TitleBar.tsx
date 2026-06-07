import { useEffect, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import { Close, CropSquare, Remove } from '@mui/icons-material'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useTranslation } from 'react-i18next'
import styles from './TitleBar.module.scss'

const isMac = /mac/i.test(navigator.platform) || navigator.userAgent.toLowerCase().includes('mac os')

const getAppWindow = () => {
  try {
    return getCurrentWindow()
  } catch {
    return null
  }
}

const TitleBar = () => {
  const { t } = useTranslation()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const syncWindowState = async () => {
      const appWindow = getAppWindow()

      if (!appWindow) {
        return
      }

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
    const appWindow = getAppWindow()
    if (appWindow) {
      void appWindow.onResized(syncWindowState).then(unlisten => {
        cleanup = unlisten
      })
    }

    return () => cleanup?.()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('window-fullscreen', isFullScreen)

    return () => {
      document.documentElement.classList.remove('window-fullscreen')
    }
  }, [isFullScreen])

  const stopWindowDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }

  const handleMinimize = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    await getAppWindow()?.minimize()
  }

  const handleMaximizeToggle = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const appWindow = getAppWindow()

    if (!appWindow) {
      return
    }

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
    await getAppWindow()?.close()
  }

  if (isMac || isFullScreen) {
    return null
  }

  return (
    <header className={`${styles.titlebar} ${isMac ? styles.titlebarMac : ''}`}>
      <div className={styles.dragRegion} data-tauri-drag-region>
        <div className={styles.titleContent} data-tauri-drag-region>
          <span className={styles.logoIcon}>PH</span>
          <span className={styles.appName}>{t('app.brand')}</span>
          <span className={styles.version}>v0.0.1</span>
        </div>
      </div>
      {!isMac && (
        <div className={styles.windowControls}>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnMinimize}`} onPointerDown={stopWindowDrag} onClick={handleMinimize} title={t('window.minimize')}>
            <Remove sx={{ fontSize: 14 }} />
          </button>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnMaximize}`} onPointerDown={stopWindowDrag} onClick={handleMaximizeToggle} title={isMaximized ? t('window.restore') : t('window.maximize')}>
            <CropSquare sx={{ fontSize: 12 }} />
          </button>
          <button type="button" className={`${styles.ctrlBtn} ${styles.btnClose}`} onPointerDown={stopWindowDrag} onClick={handleClose} title={t('window.close')}>
            <Close sx={{ fontSize: 14 }} />
          </button>
        </div>
      )}
    </header>
  )
}

export default TitleBar
