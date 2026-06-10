import { Settings } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './TopBar.module.scss'

const TopBar = () => {
  const { t } = useTranslation()

  return (
    <header className={styles.topbar}>
      <div className={styles.right}>
        <button className={styles.iconBtn} title={t('topbar.settings')}>
          <Settings sx={{ fontSize: 22 }} />
        </button>
        <button className={styles.startBtn}>{t('app.startGame')}</button>
      </div>
    </header>
  )
}

export default TopBar
