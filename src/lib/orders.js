import { supabase } from './supabase'
import { SIZES, MATERIALS, GROMMETS } from '../context/OrderContext'
import { TURNAROUNDS } from './orderStatus'

const DESIGN_BUCKET = 'designs'

// Turn raw Supabase errors into something the user (or developer) can act on
export function friendlyError(error) {
  if (!error) return ''
  const msg = error.message || String(error)
  if (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|Could not find the table/i.test(msg)) {
    return 'Database pesanan belum disiapkan. Jalankan file supabase/schema.sql di Supabase SQL Editor.'
  }
  if (/Bucket not found/i.test(msg)) {
    return 'Penyimpanan file desain belum disiapkan. Jalankan file supabase/schema.sql di Supabase SQL Editor.'
  }
  if (/exceeded the maximum allowed size|Payload too large/i.test(msg)) {
    return 'File desain terlalu besar (maksimal 50 MB).'
  }
  if (/Failed to fetch|NetworkError/i.test(msg)) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
  }
  return msg
}

function safeFileName(name = 'desain') {
  return name.normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(-80)
}

/**
 * Upload the design and create the order.
 * Prices are recalculated by the database, so the values sent here are informational only.
 */
export async function createOrder({ order, profile, user }) {
  const size = SIZES[order.selectedSize ?? 1] || SIZES[1]
  if (!order.uploadedFileUrl || !order.uploadedFile) throw new Error('Upload desain terlebih dahulu.')

  // 1. Upload the design file to the customer's private folder
  const blob = await (await fetch(order.uploadedFileUrl)).blob()
  const path = `${user.id}/${Date.now()}-${safeFileName(order.uploadedFile.name)}`
  const { error: uploadError } = await supabase.storage
    .from(DESIGN_BUCKET)
    .upload(path, blob, { contentType: order.uploadedFile.type || blob.type, upsert: false })
  if (uploadError) throw new Error(friendlyError(uploadError))

  // 2. Create the order row
  const row = {
    user_id: user.id,
    size_name: size.isCustom ? 'Ukuran Custom' : size.name,
    width_cm: size.isCustom ? Number(order.customWidth) || 100 : size.w,
    height_cm: size.isCustom ? Number(order.customHeight) || 200 : size.h,
    is_custom: !!size.isCustom,
    material: (MATERIALS[order.selectedMaterial] || MATERIALS[0]).name,
    grommet: (GROMMETS[order.selectedGrommet] || GROMMETS[0]).name,
    turnaround: (TURNAROUNDS[order.selectedTurnaround] || TURNAROUNDS[0]).key,
    quantity: Math.max(1, Number(order.quantity) || 1),
    production_notes: order.productionNotes?.trim() || null,
    design_path: path,
    design_name: order.uploadedFile.name,
    design_mime: order.uploadedFile.type || null,
    design_size: order.uploadedFile.size || null,
    contact: { ...profile, email: user.email },
  }

  const { data, error } = await supabase.from('orders').insert(row).select().single()
  if (error) {
    // Don't leave an orphaned file behind if the order couldn't be saved
    await supabase.storage.from(DESIGN_BUCKET).remove([path])
    throw new Error(friendlyError(error))
  }
  return data
}

export async function listMyOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_code, status, size_name, width_cm, height_cm, material, quantity, total, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(friendlyError(error))
  return data
}

export async function getOrderByCode(code) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_events(id, status, note, created_at)')
    .eq('order_code', code)
    .maybeSingle()
  if (error) throw new Error(friendlyError(error))
  if (data) data.order_events.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  return data
}

export async function getDesignUrl(path, expiresInSeconds = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(DESIGN_BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) return null
  return data.signedUrl
}

/** Calls `onChange` whenever the order or its status history changes. Returns an unsubscribe function. */
export function subscribeToOrder(orderId, onChange) {
  const channel = supabase
    .channel(`order-${orderId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events', filter: `order_id=eq.${orderId}` }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/** Calls `onChange` whenever any of the user's orders change. Returns an unsubscribe function. */
export function subscribeToMyOrders(userId, onChange) {
  const channel = supabase
    .channel(`orders-of-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/** Staff / Admin: list all orders across all customers */
export async function listAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_events(id, status, note, created_at)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(friendlyError(error))
  for (const row of data || []) {
    row.order_events?.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
  return data || []
}

/** Staff / Admin: move an order to a new production stage (and log an optional note) */
export async function updateOrderStatus(orderId, status, note = '') {
  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_note: note?.trim() || null,
  })
  if (error) throw new Error(friendlyError(error))
  return data
}

/** Admin only: delete an order and its design file */
export async function deleteOrder(orderId, designPath) {
  if (designPath) {
    await supabase.storage.from(DESIGN_BUCKET).remove([designPath])
  }
  const { error } = await supabase.from('orders').delete().eq('id', orderId)
  if (error) throw new Error(friendlyError(error))
}

/** Staff / Admin: subscribe to all order & status changes in real time */
export function subscribeToAllOrders(onChange) {
  const channel = supabase
    .channel('all-orders-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_events' }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

