import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './tailwind.css'
import './searchControls.css'
import './uiConsistency.css'
import './responsive.css'
import './modern-ui.css'

createRoot(document.getElementById('root')!).render(<App />)
