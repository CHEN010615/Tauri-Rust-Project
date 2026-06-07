import WikiPage from './pages/wiki/WikiPage'
import BreedingPage from './pages/breeding/BreedingPage'
import MapPage from './pages/map/MapPage'
import GlossaryPage from './pages/glossary/GlossaryPage'
import styles from './MainContent.module.scss'

interface MainContentProps {
  activeTab: string
}

const pageMap: Record<string, React.ComponentType> = {
  wiki: WikiPage,
  breeding: BreedingPage,
  map: MapPage,
  glossary: GlossaryPage,
}

const MainContent = ({ activeTab }: MainContentProps) => {
  const PageComponent = pageMap[activeTab] || WikiPage

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <PageComponent />
      </div>
    </main>
  )
}

export default MainContent
