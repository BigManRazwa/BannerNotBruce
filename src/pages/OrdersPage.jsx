import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { PageLoader } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { formatIDR } from '../context/OrderContext'
import { listMyOrders, subscribeToMyOrders } from '../lib/orders'
import { STATUS_META, progressPercent, formatDateTime } from '../lib/orderStatus'

export default function OrdersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setOrders(await listMyOrders(user.id))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribeToMyOrders(user.id, () => load()), [user.id, load])

  if (loading) return <PageLoader />

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const past = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  const renderRow = (o) => {
    const meta = STATUS_META[o.status] || STATUS_META.received
    const pct = progressPercent(o.status)
    return (
      <button key={o.id} className="order-row" onClick={() => navigate(`/pesanan/${o.order_code}`)}>
        <div className="order-row-main">
          <div className="order-row-top">
            <strong>{o.order_code}</strong>
            <span className={`badge badge-sm ${meta.badge}`}>{meta.label}</span>
          </div>
          <div className="order-row-meta">
            {o.width_cm} × {o.height_cm} cm • {o.material} • {o.quantity} Pcs
          </div>
          {o.status !== 'cancelled' && (
            <div className="order-row-bar"><div style={{ width: `${pct}%` }} /></div>
          )}
        </div>
        <div className="order-row-side">
          <strong>{formatIDR(o.total)}</strong>
          <span>{formatDateTime(o.created_at)}</span>
        </div>
        <Icon name="arrowRight" size="sm" />
      </button>
    )
  }

  return (
    <div className="page active">
      <div className="container">
        <div className="profile-layout">
          <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div className="breadcrumb">AKUN SAYA</div>
              <h2>Pesanan Saya</h2>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <Icon name="plus" size="sm" /> Pesanan Baru
            </button>
          </div>

          {error && (
            <div className="login-error"><Icon name="x" size="sm" /><span>{error}</span></div>
          )}

          {!error && orders.length === 0 && (
            <div className="empty-state">
              <Icon name="fileText" size="xl" />
              <h3>Belum ada pesanan</h3>
              <p>Pilih ukuran banner, upload desain, dan pantau proses produksinya di sini.</p>
              <button className="btn btn-primary" onClick={() => navigate('/')}>Mulai Pesan</button>
            </div>
          )}

          {active.length > 0 && (
            <section className="orders-group">
              <h4>Sedang Diproses ({active.length})</h4>
              {active.map(renderRow)}
            </section>
          )}

          {past.length > 0 && (
            <section className="orders-group">
              <h4>Riwayat</h4>
              {past.map(renderRow)}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

