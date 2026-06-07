import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n'
import './styles/global.scss'

const isMac = /mac/i.test(navigator.platform) || navigator.userAgent.toLowerCase().includes('mac os')

if (isMac) {
  document.documentElement.classList.add('platform-macos')
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
