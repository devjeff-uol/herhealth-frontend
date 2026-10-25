const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
export async function apiRequest(path, { body, signal } = {}) {
 const controller = new AbortController()
 const timeout = setTimeout(() => controller.abort(), 60000)
 const abort = () => controller.abort()
 signal?.addEventListener('abort', abort, { once: true })
 try {
  const response = await fetch(`${base}/api/${path}`, {
   method: body ? 'POST' : 'GET',
   headers: body ? { 'Content-Type': 'application/json' } : {},
   body: body ? JSON.stringify(body) : undefined, signal: controller.signal, cache: 'no-store'
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
   if (response.status === 422 && Array.isArray(data?.detail)) {
    throw new Error(data.detail.map(e => e.message || e.msg || 'Please check your answers.').join(' '))
   }
   throw new Error('The report service is unavailable. Please try again. Your answers have been kept.')
  }
  if (!data) throw new Error('The report service returned an invalid response. Please try again.')
  return data
 } catch (error) {
  if (error.name === 'AbortError') throw new Error('The request was cancelled or took too long. Please try again.')
  if (error instanceof TypeError) throw new Error('Cannot reach the report service. Please try again. Your answers have been kept.')
  throw error
 } finally {
  clearTimeout(timeout)
  signal?.removeEventListener('abort', abort)
 }
}
