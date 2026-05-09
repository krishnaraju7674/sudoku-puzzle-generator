import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { Field, Panel, StatusBadge, inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { createId, readUserData, todayISO, writeUserData } from '../services/localUserData'

const statuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']

const emptyForm = {
  company: '',
  role: '',
  status: 'Saved',
  location: '',
  deadline: '',
  link: '',
  notes: '',
}

const statusTone = {
  Saved: 'gray',
  Applied: 'blue',
  Interview: 'purple',
  Offer: 'green',
  Rejected: 'red',
}

export default function Applications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState(() => readUserData(user.id, 'applications', []))
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const saveApplications = (nextApplications) => {
    setApplications(nextApplications)
    writeUserData(user.id, 'applications', nextApplications)
  }

  const stats = useMemo(() => {
    return statuses.map(status => ({
      status,
      count: applications.filter(application => application.status === status).length,
    }))
  }, [applications])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.company.trim() || !form.role.trim()) return

    if (editingId) {
      saveApplications(applications.map(application =>
        application.id === editingId
          ? { ...application, ...form, updatedAt: todayISO() }
          : application
      ))
      setEditingId(null)
    } else {
      saveApplications([
        {
          ...form,
          id: createId('application'),
          createdAt: todayISO(),
          updatedAt: todayISO(),
        },
        ...applications,
      ])
    }

    setForm(emptyForm)
  }

  const updateStatus = (id, status) => {
    saveApplications(applications.map(application =>
      application.id === id ? { ...application, status, updatedAt: todayISO() } : application
    ))
  }

  const editApplication = (application) => {
    setEditingId(application.id)
    setForm({
      company: application.company,
      role: application.role,
      status: application.status,
      location: application.location || '',
      deadline: application.deadline || '',
      link: application.link || '',
      notes: application.notes || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteApplication = (id) => {
    saveApplications(applications.filter(application => application.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyForm)
    }
  }

  return (
    <AppShell
      title="Applications"
      subtitle="Track every job or internship from saved opportunity to final result."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Panel>
            <h2 className="mb-4 text-xl font-bold">{editingId ? 'Edit Application' : 'Add Application'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Company">
                <input name="company" value={form.company} onChange={handleChange} className={inputClass} placeholder="Company name" />
              </Field>
              <Field label="Role">
                <input name="role" value={form.role} onChange={handleChange} className={inputClass} placeholder="Frontend Intern" />
              </Field>
              <Field label="Status">
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  {statuses.map(status => <option key={status}>{status}</option>)}
                </select>
              </Field>
              <Field label="Location">
                <input name="location" value={form.location} onChange={handleChange} className={inputClass} placeholder="Remote, Hyderabad, Bengaluru" />
              </Field>
              <Field label="Deadline">
                <input name="deadline" type="date" value={form.deadline} onChange={handleChange} className={inputClass} />
              </Field>
              <Field label="Job Link">
                <input name="link" value={form.link} onChange={handleChange} className={inputClass} placeholder="https://..." />
              </Field>
              <Field label="Notes">
                <textarea name="notes" value={form.notes} onChange={handleChange} className={`${inputClass} min-h-28`} placeholder="Referral, salary, preparation notes" />
              </Field>
              <div className="flex gap-3">
                <button className={`${primaryButtonClass} flex-1`} type="submit">
                  {editingId ? 'Save Changes' : 'Add Application'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className={secondaryButtonClass}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-xl font-bold">Pipeline</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(item => (
                <div key={item.status} className="rounded-xl bg-gray-800 p-4">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-sm text-gray-400">{item.status}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel className="min-h-[420px]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Tracked Roles</h2>
            <span className="text-sm text-gray-500">{applications.length} total</span>
          </div>

          {applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center">
              <p className="text-lg font-semibold">No applications yet</p>
              <p className="mt-2 text-sm text-gray-400">Add your first job or internship, then update the status as you move forward.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map(application => (
                <article key={application.id} className="rounded-xl border border-gray-800 bg-gray-950 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{application.role}</h3>
                      <p className="text-gray-400">{application.company}{application.location ? ` - ${application.location}` : ''}</p>
                    </div>
                    <StatusBadge tone={statusTone[application.status]}>{application.status}</StatusBadge>
                  </div>

                  {(application.deadline || application.notes || application.link) && (
                    <div className="mt-4 space-y-2 text-sm text-gray-300">
                      {application.deadline && <p>Deadline: {application.deadline}</p>}
                      {application.notes && <p>{application.notes}</p>}
                      {application.link && (
                        <a className="text-blue-400 hover:underline" href={application.link} target="_blank" rel="noreferrer">
                          Open job link
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(application.id, status)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          application.status === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    <button onClick={() => editApplication(application)} className="rounded-lg bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700">Edit</button>
                    <button onClick={() => deleteApplication(application.id)} className="rounded-lg bg-red-950 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  )
}
