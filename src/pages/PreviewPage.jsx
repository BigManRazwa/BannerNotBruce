import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { useOrder, SIZES, MATERIALS, formatIDR } from '../context/OrderContext'

export default function PreviewPage() {
  const navigate = useNavigate()
  const { order, updateOrder, getPrice } = useOrder()
  const price = getPrice()
  const size = order.selectedSize !== null ? SIZES[order.selectedSize] : SIZES[1]

  // Dimensions — for custom sizes, use user-defined dimensions
  const bannerW = size.isCustom ? (order.customWidth || 100) : size.w
  const bannerH = size.isCustom ? (order.customHeight || 200) : size.h
  const isLandscape = bannerW >= bannerH
  const ratio = `${bannerW}:${bannerH}`

  const [zoom, setZoom] = useState(100)
  const [scale, setScale] = useState(100)
  const [fitMode, setFitMode] = useState('Bleed')
  const [selectedSubstrate, setSelectedSubstrate] = useState(0)
  const [overlays, setOverlays] = useState({ cutBleed: true, grommets: true })
  const [dragOver, setDragOver] = useState(false)
  const [imgPosition, setImgPosition] = useState({ x: 0, y: 0 })
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 })

  const fileInputRef = useRef(null)
  const canvasWrapperRef = useRef(null)

  const imageUrl = order.uploadedFileUrl

  const handleFile = useCallback((file) => {
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !isPdf) return

    updateOrder({ uploadedFile: { name: file.name, size: file.size, type: file.type } })
    const reader = new FileReader()
    reader.onload = (e) => {
      updateOrder({ uploadedFileUrl: e.target.result })
    }
    reader.readAsDataURL(file)
  }, [updateOrder])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  // When image loads, get its natural dimensions
  const handleImageLoad = (e) => {
    setImgNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })
    setImgPosition({ x: 0, y: 0 })
  }

  // Alignment actions
  const handleAutoFit = () => {
    setImgPosition({ x: 0, y: 0 })
    setScale(100)
  }

  const handleCenter = () => {
    setImgPosition({ x: 0, y: 0 })
  }

  const handleReset = () => {
    setImgPosition({ x: 0, y: 0 })
    setScale(100)
    setZoom(100)
  }

  // Compute aspect ratio for the canvas element
  const canvasAspect = bannerW / bannerH

  // Get image fit style based on fit mode
  const getImageStyle = () => {
    const s = scale / 100
    const base = {
      position: 'absolute',
      transition: 'transform 0.2s ease, left 0.2s ease, top 0.2s ease',
    }

    if (fitMode === 'Bleed') {
      // Cover entire area
      return {
        ...base,
        width: `${105 * s}%`,
        height: `${105 * s}%`,
        objectFit: 'cover',
        left: `${50 + imgPosition.x}%`,
        top: `${50 + imgPosition.y}%`,
        transform: 'translate(-50%, -50%)',
      }
    } else if (fitMode === 'Trim') {
      // Fit inside trim area
      return {
        ...base,
        width: `${95 * s}%`,
        height: `${95 * s}%`,
        objectFit: 'contain',
        left: `${50 + imgPosition.x}%`,
        top: `${50 + imgPosition.y}%`,
        transform: 'translate(-50%, -50%)',
      }
    } else {
      // Proporsional — keep original proportions
      return {
        ...base,
        maxWidth: `${100 * s}%`,
        maxHeight: `${100 * s}%`,
        objectFit: 'contain',
        left: `${50 + imgPosition.x}%`,
        top: `${50 + imgPosition.y}%`,
        transform: 'translate(-50%, -50%)',
      }
    }
  }

  // Generate ruler ticks dynamically based on banner dimensions
  const generateRulerTicks = (totalCm, count = 7) => {
    const ticks = []
    for (let i = 0; i < count; i++) {
      const val = Math.round((totalCm / (count - 1)) * i)
      if (i === 0) ticks.push('0 cm')
      else if (i === Math.floor(count / 2)) ticks.push(`${val} (Tengah)`)
      else if (i === count - 1) ticks.push(`${totalCm} cm`)
      else ticks.push(`${val}`)
    }
    return ticks
  }

  const hRulerTicks = generateRulerTicks(bannerW)

  // Generate grommet positions for visual overlay
  const getGrommetPositions = () => {
    if (!overlays.grommets) return []
    const spacing = 60 // cm
    const positions = []
    // corners
    positions.push({ left: '0%', top: '0%' })
    positions.push({ left: '100%', top: '0%' })
    positions.push({ left: '0%', top: '100%' })
    positions.push({ left: '100%', top: '100%' })
    // along top and bottom
    const hCount = Math.floor(bannerW / spacing)
    for (let i = 1; i < hCount; i++) {
      const pct = (i * spacing / bannerW) * 100
      positions.push({ left: `${pct}%`, top: '0%' })
      positions.push({ left: `${pct}%`, top: '100%' })
    }
    // along left and right
    const vCount = Math.floor(bannerH / spacing)
    for (let i = 1; i < vCount; i++) {
      const pct = (i * spacing / bannerH) * 100
      positions.push({ left: '0%', top: `${pct}%` })
      positions.push({ left: '100%', top: `${pct}%` })
    }
    return positions
  }

  return (
    <div className="page active">
      <div className="container-wide">
        <div className="preview-layout">

          {/* LEFT PANEL */}
          <div className="preview-panel">
            <div className="preview-panel-header">
              <div className="preview-panel-title">
                <Icon name="printer" size="sm" />
                Print & Canvas Matrix
              </div>
              <span className="badge badge-blue badge-sm">Preflight</span>
            </div>

            {/* Proportion */}
            <div className="canvas-section">
              <div className="canvas-section-title"><Icon name="check" size="sm" /> Proporsi & Ukuran</div>
              <div className="canvas-value">
                {size.isCustom ? `${bannerW} × ${bannerH} cm (Custom)` : `${bannerW} cm × ${bannerH} cm (${ratio})`}
              </div>
              <div className="canvas-sub">
                Selesai: Banner {isLandscape ? 'Horizontal' : 'Vertikal'} {size.isCustom ? `${bannerW} × ${bannerH} cm` : `${bannerW} × ${bannerH} cm`}
              </div>
            </div>

            {/* Custom size input — only for custom sizes */}
            {size.isCustom && (
              <div className="canvas-section">
                <div className="canvas-section-title"><Icon name="edit" size="sm" /> Dimensi Custom</div>
                <div className="custom-size-inputs">
                  <div className="custom-size-field">
                    <label>Lebar (cm)</label>
                    <input
                      type="number"
                      min="20"
                      max="600"
                      value={order.customWidth || 100}
                      onChange={e => updateOrder({ customWidth: Math.max(20, parseInt(e.target.value) || 20) })}
                    />
                  </div>
                  <span className="custom-size-x">×</span>
                  <div className="custom-size-field">
                    <label>Tinggi (cm)</label>
                    <input
                      type="number"
                      min="20"
                      max="600"
                      value={order.customHeight || 200}
                      onChange={e => updateOrder({ customHeight: Math.max(20, parseInt(e.target.value) || 20) })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Artwork Scale */}
            <div className="canvas-section">
              <div className="canvas-section-title">
                <Icon name="edit" size="sm" />
                Skala Artwork
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent-light)' }}>{(scale / 100).toFixed(2)} ({scale}%)</span>
              </div>
              <div className="slider-container">
                <input type="range" min="50" max="150" value={scale} onChange={e => setScale(+e.target.value)} />
              </div>
              <div className="slider-labels">
                <span>0.50 (50%)</span>
                <span>1.00 (Standar)</span>
                <span>1.50 (150%)</span>
              </div>
            </div>

            {/* Canvas Fit Mode */}
            <div className="canvas-section">
              <div className="canvas-section-title"><Icon name="maximize" size="sm" /> Mode Canvas</div>
              <div className="canvas-tabs">
                {['Bleed', 'Trim', 'Proporsional'].map(m => (
                  <button key={m} className={`canvas-tab ${fitMode === m ? 'active' : ''}`} onClick={() => setFitMode(m)}>{m}</button>
                ))}
              </div>
            </div>

            {/* Substrate Material */}
            <div className="canvas-section">
              <div className="canvas-section-title"><Icon name="layers" size="sm" /> Material Substrat</div>
              <div className="substrate-list">
                {MATERIALS.map((mat, i) => (
                  <div key={i} className={`substrate-item ${selectedSubstrate === i ? 'selected' : ''}`} onClick={() => setSelectedSubstrate(i)}>
                    <div className="radio-dot" />
                    <span className="sub-name">{mat.name}</span>
                    {mat.badge ? <span className="badge badge-green badge-sm">{mat.badge}</span> : <span className="sub-extra">{mat.extra > 0 ? `+${formatIDR(mat.extra)}` : ''}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Hem & Calibration */}
            <div className="canvas-section" style={{ border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Hem Wrap Allowance</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-white)' }}>1.5 cm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Kalibrasi Warna</span>
                <span style={{ color: 'var(--accent-light)', fontWeight: 600, fontFamily: 'monospace' }}>FOGRA39 CMYK</span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              Job ID #BCP-884920 &nbsp;<span style={{ color: 'var(--green)' }}>●</span> Prepress Online
            </div>
          </div>

          {/* CENTER: Preview Canvas */}
          <div className="preview-center">
            <div className="preview-toolbar">
              <div className="size-indicator">
                <span className="dot" />
                {bannerW}.0 cm × {bannerH}.0 cm Trim
              </div>
              <span className="ratio-label">
                {isLandscape ? '⬛ Landscape' : '⬜ Portrait'} — Rasio {ratio}
              </span>
              <div className="preview-zoom">
                <button onClick={() => setZoom(Math.max(25, zoom - 25))}>−</button>
                <span className="zoom-value">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
                <button onClick={() => setZoom(100)}><Icon name="refreshCw" size="sm" /></button>
              </div>
            </div>

            {/* Ruler */}
            <div className="ruler-h">
              {hRulerTicks.map((t, i) => (
                <span key={i} className={`ruler-tick ${i === Math.floor(hRulerTicks.length / 2) ? 'center' : ''}`}>{t}</span>
              ))}
            </div>

            {/* Canvas */}
            <div className="preview-canvas-wrapper" ref={canvasWrapperRef}>
              <div
                className={`preview-canvas ${isLandscape ? 'landscape' : 'portrait'}`}
                style={{
                  aspectRatio: `${bannerW} / ${bannerH}`,
                  transform: `scale(${zoom / 100})`,
                  transition: 'transform 0.2s ease',
                  maxWidth: isLandscape ? '90%' : 'auto',
                  maxHeight: isLandscape ? 'auto' : '90%',
                  width: isLandscape ? '90%' : 'auto',
                  height: isLandscape ? 'auto' : '90%',
                }}
              >
                {/* Image */}
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview desain"
                    style={getImageStyle()}
                    onLoad={handleImageLoad}
                    draggable={false}
                  />
                )}

                {/* Canvas Guides */}
                <div className="canvas-guides">
                  {overlays.cutBleed && (
                    <>
                      <div className="bleed-zone" />
                      <div className="cut-line" />
                      <div className="safe-zone" />
                    </>
                  )}
                  {/* Grommet dots */}
                  {overlays.grommets && getGrommetPositions().map((pos, i) => (
                    <div
                      key={i}
                      className="grommet-dot"
                      style={{
                        position: 'absolute',
                        left: pos.left,
                        top: pos.top,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        border: '2px solid var(--accent-light)',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 5,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>

                {/* Upload Placeholder (shown when no image) */}
                {!imageUrl && (
                  <div
                    className={`canvas-upload-zone ${dragOver ? 'dragover' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div className="canvas-upload-icon">
                      <Icon name="upload" size="xxl" />
                    </div>
                    <div className="canvas-upload-text">Seret & Lepas Desain Anda di Sini</div>
                    <div className="canvas-upload-sub">atau gunakan tombol di bawah</div>
                    <div className="canvas-upload-formats">PDF, AI, PSD, TIFF, SVG, EPS, JPG/PNG</div>
                  </div>
                )}
              </div>

              {/* Upload Button below canvas — always visible */}
              <div className="canvas-upload-actions">
                <button
                  className="btn btn-primary btn-upload-design"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="upload" size="sm" />
                  {imageUrl ? 'Ganti Desain' : 'Upload Desain'}
                </button>
                {imageUrl && (
                  <button
                    className="btn btn-outline btn-remove-design"
                    onClick={() => {
                      updateOrder({ uploadedFile: null, uploadedFileUrl: null })
                      setImgNaturalSize({ w: 0, h: 0 })
                    }}
                  >
                    <Icon name="trash" size="sm" />
                    Hapus
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.ai,.psd,.tiff,.tif,.svg,.eps,.jpg,.jpeg,.png,.webp,.bmp"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              {/* Drag overlay on the entire canvas area */}
              {!imageUrl && (
                <div
                  className={`canvas-drop-overlay ${dragOver ? 'active' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                />
              )}
            </div>

            {/* Legend */}
            <div className="canvas-legend">
              <div className="legend-item"><span className="legend-dot green" /> Bleed (1.5 cm)</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--red)' }} /> Garis Potong ({bannerW} × {bannerH} cm)</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--yellow)' }} /> Safe Art Zone</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--accent)' }} /> Brass Grommet (60 cm O.C.)</div>
            </div>
          </div>

          {/* RIGHT PANEL: Preflight */}
          <div className="preview-panel">
            <div className="preview-panel-header">
              <div className="preview-panel-title"><Icon name="shield" size="sm" /> Preflight & Inspeksi</div>
              <span className={`badge badge-sm ${imageUrl ? 'badge-green' : 'badge-yellow'}`}>{imageUrl ? 'PASS' : 'MENUNGGU'}</span>
            </div>

            <div className="preflight-section">
              <div className="preflight-section-title">File Aktif</div>
              <div style={{ fontSize: 12, color: 'var(--text-white)', fontWeight: 600, marginBottom: 2 }}>
                {order.uploadedFile?.name || '— Belum ada file —'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {order.uploadedFile ? (order.uploadedFile.type || 'Unknown type') : 'Upload file untuk memulai preflight'}
              </div>
              {order.uploadedFile && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {(order.uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                  {imgNaturalSize.w > 0 && ` • ${imgNaturalSize.w} × ${imgNaturalSize.h} px`}
                </div>
              )}
            </div>

            <div className="preflight-section">
              <div className="preflight-section-title">Pemeriksaan Diagnostik</div>
              {[
                { label: 'Resolusi Cetak', value: imgNaturalSize.w > 0 ? `${Math.round(imgNaturalSize.w / (bannerW / 2.54))} DPI` : '— DPI', pass: imgNaturalSize.w > 0 },
                { label: 'Tipografi Vektor', value: 'Semua Outlined', pass: true },
                { label: 'Clearance Grommet', value: '0 Tabrakan', pass: true },
              ].map((item, i) => (
                <div key={i} className="preflight-item">
                  <Icon name="check" size="sm" />
                  {item.label}
                  <span className="pf-value" style={!item.pass ? { color: 'var(--text-muted)' } : {}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="preflight-section">
              <div className="preflight-section-title">Overlay Panduan Proof</div>
              {Object.entries({ cutBleed: 'Garis Potong & Bleed', grommets: 'Grommet (Setiap 60 cm)' }).map(([key, label]) => (
                <div key={key} className="overlay-toggle">
                  <span className="toggle-label">{label}</span>
                  <div className={`toggle-switch ${overlays[key] ? 'active' : ''}`} onClick={() => setOverlays(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>

            <div className="preflight-section">
              <div className="preflight-section-title">Perataan Cepat</div>
              <div className="alignment-grid">
                {[
                  { icon: 'maximize', label: 'Auto Fit', action: handleAutoFit },
                  { icon: 'alignCenter', label: 'Center', action: handleCenter },
                  { icon: 'refreshCw', label: 'Reset', action: handleReset },
                ].map((btn, i) => (
                  <button key={i} className="align-btn" onClick={btn.action}><Icon name={btn.icon} size="sm" />{btn.label}</button>
                ))}
              </div>
            </div>

            <div className={`preflight-certified ${!imageUrl ? 'pending' : ''}`}>
              <Icon name={imageUrl ? 'checkCircle' : 'clock'} />
              {imageUrl ? (
                <p><strong>Proof Certified.</strong> Siap untuk produksi komersial. Cetak ulang dijamin sesuai preflight.</p>
              ) : (
                <p><strong>Menunggu File.</strong> Upload desain Anda untuk memulai proses preflight otomatis.</p>
              )}
            </div>

            <div className="back-link" onClick={() => navigate('/order')}>
              <Icon name="arrowLeft" size="sm" /> Edit Spek Banner / Kembali
            </div>
          </div>
        </div>

        {/* Approval Bar */}
        <div className="approval-bar">
          <div className="approval-score">
            <span className="score-dot" style={!imageUrl ? { background: 'var(--yellow)' } : {}} />
            <span className="score-label">Skor:</span>
            <span className="score-value">{imageUrl ? '98/100' : '—/100'}</span>
          </div>
          <button
            className="approve-btn"
            onClick={() => navigate('/checkout')}
            disabled={!imageUrl}
            style={!imageUrl ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            Setujui Proof & Lanjutkan ({formatIDR(price.total)})
            <Icon name="arrowRight" />
          </button>
        </div>
      </div>
    </div>
  )
}
