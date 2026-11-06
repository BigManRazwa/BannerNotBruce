import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { PageLoader } from '../components/RequireAuth'
import { useAuth } from '../context/AuthContext'
import { formatIDR } from '../context/OrderContext'
import {
  listAllOrders,
  updateOrderStatus,
  deleteOrder,
  getDesignUrl,
  subscribeToAllOrders,
} from '../lib/orders'
import {
  ORDER_STAGES,
  STATUS_META,
  ALL_STATUSES,
  stageIndex,
  turnaroundLabel,
  formatDateTime,
} from '../lib/orderStatus'

const FILTER_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'received', label: 'Diterima' },
  { key: 'preflight', label: 'Preflight' },
  { key: 'printing', label: 'Sedang Dicetak' },
  { key: 'finishing', label: 'Finishing' },
  { key: 'ready', label: 'Siap Diambil' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

function AdminOrderCard({ order, isAdmin, onRefresh }) {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [busyStatus, setBusyStatus] = useState(null)
  const [error, setError] = useState('')
  const [openingFile, setOpeningFile] = useState(false)

  const meta = STATUS_META[order.status] || STATUS_META.received
  const currentIdx = stageIndex(order.status)
  const isCancelled = order.status === 'cancelled'
  const isCompleted = order.status === 'completed'

  // Determine the next logical stage for the 1-click advance button
  let nextStageKey = null
  let nextStageLabel = null
  if (!isCancelled && !isCompleted) {
    if (currentIdx >= 0 && currentIdx < ORDER_STAGES.length - 1) {
      nextStageKey = ORDER_STAGES[currentIdx + 1].key
      nextStageLabel = ORDER_STAGES[currentIdx + 1].title
    } else if (order.status === 'ready') {
      nextStageKey = 'completed'
      nextStageLabel = 'Tandai Selesai'
    }
  }

  const handleStatusChange = async (targetStatus) => {
    if (busyStatus || targetStatus === order.status) return
    setBusyStatus(targetStatus)
    setError('')
    try {
      await updateOrderStatus(order.id, targetStatus, note)
      setNote('')
      await onRefresh()
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status.')
    } finally {
      setBusyStatus(null)
    }
  }

  const handleOpenDesign = async () => {
    if (!order.design_path || openingFile) return
    setOpeningFile(true)
    try {
      const url = await getDesignUrl(order.design_path)
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else setError('File desain tidak ditemukan di storage.')
    } finally {
      setOpeningFile(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Hapus pesanan ${order.order_code} secara permanen?`)) return
    setBusyStatus('delete')
    setError('')
    try {
      await deleteOrder(order.id, order.design_path)
      await onRefresh()
    } catch (err) {
      setError(err.message || 'Gagal menghapus pesanan.')
      setBusyStatus(null)
    }
  }

  const contact = order.contact || {}
  const cleanPhone = (contact.phone || '').replace(/\D/g, '').replace(/^0/, '62')
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Halo ${contact.full_name || ''}, update pesanan CetakBanner *${order.order_code}*: status saat ini *${meta.label}*.`
      )}`
    : null

  const turnaroundBadge =
    order.turnaround === 'same_day'
      ? 'badge-red'
      : order.turnaround === 'express'
      ? 'badge-yellow'
      : 'badge-blue'

  const latestEvent = order.order_events?.[order.order_events.length - 1]

  return (
    <div className="card admin-order-card">
      {/* Top header */}
      <div className="admin-order-header">
        <div className="admin-order-id-group">
          <span className="admin-order-code">{order.order_code}</span>
          <span className={`badge ${meta.badge}`}>{meta.label}</span>
          <span className={`badge badge-sm ${turnaroundBadge}`}>{turnaroundLabel(order.turnaround)}</span>
          <span className="admin-order-date">
            <Icon name="clock" size="sm" /> {formatDateTime(order.created_at)}
          </span>
        </div>
        <div className="admin-order-header-right">
          <div className="admin-order-total">{formatIDR(order.total)}</div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/pesanan/${order.order_code}`)}
            title="Lihat halaman status pelanggan"
          >
            <Icon name="eye" size="sm" /> Halaman Pelanggan
          </button>
        </div>
      </div>

      {/* Interactive 5-Step Production Stage Bar */}
      <div className="admin-stage-track">
        {ORDER_STAGES.map((stage, idx) => {
          const done = !isCancelled && (isCompleted || idx < currentIdx)
          const active = !isCancelled && !isCompleted && idx === currentIdx
          return (
            <button
              key={stage.key}
              type="button"
              disabled={!!busyStatus}
              onClick={() => handleStatusChange(stage.key)}
              className={`admin-stage-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              title={`Ubah status ke: ${stage.title}`}
            >
              <span className="admin-stage-num">
                {done ? <Icon name="check" size="sm" /> : idx + 1}
              </span>
              <span className="admin-stage-name">{stage.title}</span>
            </button>
          )
        })}
      </div>

      {/* Info Grid: Specs + Customer */}
      <div className="admin-order-grid">
        <div className="admin-order-box">
          <div className="admin-box-title">
            <Icon name="printer" size="sm" /> Spesifikasi Cetak &amp; File
          </div>
          <div className="admin-kv-list">
            <div><span>Ukuran:</span> <strong>{order.width_cm} × {order.height_cm} cm {order.is_custom ? '(Custom)' : ''}</strong></div>
            <div><span>Jumlah:</span> <strong>{order.quantity} Pcs ({formatIDR(order.unit_price)}/pcs)</strong></div>
            <div><span>Material:</span> <strong>{order.material}</strong></div>
            <div><span>Finishing:</span> <strong>{order.grommet}</strong></div>
          </div>
          {order.production_notes && (
            <div className="admin-prod-note">
              <strong>Catatan Pelanggan:</strong> {order.production_notes}
            </div>
          )}
          <div className="admin-file-row">
            <div className="admin-file-meta">
              <Icon name="file" size="sm" />
              <span>{order.design_name || 'File desain'}</span>
              {order.design_size && (
                <small>({(order.design_size / (1024 * 1024)).toFixed(1)} MB)</small>
              )}
            </div>
            {order.design_path && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleOpenDesign}
                disabled={openingFile}
              >
                <Icon name="download" size="sm" />
                {openingFile ? 'Membuka...' : 'Buka Desain'}
              </button>
            )}
          </div>
        </div>

        <div className="admin-order-box">
          <div className="admin-box-title">
            <Icon name="user" size="sm" /> Data Pelanggan &amp; Pengiriman
          </div>
          <div className="admin-kv-list">
            <div>
              <span>Pemesan:</span>{' '}
              <strong>
                {contact.full_name || '—'}
                {contact.company ? ` (${contact.company})` : ''}
              </strong>
            </div>
            <div>
              <span>Kontak:</span>{' '}
              <strong>{contact.phone || '—'} • {contact.email || '—'}</strong>
            </div>
            <div>
              <span>Alamat:</span>{' '}
              <strong>
                {contact.address || '—'}
                {contact.city ? `, ${contact.city}` : ''}
                {contact.province ? `, ${contact.province}` : ''}{' '}
                {contact.postal_code || ''}
              </strong>
            </div>
            {contact.address_notes && (
              <div><span>Patokan:</span> <strong>{contact.address_notes}</strong></div>
            )}
          </div>
          {waUrl && (
            <div className="admin-file-row">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <Icon name="phone" size="sm" /> Hubungi WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Staff Note + Quick Action Controls */}
      <div className="admin-action-bar">
        <input
          type="text"
          className="form-input admin-note-input"
          placeholder="Tambahkan catatan produksi (opsional, terlihat oleh pelanggan di timeline)..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />

        <div className="admin-action-buttons">
          {nextStageKey && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!!busyStatus}
              onClick={() => handleStatusChange(nextStageKey)}
            >
              {busyStatus === nextStageKey ? 'Menyimpan...' : `Lanjut: ${nextStageLabel}`}
              <Icon name="arrowRight" size="sm" />
            </button>
          )}

          <select
            className="form-select admin-status-select"
            value={order.status}
            disabled={!!busyStatus}
            onChange={e => handleStatusChange(e.target.value)}
          >
            {ALL_STATUSES.map(st => (
              <option key={st} value={st}>
                Status: {STATUS_META[st]?.label || st}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-secondary btn-sm admin-delete-btn"
              disabled={!!busyStatus}
              onClick={handleDelete}
              title="Hapus pesanan (Admin)"
            >
              <Icon name="trash" size="sm" />
            </button>
          )}
        </div>
      </div>

      {latestEvent?.note && latestEvent.note !== 'Pesanan diterima' && (
        <div className="admin-last-note">
          <Icon name="fileText" size="sm" />
          <span>Catatan terakhir ({ formatDateTime(latestEvent.created_at) }): <strong>{latestEvent.note}</strong></span>
        </div>
      )}

      {error && (
        <div className="login-error" style={{ marginTop: 12, marginBottom: 0 }}>
          <Icon name="x" size="sm" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isStaff, isAdmin } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await listAllOrders()
      setOrders(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar pesanan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribeToAllOrders(() => load()), [load])

  if (loading) return <PageLoader />

  if (!isStaff) {
    return (
      <div className="page active">
        <div className="container">
          <div className="empty-state">
            <Icon name="lock" size="xl" />
            <h3>Akses Terbatas (Khusus Staff &amp; Admin)</h3>
            <p>
              Akun Anda ({user?.email}) belum terdaftar sebagai Admin atau Staff Produksi di tabel <code>user_roles</code>.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Kembali ke Beranda</button>
          </div>
        </div>
      </div>
    )
  }

  const activeCount = orders.filter(o => ['received', 'preflight', 'printing', 'finishing'].includes(o.status)).length
  const readyCount = orders.filter(o => o.status === 'ready').length
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const countForTab = (key) =>
    key === 'all' ? orders.length : orders.filter(o => o.status === key).length

  const q = search.trim().toLowerCase()
  const filteredOrders = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (!q) return true
    const c = o.contact || {}
    return (
      o.order_code?.toLowerCase().includes(q) ||
      o.material?.toLowerCase().includes(q) ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="page active">
      <div className="container">
        <div className="checkout-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="preflight-badge">
                <Icon name="shieldCheck" size="sm" /> PANEL KONTROL PRODUKSI • REAL-TIME
              </div>
              <h2>Panel {isAdmin ? 'Admin' : 'Staff'} &amp; Antrean Cetak</h2>
              <p className="checkout-desc">
                Kelola seluruh pesanan masuk, unduh file desain, dan perbarui tahapan produksi secara langsung.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-wip-pill">
                <span className="status-wip-dot" />
                {isAdmin ? 'Akses Admin Penuh' : 'Akses Staff Produksi'}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={load}>
                <Icon name="refreshCw" size="sm" /> Muat Ulang
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Pesanan</span>
            <strong className="admin-stat-value">{orders.length}</strong>
            <span className="admin-stat-sub">Semua waktu</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Sedang Dikerjakan</span>
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-sub">Diterima → Finishing</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Siap Diambil / Kirim</span>
            <strong className="admin-stat-value" style={{ color: 'var(--green)' }}>{readyCount}</strong>
            <span className="admin-stat-sub">Menunggu serah terima</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Estimasi Nilai Pesanan</span>
            <strong className="admin-stat-value">{formatIDR(totalRevenue)}</strong>
            <span className="admin-stat-sub">Tidak termasuk batal</span>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="admin-toolbar">
          <div className="admin-filter-tabs">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label} ({countForTab(tab.key)})
              </button>
            ))}
          </div>
          <div className="admin-search-box">
            <input
              type="text"
              className="form-input"
              placeholder="Cari kode pesanan, nama, WA, kota..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="login-error" style={{ marginBottom: 20 }}>
            <Icon name="x" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Order List */}
        <div className="admin-orders-list">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <Icon name="printer" size="xl" />
              <h3>Tidak ada pesanan di kategori ini</h3>
              <p>Pesanan baru dari pelanggan akan langsung muncul di halaman ini secara otomatis.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <AdminOrderCard
                key={order.id}
                order={order}
                isAdmin={isAdmin}
                onRefresh={load}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

