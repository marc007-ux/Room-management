import { Link } from 'react-router-dom'
import { CalendarCheck, ClipboardList, BellRing, ArrowRight } from 'lucide-react'
import logo from '../assets/logo.png'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing">
      <img src={logo} alt="Logo" className="landing-logo" />

      <h1 className="landing-title">Room Management System</h1>
      <p className="landing-subtitle">
        A real-time system to track every room, reservation, and payment —
        accurate, organized, and always up to date.
      </p>

      <div className="landing-pills">
        <span className="pill"><CalendarCheck size={16} /> Real-time availability</span>
        <span className="pill"><ClipboardList size={16} /> Reservation tracking</span>
        <span className="pill"><BellRing size={16} /> Status alerts</span>
      </div>

      <div className="landing-actions">
        <Link to="/login" className="btn-pill btn-pill-primary">
          Go to login <ArrowRight size={16} />
        </Link>
        
      </div>
    </div>
  )
}