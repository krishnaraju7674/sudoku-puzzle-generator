import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { Field, Panel, inputClass, primaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'

export default function Profile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState({
    full_name: '',
    college_name: '',
    branch: '',
    current_year: '',
    graduation_year: '',
    city: '',
    github_url: '',
    linkedin_url: '',
    target_role_id: '',
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)

      const [{ data: rolesData }, { data: profileData }] = await Promise.all([
        supabase.from('roles').select('*'),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(),
      ])

      if (rolesData) setRoles(rolesData)
      if (profileData) setForm(profileData)
      setLoading(false)
    }

    fetchProfileData()
  }, [user.id])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, ...form })

    if (error) setMessage(error.message)
    else setMessage('Profile saved successfully.')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <AppShell
      title="My Profile"
      subtitle="Tell the app who you are and what role you are preparing for."
      maxWidth="max-w-3xl"
    >
      <Panel className="space-y-5">
        <Field label="Full Name">
          <input name="full_name" value={form.full_name || ''} onChange={handleChange} placeholder="Krishna Raju" className={inputClass} />
        </Field>

        <Field label="College Name">
          <input name="college_name" value={form.college_name || ''} onChange={handleChange} placeholder="Your college name" className={inputClass} />
        </Field>

        <Field label="Branch">
          <select name="branch" value={form.branch || ''} onChange={handleChange} className={inputClass}>
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current Year">
            <select name="current_year" value={form.current_year || ''} onChange={handleChange} className={inputClass}>
              <option value="">Select Year</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </Field>
          <Field label="Graduation Year">
            <select name="graduation_year" value={form.graduation_year || ''} onChange={handleChange} className={inputClass}>
              <option value="">Select Year</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
            </select>
          </Field>
        </div>

        <Field label="City">
          <input name="city" value={form.city || ''} onChange={handleChange} placeholder="Hyderabad" className={inputClass} />
        </Field>

        <Field label="Target Role">
          <select name="target_role_id" value={form.target_role_id || ''} onChange={handleChange} className={inputClass}>
            <option value="">Select Target Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.role_name}</option>
            ))}
          </select>
        </Field>

        <Field label="GitHub URL">
          <input name="github_url" value={form.github_url || ''} onChange={handleChange} placeholder="https://github.com/yourusername" className={inputClass} />
        </Field>

        <Field label="LinkedIn URL">
          <input name="linkedin_url" value={form.linkedin_url || ''} onChange={handleChange} placeholder="https://linkedin.com/in/yourusername" className={inputClass} />
        </Field>

        {message && <p className="text-center text-sm text-blue-300">{message}</p>}

        <button onClick={handleSave} disabled={saving} className={`${primaryButtonClass} w-full`}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </Panel>
    </AppShell>
  )
}
