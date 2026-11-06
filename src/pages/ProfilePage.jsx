import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from '../components/Icons'
import { useAuth } from '../context/AuthContext'
import { consumeReturnTo } from '../lib/returnTo'

const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan',
  'Kepulauan Bangka Belitung', 'Bengkulu', 'Lampung', 'DKI Jakarta', 'Banten', 'Jawa Barat',
  'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
  'Sulawesi Utara', 'Gorontalo', 'Sulawesi Tengah', 'Sulawesi Barat', 'Sulawesi Selatan',
  'Sulawesi Tenggara', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat', 'Papua Barat Daya',
  'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan',
]

function validate(values) {
  const errors = {}
  if (values.full_name.trim().length < 3) errors.full_name = 'Nama lengkap minimal 3 karakter.'
  const phone = values.phone.replace(/[\s-]/g, '')
  if (!/^(\+62|62|0)8\d{7,12}$/.test(phone)) errors.phone = 'Masukkan nomor WhatsApp yang valid, contoh 0812 3456 7890.'
  if (values.address.trim().length < 10) errors.address = 'Tulis alamat lengkap (jalan, nomor, RT/RW).'
  if (values.city.trim().length < 3) errors.city = 'Kota / kabupaten wajib diisi.'
  if (!values.province) errors.province = 'Pilih provinsi.'
  if (!/^\d{5}$/.test(values.postal_code.trim())) errors.postal_code = 'Kode pos harus 5 angka.'
  return errors
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isProfileComplete, updateProfile, signOut } = useAuth()
  const isOnboarding = !isProfileComplete

  const [values, setValues] = useState(profile)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  // If the account loads after first render (e.g. right after sign-in), pre-fill the form
  useEffect(() => { setValues(profile) }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key) => (e) => {
    const next = { ...values, [key]: e.target.value }
    setValues(next)
    setSaved(false)
    if (touched) setErrors(validate(next))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    setSaveError('')
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.querySelector('.form-input.has-error, .form-select.has-error')?.focus()
      return
    }

    // Work out where to go next before saving (saving flips the "complete" flag)
    const target = consumeReturnTo() || location.state?.from || '/'

    setSaving(true)
    const cleaned = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v).trim()]))
    const { error } = await updateProfile(cleaned)
    setSaving(false)

    if (error) {
      setSaveError(error.message || 'Gagal menyimpan profil. Silakan coba lagi.')
      return
    }

    if (isOnboarding || location.state?.from) {
      navigate(target === '/profil' ? '/' : target, { replace: true })
    } else {
      setSaved(true)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const fieldClass = (base, key) => `${base} ${errors[key] ? 'has-error' : ''}`

  return (
    <div className="page active">
      <div className="container">
        <div className="profile-layout">
          <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div className="breadcrumb">{isOnboarding ? 'LANGKAH TERAKHIR — PENDAFTARAN AKUN' : 'AKUN SAYA'}</div>
            <h2>{isOnboarding ? 'Lengkapi Data Kontak & Pengiriman' : 'Profil & Alamat Pengiriman'}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
              {isOnboarding
                ? 'Sebelum memesan, kami perlu data kontak dan alamat Anda untuk konfirmasi pesanan dan pengiriman banner.'
                : 'Data ini digunakan untuk setiap pesanan Anda. Perubahan berlaku untuk pesanan berikutnya.'}
            </p>
          </div>

          {isOnboarding && (
            <div className="profile-alert">
              <Icon name="shieldCheck" size="sm" />
              <span>Masuk sebagai <strong>{user?.email}</strong>. Kolom bertanda * wajib diisi.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="profile-form">
            {/* Contact */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">1</span>Informasi Kontak</div>
              </div>
              <div className="input-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-name">Nama Lengkap *</label>
                  <input id="pf-name" className={fieldClass('form-input', 'full_name')} type="text"
                    placeholder="Nama sesuai identitas" autoComplete="name"
                    value={values.full_name} onChange={setField('full_name')} />
                  {errors.full_name && <span className="field-error">{errors.full_name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-phone">Nomor WhatsApp *</label>
                  <input id="pf-phone" className={fieldClass('form-input', 'phone')} type="tel"
                    placeholder="0812 3456 7890" autoComplete="tel"
                    value={values.phone} onChange={setField('phone')} />
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
              </div>
              <div className="input-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-email">Email</label>
                  <input id="pf-email" className="form-input" type="email" value={user?.email || ''} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-company">Perusahaan / Organisasi</label>
                  <input id="pf-company" className="form-input" type="text"
                    placeholder="Opsional — PT / CV / Komunitas" autoComplete="organization"
                    value={values.company} onChange={setField('company')} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span className="step-num">2</span>Alamat Pengiriman</div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pf-address">Alamat Lengkap *</label>
                <textarea id="pf-address" className={fieldClass('form-textarea', 'address')}
                  style={{ minHeight: 84 }} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                  autoComplete="street-address"
                  value={values.address} onChange={setField('address')} />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>
              <div className="input-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-city">Kota / Kabupaten *</label>
                  <input id="pf-city" className={fieldClass('form-input', 'city')} type="text"
                    placeholder="Jakarta Selatan" autoComplete="address-level2"
                    value={values.city} onChange={setField('city')} />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-province">Provinsi *</label>
                  <select id="pf-province" className={fieldClass('form-select', 'province')}
                    value={values.province} onChange={setField('province')}>
                    <option value="">Pilih provinsi</option>
                    {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.province && <span className="field-error">{errors.province}</span>}
                </div>
              </div>
              <div className="input-row" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-postal">Kode Pos *</label>
                  <input id="pf-postal" className={fieldClass('form-input', 'postal_code')} type="text"
                    inputMode="numeric" maxLength={5} placeholder="12345" autoComplete="postal-code"
                    value={values.postal_code}
                    onChange={e => setField('postal_code')({ target: { value: e.target.value.replace(/\D/g, '') } })} />
                  {errors.postal_code && <span className="field-error">{errors.postal_code}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pf-notes">Patokan / Catatan Alamat</label>
                  <input id="pf-notes" className="form-input" type="text"
                    placeholder="Opsional — Gedung, lantai, patokan"
                    value={values.address_notes} onChange={setField('address_notes')} />
                </div>
              </div>
            </div>

            {saveError && (
              <div className="login-error" style={{ marginBottom: 0 }}>
                <Icon name="x" size="sm" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="profile-actions">
              {isOnboarding ? (
                <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
                  <Icon name="logOut" size="sm" /> Keluar
                </button>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                  <Icon name="arrowLeft" size="sm" /> Kembali
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {saved && <span style={{ fontSize: 13, color: 'var(--green)' }}>✓ Profil tersimpan</span>}
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? <span className="login-spinner" /> : (
                    <>
                      <Icon name="check" size="sm" />
                      {isOnboarding ? 'Simpan & Lanjutkan' : 'Simpan Perubahan'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

