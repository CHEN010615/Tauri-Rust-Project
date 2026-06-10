import { MenuBook, Egg, Map, AutoAwesome, Upgrade } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './Sidebar.module.scss'

const logoImg = '/img/common/logo.png'

interface NavItem {
  icon: React.ReactNode
  labelKey: string
  key: string
}

const navItems: NavItem[] = [
  { icon: <MenuBook sx={{ fontSize: 20 }} />, labelKey: 'nav.wiki', key: 'wiki' },
  { icon: <Egg sx={{ fontSize: 20 }} />, labelKey: 'nav.breeding', key: 'breeding' },
  { icon: <Map sx={{ fontSize: 20 }} />, labelKey: 'nav.map', key: 'map' },
  { icon: <AutoAwesome sx={{ fontSize: 20 }} />, labelKey: 'nav.glossary', key: 'glossary' },
]

interface SidebarProps {
  activeTab: string
  collapsed: boolean
  onTabChange: (key: string) => void
  onToggleCollapsed: () => void
}

const Sidebar = ({ activeTab, collapsed, onTabChange, onToggleCollapsed }: SidebarProps) => {
  const { t } = useTranslation()

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoHeader}>
          <div className={styles.logoText}>
            <h1 className={styles.logoTitle}>{t('app.brand')}</h1>
            <p className={styles.logoVersion}>{t('app.version')}</p>
          </div>
          <button className={styles.logoButton} type="button" onClick={onToggleCollapsed} title={t('app.brand')}>
            <img className={styles.logoImg} src={logoImg} alt="" />
          </button>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <a
            key={item.key}
            className={`${styles.navItem} ${activeTab === item.key ? styles.navItemActive : ''}`}
            href="#"
            onClick={(e) => {
              e.preventDefault()
              onTabChange(item.key)
            }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{t(item.labelKey)}</span>
          </a>
        ))}
      </nav>

      <div className={styles.upgrade}>
        <button className={styles.upgradeBtn} title={t('app.upgrade')}>
          <Upgrade className={styles.upgradeIcon} sx={{ fontSize: 18 }} />
          <span className={styles.upgradeText}>{t('app.upgrade')}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
