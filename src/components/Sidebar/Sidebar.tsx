import { MenuBook, Egg, Map, AutoAwesome } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import styles from './Sidebar.module.scss'

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
  onTabChange: (key: string) => void
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const { t } = useTranslation()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1 className={styles.logoTitle}>{t('app.brand')}</h1>
        <p className={styles.logoVersion}>{t('app.version')}</p>
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
        <button className={styles.upgradeBtn}>{t('app.upgrade')}</button>
      </div>
    </aside>
  )
}

export default Sidebar
