import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PageLoader() {
  return (
    <div className="page-loader">
      <span className="login-spinner" />
    </div>
  )
}

/**
 * Only renders its children for signed-in users.
 * - Signed out → sent to /login (and brought back here afterwards)
 * - Signed in but profile incomplete → sent to /profil first
 */
export default function RequireAuth({ children, requireProfile = true }) {
  const { user, loading, isProfileComplete } = useAuth()
  const location = useLocation()

  if (loading) return <PageLoader />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: 'order' }} />
  }

  if (requireProfile && !isProfileComplete) {
    return <Navigate to="/profil" replace state={{ from: location.pathname }} />
  }

  return children
}

