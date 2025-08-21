import React from 'react'
import { Link } from 'react-router-dom'
import '../css/Header.css'; // קובץ העיצוב החדש

export default function Header() {
  return (
    <header className='container-fluid' style={{ background: " #b87440ff" }}>
      <div className="container">
        <div className="row ">
          {/* col-auto - רוחב לפי התוכן */}
          <div className="logo col-auto">
            <h3 className="logo-title">FitClick</h3>
          </div>  
          <nav className='col-auto'>
            {/* h-100 - גובה 100 אחוז
            list-inline - מסתיר את הנקודות של הבולטים
             align-items-center - ממרכז באמצע בגובה*/}
            <ul className='list-inline d-flex h-100 align-items-center'>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/log_in">Log in</Link></li>
              <li><Link to="/sign_up">sign up</Link></li>

            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
