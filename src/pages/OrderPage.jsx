import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { useOrder, SIZES, MATERIALS, GROMMETS, formatIDR } from '../context/OrderContext'

export default function OrderPage() {
  const navigate = useNavigate()
  const { order, updateOrder, getPrice } = useOrder()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const price = getPrice()
  const size = order.selectedSize !== null ? SIZES[order.selectedSize] : SIZES[1]
  const bannerW = size.isCustom ? (order.customWidth || 100) : size.w
  const bannerH = size.isCustom ? (order.customHeight || 200) : size.h
  const sizeLabel = size.isCustom ? `${bannerW} × ${bannerH} cm (Custom)` : size.name

  // Proportional preview box for custom / sidebar preview
  const aspect = Math.max(20, bannerW) / Math.max(20, bannerH)
  const previewMaxW = 140
  const previewMaxH = 76
  let pW = previewMaxH * aspect
  let pH = previewMaxH
  if (pW > previewMaxW) {
    pW = previewMaxW
    pH = previewMaxW / aspect
  }
  const scaleFactor = Math.min(1, Math.max(0.5, 0.42 + (Math.max(bannerW, bannerH) / 300) * 0.58))
  const boxW = Math.max(18, Math.round(pW * scaleFactor))
  const boxH = Math.max(18, Math.round(pH * scaleFactor))

  const handleFile = (file) => {
    if (file) {
      updateOrder({ uploadedFile: { name: file.name, size: file.size, type: file.type } })
      const reader = new FileReader()
      reader.onload = (e) => {
        updateOrder({ uploadedFileUrl: e.target.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="page active">
      <div className="container">
        <div className="page-header">
          <div className="breadcrumb">LANGKAH 2 DARI 4 — KUSTOMISASI PESANAN</div>
          <h2>Terpilih: {sizeLabel} Banner Vinyl Premium</h2>
        </div>

        <div className="order-layout">
          <div className="order-main">

            {/* Custom Size Dimensions & Live Visual Preview */}
            {size.isCustom && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><span className="step-num"><Icon name="ruler" size="sm" /></span>Dimensi Ukuran Custom</div>
                  <span className="badge badge-purple">{bannerW} × {bannerH} cm</span>
                </div>
                <div className="order-custom-size-grid">
                  <div className="order-custom-inputs">
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Masukkan lebar dan tinggi banner sesuai kebutuhan Anda. Bentuk dan estimasi harga akan menyesuaikan secara otomatis.
                    </p>
                    <div className="input-row">
                      <div className="form-group">
                        <label className="form-label">Lebar Banner (cm)</label>
                        <input
                          type="number"
                          className="form-input"
                          min="20"
                          max="600"
                          value={order.customWidth || ''}
                          placeholder="100"
                          onChange={e => {
                            const raw = parseInt(e.target.value, 10)
                            updateOrder({ customWidth: isNaN(raw) ? 0 : Math.min(600, Math.max(1, raw)) })
                          }}
                          onBlur={() => {
                            if (!order.customWidth || order.customWidth < 20) updateOrder({ customWidth: 20 })
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tinggi Banner (cm)</label>
                        <input
                          type="number"
                          className="form-input"
                          min="20"
                          max="600"
                          value={order.customHeight || ''}
                          placeholder="200"
                          onChange={e => {
                            const raw = parseInt(e.target.value, 10)
                            updateOrder({ customHeight: isNaN(raw) ? 0 : Math.min(600, Math.max(1, raw)) })
                          }}
                          onBlur={() => {
                            if (!order.customHeight || order.customHeight < 20) updateOrder({ customHeight: 20 })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="size-card-preview" style={{ margin: 0, height: 110 }}>
                    <div
                      className="size-illustration"
                      style={{
                        width: boxW,
                        height: boxH,
                        borderStyle: 'dashed',
                        position: 'relative',
                        transition: 'width 0.2s ease, height 0.2s ease',
                      }}
                    />
                    <span className="size-preview-dim">
                      {bannerW} × {bannerH} cm ({bannerW >= bannerH ? 'Horizontal' : 'Vertikal'})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 1. Quantity */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">1</span>Jumlah & Diskon Volume</div>
                <span className="badge badge-blue">Tier 1 Aktif</span>
              </div>
              <div className="qty-options">
                {[
                  { range: '1-2 PCS', price: price.basePrice, label: 'Harga Standar', color: 'badge-blue', qty: 1 },
                  { range: '3-9 PCS', price: Math.round(price.basePrice * 0.9), label: 'Hemat 10%', color: 'badge-green', qty: 5, save: Math.round(price.basePrice * 0.1) },
                  { range: '10+ PCS', price: Math.round(price.basePrice * 0.8), label: 'Harga Grosir', color: 'badge-purple', qty: 10, save: Math.round(price.basePrice * 0.2) },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`qty-option ${order.quantity >= opt.qty && (i === 2 || (i === 1 && order.quantity < 10) || (i === 0 && order.quantity < 3)) ? 'selected' : ''}`}
                    onClick={() => updateOrder({ quantity: opt.qty })}
                  >
                    <span className={`badge badge-sm ${opt.color} qty-badge`}>{opt.range}</span>
                    <span className="qty-price">{formatIDR(opt.price)}</span>
                    <span className="qty-per">/pcs</span>
                    <span className="qty-label">{opt.label}</span>
                    {opt.save && <span className="qty-save">Hemat {formatIDR(opt.save)}</span>}
                  </div>
                ))}
              </div>
              <div className="qty-input-row">
                <label>Masukkan Jumlah Pasti</label>
                <div className="qty-counter">
                  <button onClick={() => updateOrder({ quantity: Math.max(1, order.quantity - 1) })}>−</button>
                  <input
                    type="number"
                    className="qty-value"
                    value={order.quantity}
                    min="1"
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v) && v >= 1) updateOrder({ quantity: v })
                    }}
                  />
                  <button onClick={() => updateOrder({ quantity: order.quantity + 1 })}>+</button>
                </div>
              </div>
            </div>

            {/* 2. Material */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">2</span>Material & Substrat</div>
                <span className="badge badge-green badge-sm"><Icon name="check" size="sm" /> ISO 9001 Teruji</span>
              </div>
              <div className="material-options">
                {MATERIALS.map((mat, i) => (
                  <div
                    key={i}
                    className={`material-option ${order.selectedMaterial === i ? 'selected' : ''}`}
                    onClick={() => updateOrder({ selectedMaterial: i })}
                  >
                    <h5>{mat.name}</h5>
                    <p className="mat-price">{mat.extra > 0 ? `+${formatIDR(mat.extra)}` : 'Termasuk'}</p>
                    <p>{mat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Grommet */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">3</span>Konfigurasi Pemasangan & Grommet</div>
              </div>
              <div className="grommet-grid">
                {GROMMETS.map((g, i) => (
                  <div
                    key={i}
                    className={`grommet-option ${order.selectedGrommet === i ? 'selected' : ''}`}
                    onClick={() => updateOrder({ selectedGrommet: i })}
                  >
                    <div className="grommet-radio" />
                    <div>
                      <h5>{g.name}</h5>
                      <p>{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. File Upload */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">4</span>Upload Desain & Preflight</div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Maks 350MB</span>
              </div>
              <div
                className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="upload-icon"><Icon name="upload" size="lg" /></div>
                <p className="upload-text">Seret & Lepas file di sini, atau <a>telusuri file</a></p>
                <p className="upload-formats">Format: PDF, AI, PSD, TIFF, SVG, EPS, JPG/PNG (CMYK/Profil ICC)</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.ai,.psd,.tiff,.svg,.eps,.jpg,.jpeg,.png"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {order.uploadedFile && (
                <>
                  <div className="uploaded-file">
                    <div className="file-icon"><Icon name="file" /></div>
                    <div className="file-info">
                      <div className="file-name">{order.uploadedFile.name}</div>
                      <div className="file-meta">{(order.uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </div>
                    <div className="file-status validated"><Icon name="check" size="sm" /> Tervalidasi</div>
                  </div>
                  <div className="preview-btn-row">
                    <Icon name="eye" size="lg" />
                    <p>Periksa zona potong, garis bleed, dan kalibrasi warna pada canvas interaktif.</p>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/preview')}>Preview Desain Saya</button>
                  </div>
                </>
              )}
            </div>

            {/* 5. Production Instructions */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">5</span>Instruksi Produksi & Catatan Cetak</div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Berikan catatan spesifik untuk proses produksi: posisi logo, margin, penyesuaian warna, dll.
              </p>
              <textarea
                className="form-textarea"
                placeholder="Contoh: Tolong beri margin 5 cm di sisi kiri untuk logo, sesuaikan warna Pantone 2965C..."
                value={order.productionNotes}
                onChange={e => updateOrder({ productionNotes: e.target.value })}
              />
            </div>

            {/* 6. Turnaround */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">6</span>Kecepatan Produksi & Pengerjaan</div>
              </div>
              <div className="turnaround-options">
                {[
                  { name: 'Standar 2-3 Hari', detail: 'Pengerjaan hari kerja biasa', price: 'Termasuk (Gratis)', green: true },
                  { name: 'Express 1 Hari', detail: 'Selesai besok, dikirim lusa', price: '+Rp 50.000' },
                  { name: 'Same-Day Priority', detail: 'Selesai hari ini jika order sebelum 10:00', price: '+Rp 95.000' },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`turnaround-option ${order.selectedTurnaround === i ? 'selected' : ''}`}
                    onClick={() => updateOrder({ selectedTurnaround: i })}
                  >
                    <div className="turn-icon" />
                    <h5>{opt.name}</h5>
                    <div className="turn-detail">{opt.detail}</div>
                    <div className="turn-price" style={opt.green ? { color: 'var(--green)' } : {}}>{opt.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY SIDEBAR */}
          <div className="order-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <h3><Icon name="cart" size="sm" /> Ringkasan Pesanan</h3>
                <span className="badge badge-sm badge-blue">JOB #BCP-0924</span>
              </div>
              <div className="summary-body">
                <div className="summary-product">
                  <div className="product-thumb">
                    <div
                      className="size-illustration"
                      style={{
                        width: Math.max(12, Math.round(boxW * 0.42)),
                        height: Math.max(12, Math.round(boxH * 0.42)),
                        borderStyle: 'dashed',
                        transition: 'width 0.2s ease, height 0.2s ease',
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h4>Banner Vinyl Custom</h4>
                    <p>Ukuran: <strong>{sizeLabel}</strong></p>
                    <p>Material: {MATERIALS[order.selectedMaterial].name}</p>
                  </div>
                </div>

                <div className="summary-lines">
                  <div className="summary-line">
                    <span className="label">Harga Dasar Banner</span>
                    <span className="value">{formatIDR(price.basePrice)}</span>
                  </div>
                  <div className="summary-line">
                    <span className="label">Upgrade Material</span>
                    <span className={`value ${price.matExtra === 0 ? 'free' : ''}`}>{price.matExtra > 0 ? formatIDR(price.matExtra) : 'Gratis'}</span>
                  </div>
                  <div className="summary-line">
                    <span className="label">Finishing & Grommet</span>
                    <span className="value free">Gratis</span>
                  </div>
                  <div className="summary-line">
                    <span className="label">Percepatan Produksi</span>
                    <span className={`value ${price.turnExtra === 0 ? 'free' : ''}`}>{price.turnExtra > 0 ? formatIDR(price.turnExtra) : 'Gratis'}</span>
                  </div>
                  <div className="summary-line qty">
                    <span className="label">Jumlah</span>
                    <span className="value">× {order.quantity}</span>
                  </div>
                </div>

                <hr className="summary-divider" />
                <div className="summary-total">
                  <span className="label">Total Estimasi</span>
                  <span className="amount">{formatIDR(price.total)}</span>
                </div>
              </div>
              <div className="summary-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/preview')}>
                  <Icon name="eye" /> Preview Desain
                </button>
                <button className="btn btn-green btn-lg" onClick={() => navigate('/checkout')}>
                  Lanjut ke Konfirmasi <Icon name="arrowRight" />
                </button>
                <div className="summary-note">
                  <Icon name="clock" size="sm" />
                  Estimasi selesai cetak <strong style={{ color: 'var(--text-white)', marginLeft: 4 }}>Besok, 14:00 WIB</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
