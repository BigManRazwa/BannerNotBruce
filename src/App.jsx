import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Stepper from './components/Stepper'
import GradualBlur from './components/GradualBlur'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import PreviewPage from './pages/PreviewPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import OrderStatusPage from './pages/OrderStatusPage'
import AdminPage from './pages/AdminPage'
import { useAuth } from './context/AuthContext'
import { consumeReturnTo } from './lib/returnTo'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

// Routes a signed-in user with an unfinished profile is still allowed to see
const PROFILE_EXEMPT = ['/profil', '/login', '/signup', '/admin']
// Order-flow routes that show the step indicator
const STEPPER_ROUTES = ['/order', '/preview', '/checkout']

export default function App() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, loading, isProfileComplete } = useAuth()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  // Signed in but hasn't filled in contact & shipping details yet → they must do that first
  const mustCompleteProfile = !loading && user && !isProfileComplete && !PROFILE_EXEMPT.includes(pathname)

  // After Google sign-in the browser lands on "/", so send the user back to where they were headed
  useEffect(() => {
    if (!user || !isProfileComplete) return
    const returnTo = consumeReturnTo()
    if (returnTo && returnTo !== pathname) navigate(returnTo, { replace: true })
  }, [user, isProfileComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      {STEPPER_ROUTES.includes(pathname) && <Stepper />}

      {mustCompleteProfile ? (
        <Navigate to="/profil" replace state={{ from: pathname }} />
      ) : (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/profil" element={<RequireAuth requireProfile={false}><ProfilePage /></RequireAuth>} />
          <Route path="/order" element={<RequireAuth><OrderPage /></RequireAuth>} />
          <Route path="/preview" element={<RequireAuth><PreviewPage /></RequireAuth>} />
          <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="/pesanan" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/pesanan/:code" element={<RequireAuth><OrderStatusPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth requireProfile={false}><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}

      {!isAuthPage && (
        <>
          {/* Top edge: sits under the navbar, shows once you scroll and the navbar slides away */}
          <GradualBlur
            target="page"
            position="top"
            height="4.5rem"
            strength={1.5}
            layers={6}
            curve="bezier"
            exponential
            tint="rgba(5, 3, 10, 0.55)"
            autoHide
            zIndex={90}
          />
          {/* Bottom edge: content melts into the page, fades out at the very bottom */}
          <GradualBlur
            target="page"
            position="bottom"
            height="6rem"
            strength={2}
            layers={8}
            curve="linear"
            exponential
            tint="rgba(10, 5, 20, 0.6)"
            autoHide
            opacity={1}
            saturation={1}
            hoverIntensity={1}
            zIndex={90}
          />
        </>
      )}
    </>
  )
}
