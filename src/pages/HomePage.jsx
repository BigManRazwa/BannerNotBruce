import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { useOrder, SIZES } from '../context/OrderContext'

function SizeCard({ size, index, isPopular }) {
  const navigate = useNavigate()
  const { updateOrder } = useOrder()

  const handleSelect = () => {
    updateOrder({ selectedSize: index })
    navigate('/order')
  }

  // Illustration dimensions proportional to actual
  const maxDim = 85
  const ratio = size.isCustom ? 1 : size.w / size.h
  let iw, ih
  if (ratio >= 1) { iw = maxDim; ih = maxDim / ratio }
  else { ih = maxDim; iw = maxDim * ratio }

  const tagColors = { 'Terpopuler': 'badge-blue', 'Roll Up': 'badge-purple', 'Custom': 'badge-yellow' }

  return (
    <div className={`size-card hover-lift ${isPopular ? 'popular' : ''}`} onClick={handleSelect}>
      {size.tag && (
        <span className={`badge ${tagColors[size.tag] || 'badge-blue'} popular-badge`}>{size.tag}</span>
      )}
      <div className="size-card-preview">
        <div
          className="size-illustration"
          style={{
            width: iw, height: ih,
            borderStyle: size.isCustom ? 'dashed' : 'dashed',
            position: 'relative',
          }}
        >
          {size.isCustom && (
            <span style={{ fontSize: 16, color: 'var(--text-muted)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>?</span>
          )}
        </div>
      </div>
      <h4>{size.name}</h4>
      <p className="size-desc">{size.desc}</p>
      <div className="size-price">
        {size.price > 0 ? (
          <>
            <span className="label">Mulai dari</span>
            <span className="currency">Rp</span>
            <span className="amount">{size.price.toLocaleString('id-ID')}</span>
          </>
        ) : (
          <span className="label">Harga menyesuaikan</span>
        )}
      </div>
      <button className={`btn ${isPopular ? 'btn-primary' : size.isCustom ? 'btn-outline' : 'btn-secondary'} btn-sm`}>
        {size.isCustom ? 'Masukkan Ukuran Custom' : 'Pilih Ukuran & Konfigurasi'}
        <Icon name="arrowRight" size="sm" />
      </button>
    </div>
  )
}

function MaterialSpecCard({ title, subtitle, desc, badge, specs }) {
  return (
    <div className="material-card hover-lift">
      <div className="material-card-img">
        <span className="placeholder-text">[Foto Material]</span>
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

  return (
    <div className="page active">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="hero-tag">
                <Icon name="zap" size="sm" />
                Cetak Cepat 24 Jam
              </span>
            </div>
            <h1>
              Banner Custom Vinyl & Kain Heavy-Duty{' '}
              <span className="highlight">Siap dalam 24 Jam</span>
            </h1>
            <p>
              Pilih ukuran, upload desain, dan kami cetakkan banner berkualitas tinggi untuk bisnis, acara, atau promosi Anda.
              Resolusi tinggi, tahan cuaca, dan garansi kepuasan.
            </p>

            {/* Hero Steps */}
            <div className="hero-steps">
              {[
                { icon: 'grid', title: 'Pilih Ukuran & Harga', sub: 'Tentukan dimensi banner', to: '/' },
                { icon: 'upload', title: 'Upload Desain', sub: 'Unggah file artwork Anda', to: '/order' },
                { icon: 'eye', title: 'Preview & Setujui', sub: 'Cek hasil sebelum cetak', to: '/preview' },
                { icon: 'creditCard', title: 'Checkout & Bayar', sub: 'Pembayaran aman', to: '/checkout' },
              ].map((step, i) => (
                <div key={i} className="hero-step" onClick={() => navigate(step.to)}>
                  <div className="step-icon"><Icon name={step.icon} /></div>
                  <div className="step-text">
                    <strong>{step.title}</strong>
                    {step.sub}
                  </div>
                </div>
              ))}
            </div>

            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('size-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <Icon name="chevronDown" />
                Lihat Ukuran Populer
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/order')}>
                <Icon name="edit" size="sm" />
                Ukuran Custom
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Size Selection */}
      <section className="section" id="size-section">
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Standardisasi & Dimensi Presisi</div>
            <h2 className="section-title">Pilih Ukuran Banner Anda</h2>
            <p className="section-desc">
              Semua banner menggunakan bahan vinyl berkualitas tinggi dengan hasil cetak resolusi tinggi dan finishing anti-pudar.
            </p>
            <div className="section-filters">
              {['Semua Populer', 'Ukuran Custom', 'Outdoor Besar', 'Spanduk & Horizontal'].map((tab, i) => (
                <button key={i} className={`filter-tab ${i === 0 ? 'active' : ''}`}>{tab}</button>
              ))}
            </div>
          </div>

          <div className="size-grid">
            {SIZES.map((size, i) => (
              <SizeCard key={i} size={size} index={i} isPopular={size.tag === 'Terpopuler'} />
            ))}
          </div>
        </div>
      </section>

      {/* Material Specs */}
      <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Material & Kualitas Cetak</div>
            <h2 className="section-title">Spesifikasi Material & Kualitas</h2>
            <p className="section-desc">
              Material pilihan terbaik untuk ketahanan tinggi, tahan cuaca, dan hasil cetak resolusi premium.
            </p>
          </div>
          <div className="material-grid">
            <MaterialSpecCard
              title="13oz Scrim Matte Vinyl"
              subtitle="Standar Industri / Paling Populer"
              desc="Bahan vinyl matte standar industri, tahan cuaca, anti-pudar, dan hasil cetak tajam. Cocok untuk outdoor & indoor."
              badge="Terpopuler"
              specs={['Ketahanan 3-5 tahun outdoor', 'Anti-pudar & tahan UV', 'Resolusi cetak hingga 1440 DPI']}
            />
            <MaterialSpecCard
              title="18oz Heavy Blockout Matte"
              subtitle="Heavy Duty / Kualitas Premium"
              desc="Material ekstra tebal dengan opaque sempurna. Tidak tembus cahaya, ideal untuk backdrop dan banner dua sisi."
              specs={['100% Opaque / Blockout penuh', 'Ketebalan premium 18oz', 'Finishing matte profesional']}
            />
            <MaterialSpecCard
              title="9oz Wind-Permeable Mesh"
              subtitle="Outdoor / Tahan Angin"
              desc="Material mesh berlubang mikro yang memungkinkan angin melewati banner. Ideal untuk gedung tinggi & area berangin."
              specs={['Permeabilitas angin 37%', 'Ideal untuk fasad gedung', 'Ringan & mudah dipasang']}
            />
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
