import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Stepper from './components/Stepper'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import PreviewPage from './pages/PreviewPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <>
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <Stepper />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </>
  )
}

