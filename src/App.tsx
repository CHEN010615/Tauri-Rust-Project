import { useState } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import MainContent from './components/MainContent/MainContent'

function App() {
  const [activeTab, setActiveTab] = useState('wiki')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <>
      <TitleBar />
      <Sidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        onTabChange={setActiveTab}
        onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />
      <MainContent activeTab={activeTab} sidebarCollapsed={sidebarCollapsed} />
    </>
  )
}

export default App
