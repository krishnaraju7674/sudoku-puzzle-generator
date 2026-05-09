export function Panel({ children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-800 bg-gray-900 p-6 ${className}`}>
      {children}
    </section>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-400">{label}</span>
      {children}
    </label>
  )
}

export function StatusBadge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-800 text-gray-300',
    blue: 'bg-blue-950 text-blue-300',
    green: 'bg-green-950 text-green-300',
    yellow: 'bg-yellow-950 text-yellow-300',
    red: 'bg-red-950 text-red-300',
    purple: 'bg-purple-950 text-purple-300',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  )
}

export const inputClass = 'w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500'

export const primaryButtonClass = 'rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60'

export const secondaryButtonClass = 'rounded-lg bg-gray-800 px-4 py-3 font-semibold text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60'
