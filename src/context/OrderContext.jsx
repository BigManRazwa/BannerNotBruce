import { createContext, useContext, useState, useEffect } from 'react'

const OrderContext = createContext()

// Banner sizes (metric, IDR)
export const SIZES = [
  { w: 60, h: 120, name: '60 × 120 cm', desc: 'Compact / Promosi Kecil & Pameran Mini', price: 85000 },
  { w: 90, h: 180, name: '90 × 180 cm', desc: 'Standar / Cocok untuk Acara & Pameran Besar', price: 150000, tag: 'Terpopuler' },
  { w: 120, h: 240, name: '120 × 240 cm', desc: 'Besar / Outdoor, Toko, & Event Berskala Besar', price: 250000 },
  { w: 60, h: 300, name: '60 × 300 cm', desc: 'Spanduk Panjang / Jalan, Gerbang, & Festival', price: 195000 },
  { w: 150, h: 240, name: '150 × 240 cm', desc: 'Extra Besar / Backdrop Panggung & Dekorasi', price: 350000 },
  { w: 240, h: 120, name: '240 × 120 cm', desc: 'Trade Show / Dinding Booth & Background Foto', price: 320000 },
  { w: 75, h: 200, name: '75 × 200 cm', desc: 'Roll Up / Stand Banner Portable & Presentasi', price: 275000, tag: 'Roll Up' },
  { w: 0, h: 0, name: 'Ukuran Custom', desc: 'Bebas tentukan dimensi sesuai kebutuhan Anda.', price: 0, tag: 'Custom', isCustom: true },
]

export const MATERIALS = [
  { name: '13oz Scrim Matte Vinyl', extra: 0, desc: 'Vinyl matte standar, anti-pudar, tahan cuaca.', badge: 'Standar' },
  { name: '18oz Heavy Blockout Matte', extra: 35000, desc: 'Ekstra tebal, opaque sempurna, kualitas premium.' },
  { name: '9oz Mesh Tahan Angin', extra: 25000, desc: 'Berlubang mikro, tahan angin, cocok outdoor.' },
]

export const GROMMETS = [
  { name: 'Brass Grommet (Setiap 60 cm)', desc: 'Ring kuningan anti-karat di sekeliling tepi, jarak 60 cm.' },
  { name: 'Nickel Grommet (Hanya Sudut)', desc: '4 ring stainless steel di setiap sudut saja.' },
  { name: 'Pole Pocket (Atas & Bawah)', desc: 'Lipatan kantong 7 cm untuk tiang di sisi atas dan bawah.' },
  { name: 'Welded Hem (Tanpa Grommet)', desc: 'Tepi dilipat & dilas panas, tanpa ring sama sekali.' },
]

export function formatIDR(num) {
  return 'Rp ' + num.toLocaleString('id-ID')
}

export function getCustomPrice(w = 100, h = 200) {
  const safeW = Math.max(20, Number(w) || 100)
  const safeH = Math.max(20, Number(h) || 200)
  const areaSqM = (safeW * safeH) / 10000
  const raw = areaSqM * 90000
  return Math.max(50000, Math.round(raw / 5000) * 5000)
}

const DEFAULT_ORDER = {
  selectedSize: null,
  selectedMaterial: 0,
  selectedGrommet: 0,
  selectedTurnaround: 0,
  quantity: 1,
  uploadedFile: null,
  uploadedFileUrl: null,
  customWidth: 100,
  customHeight: 200,
  selectedShipping: 0,
  paymentMethod: 0,
  billingCheckbox: true,
  productionNotes: '',
}

// The order is kept in sessionStorage so choices survive the Google sign-in redirect.
// The uploaded design itself is left out — it can be many MB and would exceed the storage limit.
const STORAGE_KEY = 'cetakbanner:order'

function loadOrder() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    return saved ? { ...DEFAULT_ORDER, ...saved, uploadedFile: null, uploadedFileUrl: null } : DEFAULT_ORDER
  } catch {
    return DEFAULT_ORDER
  }
}

export function OrderProvider({ children }) {
  const [order, setOrder] = useState(loadOrder)

  useEffect(() => {
    const { uploadedFile, uploadedFileUrl, ...rest } = order // eslint-disable-line no-unused-vars
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest)) } catch { /* storage full / disabled */ }
  }, [order])

  const updateOrder = (updates) => {
    setOrder(prev => ({ ...prev, ...updates }))
  }

  // Start fresh after an order has been submitted
  const resetOrder = () => setOrder(DEFAULT_ORDER)

  const getPrice = () => {
    const sizeIdx = order.selectedSize !== null ? order.selectedSize : 1
    const size = SIZES[sizeIdx] || SIZES[1]
    const basePrice = size.isCustom
      ? getCustomPrice(order.customWidth, order.customHeight)
      : (size.price || 150000)
    const matExtra = MATERIALS[order.selectedMaterial]?.extra || 0
    const turnExtra = order.selectedTurnaround === 1 ? 50000 : order.selectedTurnaround === 2 ? 95000 : 0
    const unitPrice = basePrice + matExtra
    const subtotal = unitPrice * order.quantity
    const shipping = 0
    const tax = Math.round(subtotal * 0.11)
    const total = subtotal + turnExtra + tax
    return { basePrice, matExtra, turnExtra, unitPrice, subtotal, shipping, tax, total }
  }

  return (
    <OrderContext.Provider value={{ order, updateOrder, resetOrder, getPrice }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrder() {
  return useContext(OrderContext)
}
