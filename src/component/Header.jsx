import React from 'react'
import { Link } from 'react-router-dom'
import '../css/Header.css';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="logo">
          <h3 className="logo-title">FitClick</h3>
        </div>
        <nav className="nav-links">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/log_in">Log in</Link></li>
            <li><Link to="/sign_up">Sign up</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
