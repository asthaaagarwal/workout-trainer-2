import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initVersionCheck } from './utils/versionCheck'

// Initialize version checking (checks every 5 minutes)
initVersionCheck(5);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
