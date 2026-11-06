// Production stages — must match the `order_status` enum in supabase/schema.sql.
// Shared by the customer status page and the (upcoming) staff/admin panels.

export const ORDER_STAGES = [
  {
    key: 'received',
    title: 'Pesanan Diterima',
    desc: 'Detail ukuran, material, dan konfigurasi grommet telah masuk ke antrean produksi.',
  },
  {
    key: 'preflight',
    title: 'Inspeksi Preflight & Kalibrasi Warna',
    desc: 'Tim memeriksa resolusi, area aman, bleed 1.5 cm, dan profil warna file desain Anda.',
  },
  {
    key: 'printing',
    title: 'Sedang Dicetak',
    desc: 'Banner sedang dicetak resolusi tinggi pada material pilihan Anda.',
  },
  {
    key: 'finishing',
    title: 'Finishing & Pemasangan Grommet',
    desc: 'Pelipatan tepi (welded hem), pemasangan ring mata ayam, dan pemeriksaan kualitas akhir.',
  },
  {
    key: 'ready',
    title: 'Siap Diambil / Dikirim',
    desc: 'Pesanan selesai dikemas dan siap diambil atau diserahkan ke kurir.',
  },
]

export const STATUS_META = {
  received:  { label: 'Pesanan Diterima', short: 'Diterima',  badge: 'badge-blue',   tone: 'info' },
  preflight: { label: 'Preflight',        short: 'Preflight', badge: 'badge-blue',   tone: 'info' },
  printing:  { label: 'Sedang Dicetak',   short: 'Dicetak',   badge: 'badge-purple', tone: 'progress' },
  finishing: { label: 'Finishing',        short: 'Finishing', badge: 'badge-purple', tone: 'progress' },
  ready:     { label: 'Siap Diambil',     short: 'Siap',      badge: 'badge-green',  tone: 'success' },
  completed: { label: 'Selesai',          short: 'Selesai',   badge: 'badge-green',  tone: 'success' },
  cancelled: { label: 'Dibatalkan',       short: 'Batal',     badge: 'badge-red',    tone: 'danger' },
}

// Every status in the order staff normally move through (useful for the staff panel)
export const ALL_STATUSES = [...ORDER_STAGES.map(s => s.key), 'completed', 'cancelled']

export const TURNAROUNDS = [
  { key: 'standard', label: 'Standar 2–3 Hari Kerja', fee: 0 },
  { key: 'express', label: 'Express 1 Hari Kerja', fee: 50000 },
  { key: 'same_day', label: 'Same-Day Priority', fee: 95000 },
]

export function turnaroundLabel(key) {
  return TURNAROUNDS.find(t => t.key === key)?.label || key
}

// Index of the current stage in ORDER_STAGES (completed counts as past the last stage)
export function stageIndex(status) {
  if (status === 'completed') return ORDER_STAGES.length
  return ORDER_STAGES.findIndex(s => s.key === status)
}

export function progressPercent(status) {
  if (status === 'cancelled') return 0
  if (status === 'completed') return 100
  const i = stageIndex(status)
  return i < 0 ? 0 : Math.round(((i + 1) / ORDER_STAGES.length) * 100)
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

