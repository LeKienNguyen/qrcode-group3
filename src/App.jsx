import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import AdminPage from './pages/AdminPage.jsx'
import ScanRedirect from './pages/ScanRedirect.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/s/:id" element={<ScanRedirect />} />
    </Routes>
  )
}

export default App
