import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { setReturnTo, clearReturnTo, consumeReturnTo } from '../lib/returnTo'
import LiquidEther from '../components/LiquidEther'
import Icon from '../components/Icons'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignUp = location.pathname === '/signup'
  const cameFromOrder = location.state?.reason === 'order'
  const { user, isStaff, signIn, signUp, signInWithGoogle } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Remember the page the user was trying to open (kept across the Google redirect too)
  useEffect(() => {
    if (location.state?.from) setReturnTo(location.state.from)
    else if (!user) clearReturnTo()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Once signed in (email, sign-up, or already logged in) leave the login page.
  // Admin / staff default to /admin; customers go to their saved destination or /.
  useEffect(() => {
    if (!user) return
    const saved = consumeReturnTo()
    const defaultDest = isStaff || user.email?.toLowerCase() === 'admin@gmail.com' ? '/admin' : '/'
    navigate(saved || defaultDest, { replace: true })
  }, [user, isStaff]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (isSignUp) {
        const { data, error: authError } = await signUp(email, password, fullName.trim())
        if (authError) {
          setError(authError.message)
        } else if (!data?.session) {
          setInfo('Akun berhasil dibuat! Cek email Anda dan klik link verifikasi, lalu masuk untuk melengkapi data pengiriman.')
        }
        // With a session, the effect above takes over and the user is sent to complete their profile
      } else {
        const { error: authError } = await signIn(email, password)
        if (authError) setError(authError.message)
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setInfo('')
    try {
      const { error: authError } = await signInWithGoogle()
      if (authError) setError(authError.message)
    } catch {
      setError('Google sign-in gagal. Silakan coba lagi.')
    }
  }

  return (
    <div className="login-page">
      {/* Full-screen LiquidEther background */}
      <div className="login-bg">
        <LiquidEther
          colors={["#5227FF", "#FF9FFC", "#B497CF"]}
          mouseForce={20}
          cursorSize={100}
          persistence={0.75}
          autoDemo
          autoSpeed={0.5}
          autoIntensity={2.2}
          intensity={1}
          viscosity={0}
          resolution={0.5}
          clickBurst
          bounceEdges={false}
          intro
          lightMode={false}
        />
      </div>

      {/* Dark gradient overlay for readability */}
      <div className="login-overlay" />

      {/* Back to home — navbar is hidden on this page */}
      <button id="login-back-btn" type="button" className="login-back" onClick={() => navigate('/')}>
        <Icon name="arrowLeft" size="sm" />
        Kembali
      </button>

      {/* Login form card — centered */}
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="logo-icon">
              <Icon name="grid" />
            </div>
            <span>CetakBanner</span>
          </div>

          {/* Header */}
          <div className="login-header">
            <h1>{isSignUp ? 'Buat Akun Baru' : 'Selamat Datang'}</h1>
            <p>
              {isSignUp
                ? 'Daftar dengan email Anda untuk mulai memesan banner custom'
                : 'Masukkan email dan password untuk mengakses akun Anda'}
            </p>
          </div>

          {/* Why the user landed here */}
          {cameFromOrder && !error && !info && (
            <div className="login-notice">
              <Icon name="lock" size="sm" />
              <span>Masuk atau buat akun terlebih dahulu untuk mulai memesan banner.</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="login-error">
              <Icon name="x" size="sm" />
              <span>{error}</span>
            </div>
          )}

          {/* Info / success message */}
          {info && (
            <div
              className="login-error"
              style={{
                background: 'var(--green-bg)',
                borderColor: 'var(--green-border)',
                color: 'var(--green)',
              }}
            >
              <Icon name="check" size="sm" />
              <span>{info}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <div className="form-group">
                <label className="form-label" htmlFor="login-name">Nama Lengkap</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Icon name="user" size="sm" />
                  </span>
                  <input
                    id="login-name"
                    type="text"
                    className="form-input"
                    placeholder="Nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="login-options">
                <label className="login-checkbox">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="checkmark" />
                  Ingat saya
                </label>
                <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>Lupa Password?</a>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-spinner" />
              ) : isSignUp ? (
                'Daftar Akun'
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>atau</span>
          </div>

          {/* Google sign in */}
          <button type="button" className="login-google-btn" onClick={handleGoogleSignIn}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.84v-.14z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Masuk dengan Google
          </button>

          {/* Switch between Login / Sign up */}
          <div className="login-footer">
            {isSignUp ? (
              <>Sudah punya akun? <Link to="/login" state={location.state} onClick={() => { setError(''); setInfo('') }}><strong>Masuk</strong></Link></>
            ) : (
              <>Belum punya akun? <Link to="/signup" state={location.state} onClick={() => { setError(''); setInfo('') }}><strong>Daftar</strong></Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
