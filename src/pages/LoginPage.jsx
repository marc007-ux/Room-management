import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setLoading(false)
    if (error) return setError(error.message)
    navigate(redirectTo, { replace: true })
  }

  return (
    <AuthLayout>
      <div style={{ width: '100%' }}>
        {error && <Alert type="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            <LogIn size={16} /> {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>

        <Link to="/register" style={{ textDecoration: 'none', width: '100%', display: 'block', marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" style={{ width: '100%' }} type="button">
            <UserPlus size={16} /> Create a new account
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}
