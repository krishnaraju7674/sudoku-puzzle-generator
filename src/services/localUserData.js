export function createId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readUserData(userId, key, fallback) {
  try {
    const raw = localStorage.getItem(`ai-career-os:${userId}:${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeUserData(userId, key, value) {
  localStorage.setItem(`ai-career-os:${userId}:${key}`, JSON.stringify(value))
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}
