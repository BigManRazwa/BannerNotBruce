import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icons'
import { useOrder, SIZES, MATERIALS, formatIDR } from '../context/OrderContext'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { order, updateOrder, getPrice } = useOrder()
  const price = getPrice()
  const size = order.selectedSize !== null ? SIZES[order.selectedSize] : SIZES[1]
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="page active">
      <div className="container">
        <div className="checkout-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="preflight-badge"><Icon name="check" size="sm" /> PREFLIGHT TERVERIFIKASI • JOB ID #BCP-0921-X</div>
              <h2>Finalisasi Pesanan Cetak</h2>
              <p className="checkout-desc">Periksa spesifikasi produk, alamat pengiriman, dan lakukan pembayaran.</p>
            </div>
            <div className="preflight-ready"><Icon name="checkCircle" size="sm" /> Pre-Flight File Siap</div>
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* 1. Contact */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">1</span>Proof Digital & Kontak</div>
                <span className="badge badge-green badge-sm"><Icon name="lock" size="sm" /> PDF Instan</span>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">Alamat Email *</label>
                  <input className="form-input" type="email" placeholder="nama@perusahaan.co.id" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telepon / WhatsApp (SMS) *</label>
                  <input className="form-input" type="tel" placeholder="+62 812 3456 7890" />
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
                Bukti cetak resolusi tinggi & PDF vektor akan dikirim ke email di atas sebelum produksi.
              </p>
            </div>

            {/* 2. Delivery */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">2</span>Alamat Pengiriman</div>
                <span className="badge badge-blue badge-sm"><Icon name="clock" size="sm" /> Estimasi Paket</span>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" type="text" placeholder="Nama penerima" />
                </div>
                <div className="form-group">
                  <label className="form-label">Perusahaan / Organisasi</label>
                  <input className="form-input" type="text" placeholder="PT / CV / Organisasi" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Alamat Lengkap *</label>
                <input className="form-input" type="text" placeholder="Jalan, nomor rumah, RT/RW" />
              </div>
              <div className="input-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Gedung / Lantai</label>
                  <input className="form-input" type="text" placeholder="Gedung A Lt. 3" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kota *</label>
                  <input className="form-input" type="text" placeholder="Jakarta Selatan" />
                </div>
              </div>
              <div className="input-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Provinsi *</label>
                  <select className="form-select">
                    <option value="">Pilih Provinsi</option>
                    {['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Bali', 'Sumatera Utara', 'Sulawesi Selatan', 'Kalimantan Timur'].map(p => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Kode Pos *</label>
                  <input className="form-input" type="text" placeholder="12345" />
                </div>
              </div>
            </div>

            {/* 3. Shipping */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">3</span>Kecepatan Pengiriman & Kurir</div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Est. Kirim: Besok 14:00</span>
              </div>
              <div className="shipping-options">
                {[
                  { name: 'Pengiriman Standar', badge: 'Rekomendasi', badgeColor: 'badge-green', desc: '3-5 hari kerja via JNE/J&T Regular. Packing kardus tebal.', est: 'Est. Tiba: Senin, 3 November', price: 'GRATIS', free: true },
                  { name: 'Express 2 Hari', desc: 'Dijamin tiba dalam 2 hari kerja. Kurir express tracking real-time.', est: 'Est. Tiba: Rabu, 29 Oktober', price: '+Rp 45.000' },
                  { name: 'Priority Same-Day', badge: 'Prioritas', badgeColor: 'badge-red', desc: 'Cetak langsung, kurir antar ke alamat. Area Jabodetabek.', est: 'Est. Tiba: Hari ini, sebelum 18:00', price: '+Rp 85.000' },
                ].map((opt, i) => (
                  <div
                    key={i}
                    className={`shipping-option ${order.selectedShipping === i ? 'selected' : ''}`}
                    onClick={() => updateOrder({ selectedShipping: i })}
                  >
                    <div className="shipping-radio" />
                    <div className="shipping-info">
                      <h5>
                        {opt.name}
                        {opt.badge && <span className={`badge ${opt.badgeColor} badge-sm`}>{opt.badge}</span>}
                      </h5>
                      <p>{opt.desc}</p>
                      <span className="est">{opt.est}</span>
                    </div>
                    <span className={`shipping-price ${opt.free ? 'free' : ''}`}>{opt.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Payment */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">4</span>Pembayaran</div>
                <span className="badge badge-green badge-sm"><Icon name="lock" size="sm" /> 256-BIT SSL</span>
              </div>
              <div className="payment-tabs">
                {['Kartu', 'Transfer Bank', 'E-Wallet', 'QRIS'].map((tab, i) => (
                  <button
                    key={i}
                    className={`payment-tab ${order.paymentMethod === i ? 'active' : ''}`}
                    onClick={() => updateOrder({ paymentMethod: i })}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="card-brands">
                <span className="form-label" style={{ margin: 0 }}>Kartu Diterima</span>
                {['VISA', 'MasterCard', 'JCB', 'BCA', 'Mandiri'].map(b => (
                  <span key={b} className="card-brand">{b}</span>
                ))}
              </div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Nomor Kartu *</label>
                <input className="form-input" type="text" placeholder="4211  ****  ****  8129" />
              </div>
              <div className="input-row" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Tanggal Kadaluarsa *</label>
                  <input className="form-input" type="text" placeholder="MM / YY" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kode Keamanan (CVV) *</label>
                  <input className="form-input" type="text" placeholder="***" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nama di Kartu *</label>
                <input className="form-input" type="text" placeholder="NAMA LENGKAP" />
              </div>
              <div className="checkbox-row" onClick={() => updateOrder({ billingCheckbox: !order.billingCheckbox })}>
                <div className={`checkbox-box ${order.billingCheckbox ? 'checked' : ''}`}>
                  {order.billingCheckbox && (
                    <svg viewBox="0 0 24 24" width="12" height="12"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                  )}
                </div>
                <span>Alamat penagihan sama dengan alamat pengiriman</span>
              </div>
            </div>
          </div>

          {/* CHECKOUT SIDEBAR */}
          <div className="checkout-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <h3><Icon name="fileText" size="sm" /> Ringkasan Proof</h3>
                <span className="badge badge-sm badge-blue">1 Item</span>
              </div>
              <div className="summary-body">
                <div className="checkout-summary-product">
                  <div className="thumb"><Icon name="grid" size="sm" /></div>
                  <div className="info">
                    <h4>Banner Vinyl Custom</h4>
                    <p>{size.isCustom ? 'Custom' : size.name}</p>
                    <p style={{ marginTop: 2 }}>{MATERIALS[order.selectedMaterial].name}</p>
                  </div>
                </div>

                <div className="summary-lines">
                  {[
                    { label: 'Substrat', value: '13oz Matte Heavyweight' },
                    { label: 'Finishing', value: 'Welded Hem + Grommet' },
                    { label: 'Pemasangan', value: 'Brass Grommet 60 cm' },
                    { label: 'Pre-Flight', value: 'Skor 98 / 300 DPI' },
                  ].map((line, i) => (
                    <div key={i} className="summary-line">
                      <span className="label">{line.label}</span>
                      <span className="value" style={{ fontSize: 12 }}>{line.value}</span>
                    </div>
                  ))}
                </div>

                <hr className="summary-divider" />

                <div className="print-notes" style={{ marginBottom: 14 }}>
                  <Icon name="fileText" size="sm" />
                  <span>Catatan cetak akan diverifikasi sebelum produksi dimulai.</span>
                </div>

                <div className="summary-lines">
                  <div className="summary-line"><span className="label">Subtotal ({order.quantity} Unit)</span><span className="value">{formatIDR(price.subtotal)}</span></div>
                  <div className="summary-line"><span className="label">Finishing & Produksi</span><span className="value free">Gratis</span></div>
                  <div className="summary-line"><span className="label">Pengiriman</span><span className={`value ${price.shipping === 0 ? 'free' : ''}`}>{price.shipping > 0 ? formatIDR(price.shipping) : 'Gratis'}</span></div>
                  <div className="summary-line"><span className="label">Pajak (PPN 11%)</span><span className="value">{formatIDR(price.tax)}</span></div>
                </div>

                <hr className="summary-divider" />
                <div className="summary-total" style={{ marginBottom: 4 }}>
                  <span className="label">Total Pembayaran</span>
                  <span className="amount">{formatIDR(price.total)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>Termasuk packing heavy-duty</div>
              </div>

              <div className="summary-actions">
                <button className="place-order-btn" onClick={() => setShowModal(true)}>
                  <Icon name="lock" /> Buat Pesanan & Bayar ({formatIDR(price.total)})
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4, marginTop: 4 }}>
                  Dengan memesan, Anda menyetujui preflight otomatis dan proses produksi sesuai spesifikasi.
                </p>
              </div>
            </div>

            {/* Guarantees */}
            <div className="guarantee-list" style={{ marginTop: 16 }}>
              {[
                { icon: 'checkCircle', title: '100% Garansi Warna CMYK', desc: 'Jika warna menyimpang dari profil ICC, kami cetak ulang gratis.' },
                { icon: 'clock', title: 'Komitmen Pengiriman Tepat Waktu', desc: 'Jadwal produksi dilacak hingga ke detik terakhir.' },
                { icon: 'lock', title: 'Pembayaran Terenkripsi', desc: 'Transaksi PCI-DSS Level 1. File artwork diarsip 7 hari.' },
              ].map((g, i) => (
                <div key={i} className="guarantee-item">
                  <Icon name={g.icon} size="sm" />
                  <div className="guar-text"><h5>{g.title}</h5><p>{g.desc}</p></div>
                </div>
              ))}
            </div>

            <div className="need-help" style={{ marginTop: 16 }}>
              <p><Icon name="phone" size="sm" /> Butuh bantuan?</p>
              <span className="help-phone">0812-BANNER-ID</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="success-icon"><Icon name="check" size="xxl" /></div>
            <h2>Pesanan Berhasil Dibuat!</h2>
            <p>Terima kasih! Pesanan Anda sedang diproses. Kami akan mengirim konfirmasi dan proof digital ke email Anda dalam beberapa menit.</p>
            <div className="order-id">#BCP-2026-1027-0921</div>
            <br />
            <button className="btn btn-primary btn-lg" onClick={() => { setShowModal(false); navigate('/') }}>
              <Icon name="arrowLeft" /> Kembali ke Beranda
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 16 }}>
              Anda dapat melacak status pesanan kapan saja dari halaman utama.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
