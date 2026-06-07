import { Search, Notifications, Settings } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './TopBar.module.scss'

const logoImg = '/img/common/logo.png'

interface TopBarProps {
  activeTab?: string
}

const TopBar = ({ activeTab = 'wiki' }: TopBarProps) => {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'zh'
  const nextLanguage = currentLanguage === 'zh' ? 'en' : 'zh'

  const handleLanguageToggle = () => {
    void i18n.changeLanguage(nextLanguage)
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.avatar}>
          <img src={logoImg} alt="Profile" className={styles.avatarImg} />
        </div>
        <div className={styles.searchWrap}>
          <Search sx={{ fontSize: 20 }} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={t('topbar.searchPlaceholder')}
            type="text"
          />
        </div>
        <nav className={styles.tabs}>
          <a
            className={`${styles.tab} ${activeTab === 'wiki' ? styles.tabActive : ''}`}
            href="#"
          >
            {t('topbar.wiki')}
          </a>
          <a className={styles.tab} href="#">
            {t('topbar.changelog')}
          </a>
        </nav>
      </div>
      <div className={styles.right}>
        <button className={styles.langBtn} onClick={handleLanguageToggle} title={t('language.switchLabel')}>
          {t('language.current')}
        </button>
        <button className={styles.iconBtn} title={t('topbar.notifications')}>
          <Notifications sx={{ fontSize: 22 }} />
        </button>
        <button className={styles.iconBtn} title={t('topbar.settings')}>
          <Settings sx={{ fontSize: 22 }} />
        </button>
        <button className={styles.startBtn}>{t('app.startGame')}</button>
      </div>
    </header>
  )
}

export default TopBar
