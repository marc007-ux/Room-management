import logo from '../../assets/logo.jpeg'
import { ShieldCheck, CalendarCheck } from 'lucide-react'
import './AuthLayout.css'

export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card auth-card-brand">
          <img src={logo} alt="Logo" className="auth-logo" />

          <div>
            <h2 className="auth-brand-title">Log in</h2>
            <p className="auth-brand-text">
              Sign in to manage rooms, track reservations, and keep
              availability accurate in real time.
            </p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <ShieldCheck size={18} />
              <div>
                <strong>Secure role access</strong>
                <span>Admin and receptionist views stay separated.</span>
              </div>
            </div>
            <div className="auth-feature">
              <CalendarCheck size={18} />
              <div>
                <strong>Real-time availability</strong>
                <span>Reservations sync instantly — no double-booking.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card auth-card-form">{children}</div>
      </div>
    </div>
  )
}