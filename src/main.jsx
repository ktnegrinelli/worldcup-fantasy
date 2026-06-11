import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa'
import App from './App.jsx'
import './index.css'

// Register service worker for PWA
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)