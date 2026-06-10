import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { setFavicon } from './setFavicon'
import { RegisterApp } from './RegisterApp'

setFavicon()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <RegisterApp />
  </StrictMode>,
)

