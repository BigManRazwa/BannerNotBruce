import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { useOrder, SIZES, MATERIALS, GROMMETS, formatIDR } from '../context/OrderContext'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../lib/orders'
import { TURNAROUNDS } from '../lib/orderStatus'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { order, getPrice, resetOrder } = useOrder()
  const { user, profile } = useAuth()
  const price = getPrice()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const size = order.selectedSize !== null ? SIZES[order.selectedSize] : SIZES[1]
  const material = MATERIALS[order.selectedMaterial] || MATERIALS[0]
  const grommet = GROMMETS[order.selectedGrommet] || GROMMETS[0]
  const turnaround = TURNAROUNDS[order.selectedTurnaround] || TURNAROUNDS[0]
  const hasDesign = !!(order.uploadedFile && order.uploadedFileUrl)
  const isImage = order.uploadedFile?.type?.startsWith('image/')

  const bannerDim = size.isCustom
    ? `${order.customWidth || 100} × ${order.customHeight || 200} cm (Custom)`
    : size.name

  const handleSubmit = async () => {
    if (!hasDesign || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const created = await createOrder({ order, profile, user })
      resetOrder()
      navigate(`/pesanan/${created.order_code}`, { replace: true, state: { justCreated: true } })
    } catch (err) {
      setError(err.message || 'Gagal mengirim pesanan. Silakan coba lagi.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page active">
      <div className="container">
        <div className="checkout-header">
          <div className="preflight-badge"><Icon name="checkCircle" size="sm" /> LANGKAH 4 DARI 4 — KONFIRMASI</div>
          <h2>Konfirmasi Pesanan</h2>
          <p className="checkout-desc">
            Periksa kembali spesifikasi, file desain, dan alamat Anda. Setelah dikirim, pesanan langsung masuk ke antrean produksi.
          </p>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {!hasDesign && (
              <div className="print-notes" style={{ alignItems: 'center' }}>
                <Icon name="upload" size="sm" />
                <span style={{ flex: 1 }}>
                  Belum ada file desain. Upload desain Anda terlebih dahulu sebelum mengirim pesanan.
                  {order.selectedSize !== null && ' (File perlu diupload ulang jika halaman sempat dimuat ulang.)'}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/preview')}>Upload Desain</button>
              </div>
            )}

            {/* 1. Specs */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">1</span>Spesifikasi Banner</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/order')}>
                  <Icon name="edit" size="sm" /> Ubah
                </button>
              </div>
              <div className="status-spec-grid">
                <div className="status-spec-item"><span className="spec-k">Dimensi Banner</span><strong className="spec-v">{bannerDim}</strong></div>
                <div className="status-spec-item"><span className="spec-k">Jumlah Cetak</span><strong className="spec-v">{order.quantity} Pcs</strong></div>
                <div className="status-spec-item"><span className="spec-k">Material</span><strong className="spec-v">{material.name}</strong></div>
                <div className="status-spec-item"><span className="spec-k">Finishing &amp; Grommet</span><strong className="spec-v">{grommet.name}</strong></div>
                <div className="status-spec-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-k">Kecepatan Produksi</span><strong className="spec-v">{turnaround.label}</strong>
                </div>
              </div>
              {order.productionNotes && (
                <div className="print-notes" style={{ marginTop: 14 }}>
                  <Icon name="fileText" size="sm" />
                  <span><strong>Catatan Produksi:</strong> {order.productionNotes}</span>
                </div>
              )}
            </div>

            {/* 2. Design */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">2</span>File Desain</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/preview')}>
                  <Icon name={hasDesign ? 'refreshCw' : 'upload'} size="sm" /> {hasDesign ? 'Ganti' : 'Upload'}
                </button>
              </div>
              {hasDesign ? (
                <div className="uploaded-file" style={{ marginTop: 0 }}>
                  <div className="file-icon" style={isImage ? { padding: 0, overflow: 'hidden' } : undefined}>
                    {isImage
                      ? <img src={order.uploadedFileUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Icon name="file" />}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{order.uploadedFile.name}</div>
                    <div className="file-meta">{(order.uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                  </div>
                  <div className="file-status validated"><Icon name="check" size="sm" /> Siap dikirim</div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada file.</p>
              )}
            </div>

            {/* 3. Contact & shipping */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">3</span>Kontak &amp; Alamat Pengiriman</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/profil', { state: { from: '/checkout' } })}>
                  <Icon name="edit" size="sm" /> Ubah
                </button>
              </div>
              <div className="status-spec-grid">
                <div className="status-spec-item">
                  <span className="spec-k">Nama Pemesan</span>
                  <strong className="spec-v">{profile.full_name}</strong>
                  {profile.company && <span className="spec-sub">{profile.company}</span>}
                </div>
                <div className="status-spec-item">
                  <span className="spec-k">WhatsApp &amp; Email</span>
                  <strong className="spec-v">{profile.phone}</strong>
                  <span className="spec-sub">{user?.email}</span>
                </div>
                <div className="status-spec-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="spec-k">Alamat Pengiriman</span>
                  <strong className="spec-v">{profile.address}</strong>
                  <span className="spec-sub">
                    {profile.city}, {profile.province} {profile.postal_code}
                    {profile.address_notes && ` — ${profile.address_notes}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="checkout-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <h3><Icon name="fileText" size="sm" /> Ringkasan Biaya</h3>
                <span className="badge badge-sm badge-purple">{order.quantity} Item</span>
              </div>
              <div className="summary-body">
                <div className="summary-lines">
                  <div className="summary-line"><span className="label">Harga per Pcs</span><span className="value">{formatIDR(price.unitPrice)}</span></div>
                  <div className="summary-line"><span className="label">Subtotal ({order.quantity} Pcs)</span><span className="value">{formatIDR(price.subtotal)}</span></div>
                  <div className="summary-line"><span className="label">Finishing &amp; Grommet</span><span className="value free">Termasuk</span></div>
                  {price.turnExtra > 0 && (
                    <div className="summary-line"><span className="label">Percepatan Produksi</span><span className="value">{formatIDR(price.turnExtra)}</span></div>
                  )}
                  <div className="summary-line"><span className="label">Pajak (PPN 11%)</span><span className="value">{formatIDR(price.tax)}</span></div>
                </div>
                <hr className="summary-divider" />
                <div className="summary-total" style={{ marginBottom: 4 }}>
                  <span className="label">Total</span>
                  <span className="amount">{formatIDR(price.total)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
                  Pembayaran dikonfirmasi oleh tim kami via WhatsApp
                </div>
              </div>

              <div className="summary-actions">
                {error && (
                  <div className="login-error" style={{ marginBottom: 0 }}>
                    <Icon name="x" size="sm" /><span>{error}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={!hasDesign || submitting}
                  style={!hasDesign ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>
                  {submitting
                    ? <><span className="login-spinner" style={{ width: 18, height: 18 }} /> Mengirim pesanan...</>
                    : <><Icon name="checkCircle" /> Kirim Pesanan</>}
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/preview')} disabled={submitting}>
                  <Icon name="arrowLeft" size="sm" /> Kembali ke Preview
                </button>
              </div>
            </div>

            <div className="guarantee-list" style={{ marginTop: 16 }}>
              {[
                { icon: 'checkCircle', title: '100% Garansi Warna CMYK', desc: 'Jika hasil cetak menyimpang dari proof, kami cetak ulang gratis.' },
                { icon: 'clock', title: 'Status Real-Time', desc: 'Pantau setiap tahapan produksi langsung dari halaman pesanan Anda.' },
                { icon: 'shieldCheck', title: 'File Desain Aman', desc: 'File disimpan privat dan hanya bisa diakses oleh Anda dan tim produksi.' },
              ].map((g, i) => (
                <div key={i} className="guarantee-item">
                  <Icon name={g.icon} size="sm" />
                  <div className="guar-text"><h5>{g.title}</h5><p>{g.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
