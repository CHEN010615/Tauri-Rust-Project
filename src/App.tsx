import { useState } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import Sidebar from './components/Sidebar/Sidebar'
import MainContent from './components/MainContent/MainContent'

function App() {
  const [activeTab, setActiveTab] = useState('wiki')

  return (
    <>
      <TitleBar />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MainContent activeTab={activeTab} />
    </>
  )
}

export default App
