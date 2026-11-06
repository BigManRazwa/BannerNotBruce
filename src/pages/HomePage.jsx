import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import LightRays from '../components/LightRays'
import { useOrder, SIZES, getCustomPrice } from '../context/OrderContext'

// Filter tabs for the size grid — each returns true if a size belongs to the tab
const SIZE_FILTERS = [
  { label: 'Semua Populer', test: () => true },
  { label: 'Ukuran Custom', test: s => s.isCustom },
  { label: 'Outdoor Besar', test: s => !s.isCustom && s.w * s.h >= 120 * 240 },
  { label: 'Spanduk & Horizontal', test: s => !s.isCustom && (s.w > s.h || s.h / s.w >= 4) },
]

const STEPS = [
  { icon: 'grid', title: 'Pilih Ukuran & Harga', sub: 'Tentukan dimensi banner dari ukuran populer atau custom.', to: '/' },
  { icon: 'upload', title: 'Upload Desain', sub: 'Unggah file artwork Anda — PDF, AI, PNG, atau JPG.', to: '/order' },
  { icon: 'eye', title: 'Preview & Setujui', sub: 'Cek hasil, area aman, dan bleed sebelum dicetak.', to: '/preview' },
  { icon: 'clock', title: 'Kirim & Pantau Produksi', sub: 'Kirim pesanan dan pantau setiap tahap produksi secara real-time.', to: '/pesanan' },
]

const STATS = [
  { value: '24 Jam', label: 'Waktu produksi' },
  { value: '1440 DPI', label: 'Resolusi cetak' },
  { value: '3–5 Thn', label: 'Ketahanan outdoor' },
  { value: '100%', label: 'Garansi cetak ulang' },
]

function getPreviewBox(w, h) {
  const safeW = Math.max(20, Number(w) || 100)
  const safeH = Math.max(20, Number(h) || 100)
  const aspect = safeW / safeH
  const maxW = 156
  const maxH = 74
  let fitW = maxH * aspect
  let fitH = maxH
  if (fitW > maxW) {
    fitW = maxW
    fitH = maxW / aspect
  }
  const longest = Math.max(safeW, safeH)
  const scale = Math.min(1, Math.max(0.5, 0.42 + (longest / 300) * 0.58))
  return {
    iw: Math.max(16, Math.round(fitW * scale)),
    ih: Math.max(16, Math.round(fitH * scale)),
  }
}

function SizeCard({ size, index, isPopular }) {
  const navigate = useNavigate()
  const { order, updateOrder } = useOrder()

  const handleSelect = () => {
    updateOrder({ selectedSize: index })
    navigate('/order')
  }

  const w = size.isCustom ? (order.customWidth || 100) : size.w
  const h = size.isCustom ? (order.customHeight || 200) : size.h
  const { iw, ih } = getPreviewBox(w, h)
  const displayPrice = size.isCustom ? getCustomPrice(w, h) : size.price

  return (
    <div className={`size-card hover-lift ${isPopular ? 'popular' : ''}`} onClick={handleSelect}>
      <div className="size-card-preview">
        <div
          className="size-illustration"
          style={{
            width: iw,
            height: ih,
            borderStyle: 'dashed',
            position: 'relative',
            transition: 'width 0.2s ease, height 0.2s ease',
          }}
        />
        <span className="size-preview-dim">{w} × {h} cm</span>
      </div>
      <h4>{size.isCustom ? `Ukuran Custom (${w} × ${h} cm)` : size.name}</h4>

      {size.isCustom ? (
        <div className="size-custom-inline" onClick={e => e.stopPropagation()}>
          <label className="size-custom-field">
            <span>Lebar (cm)</span>
            <input
              type="number"
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
          </label>
          <span className="size-custom-sep">×</span>
          <label className="size-custom-field">
            <span>Tinggi (cm)</span>
            <input
              type="number"
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
          </label>
        </div>
      ) : (
        <p className="size-desc">{size.desc}</p>
      )}

      <div className="size-price">
        <span className="label">{size.isCustom ? 'Estimasi' : 'Mulai dari'}</span>
        <span className="currency">Rp</span>
        <span className="amount">{displayPrice.toLocaleString('id-ID')}</span>
      </div>
      <button className={`btn ${isPopular ? 'btn-primary' : size.isCustom ? 'btn-outline' : 'btn-secondary'} btn-sm`}>
        {size.isCustom ? 'Gunakan Ukuran Custom' : 'Pilih Ukuran & Konfigurasi'}
        <Icon name="arrowRight" size="sm" />
      </button>
    </div>
  )
}

