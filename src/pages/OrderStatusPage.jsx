import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import Icon from '../components/Icons'
import { PageLoader } from '../components/RequireAuth'
import { formatIDR } from '../context/OrderContext'
import { getOrderByCode, getDesignUrl, subscribeToOrder } from '../lib/orders'
import {
  ORDER_STAGES, STATUS_META, stageIndex, progressPercent, turnaroundLabel, formatDateTime,
} from '../lib/orderStatus'

export default function OrderStatusPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [designUrl, setDesignUrl] = useState(null)
  const [justCreated, setJustCreated] = useState(!!location.state?.justCreated)

  const load = useCallback(async () => {
    try {
      const data = await getOrderByCode(code)
      setOrder(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => { setLoading(true); load() }, [load])

  // Live updates: refetch whenever staff change the status
  useEffect(() => {
    if (!order?.id) return
    return subscribeToOrder(order.id, () => load())
  }, [order?.id, load])

  useEffect(() => {
    if (order?.design_path) getDesignUrl(order.design_path).then(setDesignUrl)
  }, [order?.design_path])

  if (loading) return <PageLoader />

  if (error || !order) {
    return (
      <div className="page active">
        <div className="container">
          <div className="empty-state">
            <Icon name={error ? 'x' : 'fileText'} size="xl" />
            <h3>{error ? 'Gagal memuat pesanan' : 'Pesanan tidak ditemukan'}</h3>
            <p>{error || `Tidak ada pesanan dengan kode ${code} di akun Anda.`}</p>
            <button className="btn btn-primary" onClick={() => navigate('/pesanan')}>Lihat Semua Pesanan</button>
          </div>
        </div>
      </div>
    )
  }

  const meta = STATUS_META[order.status] || STATUS_META.received
  const isCancelled = order.status === 'cancelled'
  const current = stageIndex(order.status)
  const percent = progressPercent(order.status)
  const currentStage = ORDER_STAGES[Math.min(current, ORDER_STAGES.length - 1)]

  // Latest event for each stage → timestamp + staff note on the timeline
  const eventFor = (key) => [...order.order_events].reverse().find(e => e.status === key)
  const cancelEvent = isCancelled ? eventFor('cancelled') : null

  const contact = order.contact || {}
  const dims = `${order.width_cm} × ${order.height_cm} cm${order.is_custom ? ' (Custom)' : ''}`

  return (
    <div className="page active">
      <div className="container">
        <div className="checkout-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="preflight-badge">
                <Link to="/pesanan" className="crumb-link">Pesanan Saya</Link> / JOB #{order.order_code}
              </div>
              <h2>Status Produksi</h2>
              <p className="checkout-desc">Dipesan {formatDateTime(order.created_at)} • Halaman ini diperbarui otomatis.</p>
            </div>
            <div className={`status-wip-pill tone-${meta.tone}`}>
              {!isCancelled && order.status !== 'completed' && <span className="status-wip-dot" />}
              {meta.label}
            </div>
          </div>
        </div>

        {justCreated && (
          <div className="status-banner success">
            <Icon name="checkCircle" />
            <div>
              <strong>Pesanan berhasil dikirim!</strong>
              <p>Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi pembayaran. Simpan kode pesanan <b>{order.order_code}</b>.</p>
            </div>
            <button className="status-banner-close" onClick={() => setJustCreated(false)} aria-label="Tutup"><Icon name="x" size="sm" /></button>
          </div>
        )}

        {isCancelled && (
          <div className="status-banner danger">
            <Icon name="x" />
            <div>
              <strong>Pesanan dibatalkan</strong>
              <p>{cancelEvent?.note || 'Hubungi kami jika Anda memiliki pertanyaan tentang pembatalan ini.'}</p>
            </div>
          </div>
        )}

        <div className="checkout-layout">
          <div className="checkout-main">
            {/* Production progress */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num"><Icon name="zap" size="sm" /></span>Tahapan Produksi</div>
                {!isCancelled && (
                  <span className={`badge ${meta.badge}`}>
                    {order.status === 'completed' ? 'Selesai' : `Tahap ${current + 1} dari ${ORDER_STAGES.length}`}
                  </span>
                )}
              </div>

              {!isCancelled && (
                <div className="status-progress-box">
                  <div className="status-progress-top">
                    <div>
                      <div className="status-progress-label">Progres Pengerjaan</div>
                      <div className="status-progress-title">
                        {order.status === 'completed' ? 'Pesanan telah selesai' : currentStage.title}
                      </div>
                    </div>
                    <div className="status-progress-pct">{percent}%</div>
                  </div>
                  <div className="status-progress-bar">
                    <div className="status-progress-fill" style={{ width: `${percent}%` }} />
                  </div>
                  <div className="status-progress-meta">
                    <span><Icon name="clock" size="sm" /> Diperbarui {formatDateTime(order.updated_at)}</span>
                    <span>Kecepatan: <strong>{turnaroundLabel(order.turnaround)}</strong></span>
                  </div>
                </div>
              )}

              <div className="status-timeline">
                {ORDER_STAGES.map((stage, i) => {
                  const state = isCancelled ? 'upcoming' : i < current || order.status === 'completed' ? 'done' : i === current ? 'active' : 'upcoming'
                  const ev = eventFor(stage.key)
                  return (
                    <div key={stage.key} className={`status-stage ${state}`}>
                      <div className="status-stage-marker">
                        <div className="status-stage-dot">
                          {state === 'done' && <Icon name="check" size="sm" />}
                          {state === 'active' && <span className="status-stage-pulse" />}
                          {state === 'upcoming' && <span>{i + 1}</span>}
                        </div>
                        {i < ORDER_STAGES.length - 1 && <div className="status-stage-line" />}
                      </div>
                      <div className="status-stage-body">
                        <div className="status-stage-header">
                          <h5>{stage.title}</h5>
                          {state === 'active' && <span className="badge badge-purple badge-sm">Sedang Dikerjakan</span>}
                          {state === 'done' && <span className="badge badge-green badge-sm">Selesai</span>}
                        </div>
                        <div className="status-stage-time">
                          {ev ? formatDateTime(ev.created_at) : state === 'upcoming' ? 'Menunggu giliran' : ''}
                        </div>
                        <p>{stage.desc}</p>
                        {ev?.note && ev.note !== 'Pesanan diterima' && (
                          <div className="status-stage-note"><Icon name="fileText" size="sm" /> {ev.note}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Specs */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">2</span>Detail Spesifikasi</div>
              </div>
              <div className="status-spec-grid">
                <div className="status-spec-item"><span className="spec-k">Dimensi Banner</span><strong className="spec-v">{dims}</strong></div>
                <div className="status-spec-item"><span className="spec-k">Jumlah Cetak</span><strong className="spec-v">{order.quantity} Pcs</strong></div>
                <div className="status-spec-item"><span className="spec-k">Material</span><strong className="spec-v">{order.material}</strong></div>
                <div className="status-spec-item"><span className="spec-k">Finishing &amp; Grommet</span><strong className="spec-v">{order.grommet}</strong></div>
                <div className="status-spec-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-k">File Desain</span>
                  <strong className="spec-v">
                    {designUrl
                      ? <a href={designUrl} target="_blank" rel="noreferrer">{order.design_name} ↗</a>
                      : order.design_name || '—'}
                  </strong>
                </div>
              </div>
              {order.production_notes && (
                <div className="print-notes" style={{ marginTop: 14 }}>
                  <Icon name="fileText" size="sm" />
                  <span><strong>Catatan Produksi:</strong> {order.production_notes}</span>
                </div>
              )}
            </div>

            {/* Contact snapshot */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">3</span>Kontak &amp; Alamat Pengiriman</div>
              </div>
              <div className="status-spec-grid">
                <div className="status-spec-item">
                  <span className="spec-k">Nama Pemesan</span>
                  <strong className="spec-v">{contact.full_name}</strong>
                  {contact.company && <span className="spec-sub">{contact.company}</span>}
                </div>
                <div className="status-spec-item">
                  <span className="spec-k">WhatsApp &amp; Email</span>
                  <strong className="spec-v">{contact.phone}</strong>
                  <span className="spec-sub">{contact.email}</span>
                </div>
                <div className="status-spec-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-k">Alamat Pengiriman</span>
                  <strong className="spec-v">{contact.address}</strong>
                  <span className="spec-sub">
                    {contact.city}, {contact.province} {contact.postal_code}
                    {contact.address_notes && ` — ${contact.address_notes}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="checkout-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <h3><Icon name="fileText" size="sm" /> {order.order_code}</h3>
                <span className={`badge badge-sm ${meta.badge}`}>{meta.short}</span>
              </div>
              <div className="summary-body">
                <div className="summary-lines">
                  <div className="summary-line"><span className="label">Harga per Pcs</span><span className="value">{formatIDR(order.unit_price)}</span></div>
                  <div className="summary-line"><span className="label">Subtotal ({order.quantity} Pcs)</span><span className="value">{formatIDR(order.subtotal)}</span></div>
                  {order.turnaround_fee > 0 && (
                    <div className="summary-line"><span className="label">Percepatan Produksi</span><span className="value">{formatIDR(order.turnaround_fee)}</span></div>
                  )}
                  <div className="summary-line"><span className="label">Pajak (PPN 11%)</span><span className="value">{formatIDR(order.tax)}</span></div>
                </div>
                <hr className="summary-divider" />
                <div className="summary-total">
                  <span className="label">Total</span>
                  <span className="amount">{formatIDR(order.total)}</span>
                </div>
              </div>
              <div className="summary-actions">
                <button className="btn btn-primary" onClick={() => navigate('/')}>
                  <Icon name="plus" size="sm" /> Buat Pesanan Baru
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/pesanan')}>
                  <Icon name="arrowLeft" size="sm" /> Semua Pesanan
                </button>
              </div>
            </div>

            <div className="need-help" style={{ marginTop: 16 }}>
              <p><Icon name="phone" size="sm" /> Ada pertanyaan?</p>
              <span className="help-phone">0812-BANNER-ID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

