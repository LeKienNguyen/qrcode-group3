import { NavLink } from 'react-router-dom'
import { QrIcon } from './icons/Icons.jsx'

function Header() {
  return (
    <header className="header">
      <div className="header-row">
        <div className="header-brand">
          <span className="header-logo">
            <QrIcon />
          </span>
          <div>
            <h1 className="header-title">QR Code Studio</h1>
            <p className="header-subtitle">
              Create polished QR codes for links, Wi-Fi access and email contacts in seconds.
            </p>
          </div>
        </div>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => `header-nav-link${isActive ? ' header-nav-link--active' : ''}`}>
            Generator
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `header-nav-link${isActive ? ' header-nav-link--active' : ''}`}>
            Admin Dashboard
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

export default Header