function MaterialSpecCard({ title, subtitle, desc, badge, specs, variant }) {
  return (
    <div className="material-card hover-lift">
      <div className={`material-card-img material-${variant}`}>
        {badge && <span className="badge badge-blue" style={{ position: 'absolute', top: 12, left: 12 }}>{badge}</span>}
      </div>
      <div className="material-card-body">
        <h4>{title}</h4>
        <div className="subtitle">{subtitle}</div>
        <p>{desc}</p>
        <div className="specs-list">
          {specs.map((s, i) => (
            <div key={i} className="spec-item">
              <Icon name="check" size="sm" />
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { updateOrder } = useOrder()
  const [filter, setFilter] = useState(0)
  const scrollToSizes = () => document.getElementById('size-section')?.scrollIntoView({ behavior: 'smooth' })
  const handleCustomHeroClick = () => {
    const customIdx = SIZES.findIndex(s => s.isCustom)
    if (customIdx !== -1) updateOrder({ selectedSize: customIdx })
    navigate('/order')
  }

  const visibleSizes = SIZES
    .map((size, index) => ({ size, index }))
    .filter(({ size }) => SIZE_FILTERS[filter].test(size))

  return (
    <div className="page active">
      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-rays">
          <LightRays
            raysOrigin="top-center"
            raysColor="#8b5cf6"
            raysSpeed={0.7}
            lightSpread={0.55}
            rayLength={1.8}
            glow={0.3}
            haze={0.5}
            followMouse
            mouseInfluence={0.1}
            rayDensity={1}
            raySharpness={0.2}
            atmosphere={0.4}
            intensity={0.75}
            fadeDistance={0.8}
            saturation={1}
            opacity={0.5}
            cursorShadow
            clickPulse
            intro
          />
        </div>
        <div className="lp-hero-grid" />
        <div className="lp-hero-fade" />

        <div className="container lp-hero-inner">
          <span className="lp-pill">
            <span className="lp-pill-tag"><Icon name="zap" size="sm" /> Baru</span>
            Cetak cepat, siap kirim dalam 24 jam
          </span>

          <h1 className="lp-title">
            Banner Custom Vinyl &amp; Kain{' '}
            <span className="text-gradient">Siap dalam 24 Jam</span>
          </h1>

          <p className="lp-subtitle">
            Pilih ukuran, upload desain, dan kami cetakkan banner berkualitas tinggi untuk bisnis, acara,
            atau promosi Anda. Resolusi tinggi, tahan cuaca, dan bergaransi.
          </p>

          <div className="lp-cta">
            <button className="btn btn-primary btn-lg" onClick={scrollToSizes}>
              Lihat Ukuran Populer
              <Icon name="arrowRight" size="sm" />
            </button>
            <button className="btn btn-glass btn-lg" onClick={handleCustomHeroClick}>
              <Icon name="edit" size="sm" />
              Ukuran Custom
            </button>
          </div>

          <div className="lp-stats">
            {STATS.map(stat => (
              <div key={stat.label} className="lp-stat">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="lp-scroll-hint" onClick={scrollToSizes} aria-label="Gulir ke bawah" />
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="lp-section-header">
            <div className="section-eyebrow">Cara Kerja</div>
            <h2 className="section-title">4 Langkah Mudah ke Banner Anda</h2>
            <p className="section-desc">Dari ukuran hingga pengiriman — semuanya bisa dilakukan online dalam hitungan menit.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="lp-step"
                onClick={() => (step.to === '/' ? scrollToSizes() : navigate(step.to))}
              >
                <span className="lp-step-num">0{i + 1}</span>
                <div className="lp-step-icon"><Icon name={step.icon} /></div>
                <h4>{step.title}</h4>
                <p>{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Size Selection */}
      <section className="section" id="size-section">
        <div className="container">
          <div className="lp-section-header">
            <div className="section-eyebrow">Standardisasi &amp; Dimensi Presisi</div>
            <h2 className="section-title">Pilih Ukuran Banner Anda</h2>
            <p className="section-desc">
              Semua banner menggunakan bahan vinyl berkualitas tinggi dengan hasil cetak resolusi tinggi dan finishing anti-pudar.
            </p>
            <div className="section-filters">
              {SIZE_FILTERS.map((tab, i) => (
                <button
                  key={tab.label}
                  className={`filter-tab ${i === filter ? 'active' : ''}`}
                  onClick={() => setFilter(i)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="size-grid">
            {visibleSizes.map(({ size, index }) => (
              <SizeCard key={index} size={size} index={index} isPopular={size.tag === 'Terpopuler'} />
            ))}
          </div>
        </div>
      </section>

      {/* Material Specs */}
      <section className="section">
        <div className="container">
          <div className="lp-section-header">
            <div className="section-eyebrow">Material &amp; Kualitas Cetak</div>
            <h2 className="section-title">Spesifikasi Material &amp; Kualitas</h2>
            <p className="section-desc">
              Material pilihan terbaik untuk ketahanan tinggi, tahan cuaca, dan hasil cetak resolusi premium.
            </p>
          </div>
          <div className="material-grid">
            <MaterialSpecCard
              variant="vinyl"
              title="13oz Scrim Matte Vinyl"
              subtitle="Standar Industri / Paling Populer"
              desc="Bahan vinyl matte standar industri, tahan cuaca, anti-pudar, dan hasil cetak tajam. Cocok untuk outdoor & indoor."
              badge="Terpopuler"
              specs={['Ketahanan 3-5 tahun outdoor', 'Anti-pudar & tahan UV', 'Resolusi cetak hingga 1440 DPI']}
            />
            <MaterialSpecCard
              variant="blockout"
              title="18oz Heavy Blockout Matte"
              subtitle="Heavy Duty / Kualitas Premium"
              desc="Material ekstra tebal dengan opaque sempurna. Tidak tembus cahaya, ideal untuk backdrop dan banner dua sisi."
              specs={['100% Opaque / Blockout penuh', 'Ketebalan premium 18oz', 'Finishing matte profesional']}
            />
            <MaterialSpecCard
              variant="mesh"
              title="9oz Wind-Permeable Mesh"
              subtitle="Outdoor / Tahan Angin"
              desc="Material mesh berlubang mikro yang memungkinkan angin melewati banner. Ideal untuk gedung tinggi & area berangin."
              specs={['Permeabilitas angin 37%', 'Ideal untuk fasad gedung', 'Ringan & mudah dipasang']}
            />
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="section">
        <div className="container">
          <div className="lp-cta-banner">
            <h2>Siap membuat banner Anda <span className="text-gradient">bersinar?</span></h2>
            <p>Upload desain sekarang dan dapatkan preview instan. Tim kami siap membantu jika Anda butuh bantuan.</p>
            <div className="lp-cta">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/order')}>
                Mulai Pesan Sekarang
                <Icon name="arrowRight" size="sm" />
              </button>
              <button className="btn btn-glass btn-lg" onClick={scrollToSizes}>
                Lihat Harga
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="container">
          <div className="trust-grid">
            {[
              { icon: 'shieldCheck', title: '100% Garansi', desc: 'Garansi cetak ulang gratis jika hasil tidak sesuai spesifikasi.' },
              { icon: 'truck', title: 'Pengiriman Cepat', desc: 'Pengiriman express ke seluruh Indonesia. Estimasi 1-3 hari kerja.' },
              { icon: 'layers', title: 'Spesifikasi Material', desc: '13oz & 18oz vinyl blockout, mesh tahan angin, welded hem, dan brass grommet.' },
              { icon: 'phone', title: 'Dukungan Langsung', desc: 'Tim spesialis siap membantu Senin-Jumat, 08:00-17:00 WIB.' },
            ].map((item, i) => (
              <div key={i} className="trust-item">
                <div className="trust-icon"><Icon name={item.icon} size="lg" /></div>
                <div>
                  <h5>{item.title}</h5>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
