import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icons'

const navItems = [
  { path: '/', icon: 'ruler', label: 'Ukuran Banner' },
  { path: '/order', icon: 'edit', label: 'Pesan Custom' },
  { path: '/preview', icon: 'eye', label: 'Preview Desain' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isStaff, isAdmin, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the dropdown on outside click, Escape, or route change
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Hide the navbar while scrolling down, reveal it again on any scroll up
  const [hidden, setHidden] = useState(false)
  const [popping, setPopping] = useState(false)
  const wasHiddenRef = useRef(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const update = () => {
      ticking = false
      const y = Math.max(window.scrollY, 0)
      const delta = y - lastY
      if (Math.abs(delta) < 6) return // ignore tiny jitter (trackpads, iOS bounce)
      const shouldHide = delta > 0 && y > 80
      setHidden(shouldHide)
      if (!shouldHide && wasHiddenRef.current) {
        setPopping(true)
      }
      wasHiddenRef.current = shouldHide
      lastY = y
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Always show the bar again after navigating to another page
  useEffect(() => { setHidden(false) }, [location.pathname])

  // Close the profile dropdown when the bar slides away
  useEffect(() => { if (hidden) setMenuOpen(false) }, [hidden])

  const handleAvatarClick = () => {
    if (user) setMenuOpen(open => !open)
    else navigate('/login')
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || ''
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <nav
      className={`navbar ${hidden ? 'navbar--hidden' : ''} ${popping ? 'navbar--visible' : ''}`}
      onFocus={() => setHidden(false)}
      onAnimationEnd={() => setPopping(false)}
    >
      <div className="navbar-inner">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <Icon name="grid" size="sm" />
          </div>
          CetakBanner
        </div>

        <ul className="navbar-nav">
          {navItems.map(item => (
            <li key={item.path}>
              <a
                className={location.pathname === item.path ? 'active' : ''}
                onClick={() => navigate(item.path)}
              >
                <Icon name={item.icon} size="sm" />
                {item.label}
              </a>
            </li>
          ))}
          {isStaff && (
            <li>
              <a
                className={location.pathname === '/admin' ? 'active' : ''}
                onClick={() => navigate('/admin')}
              >
                <Icon name="shieldCheck" size="sm" />
                {isAdmin ? 'Panel Admin' : 'Panel Staff'}
              </a>
            </li>
          )}
          <li>
            <a href="#">
              <Icon name="flag" size="sm" />
              Bantuan / FAQ
            </a>
          </li>
        </ul>

        <div className="navbar-right">
          <div className="navbar-phone">
            <Icon name="phone" size="sm" />
            0812-BANNER-ID
          </div>
          <div className="navbar-cart" onClick={() => navigate('/checkout')}>
            <Icon name="cart" size="md" />
            <span className="badge">0</span>
          </div>
          <div className="navbar-profile" ref={menuRef}>
            <button
              id="navbar-avatar-btn"
              type="button"
              className={`navbar-avatar ${user ? 'logged-in' : ''} ${menuOpen ? 'open' : ''}`}
              onClick={handleAvatarClick}
              title={user ? displayName : 'Masuk'}
              aria-haspopup={user ? 'menu' : undefined}
              aria-expanded={user ? menuOpen : undefined}
            >
              {user ? <span className="avatar-initial">{initial}</span> : <Icon name="user" size="sm" />}
            </button>

            {user && menuOpen && (
              <div className="profile-menu" role="menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-avatar">{initial}</div>
                  <div className="profile-menu-info">
                    <span className="profile-menu-name">{displayName}</span>
                    <span className="profile-menu-email">{user.email}</span>
                  </div>
                </div>
                <div className="profile-menu-divider" />
                {isStaff && (
                  <button id="profile-menu-admin" className="profile-menu-item" role="menuitem" onClick={() => navigate('/admin')}>
                    <Icon name="shieldCheck" size="sm" />
                    {isAdmin ? 'Panel Admin & Produksi' : 'Panel Staff Produksi'}
                  </button>
                )}
                <button id="profile-menu-profile" className="profile-menu-item" role="menuitem" onClick={() => navigate('/profil')}>
                  <Icon name="user" size="sm" />
                  Profil &amp; Alamat
                </button>
                <button id="profile-menu-orders" className="profile-menu-item" role="menuitem" onClick={() => navigate('/pesanan')}>
                  <Icon name="clock" size="sm" />
                  Pesanan Saya
                </button>
                <button id="profile-menu-signout" className="profile-menu-item danger" role="menuitem" onClick={handleSignOut}>
                  <Icon name="logOut" size="sm" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
