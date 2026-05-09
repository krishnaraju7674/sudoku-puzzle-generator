import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import { Panel, primaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'

export default function Skills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [userSkills, setUserSkills] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchSkillsData = async () => {
      const [{ data: skillsData }, { data: userSkillsData }] = await Promise.all([
        supabase.from('skills').select('*').order('category'),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
      ])

      if (skillsData) {
        setSkills(skillsData)
        setCategories([...new Set(skillsData.map(skill => skill.category))])
      }

      if (userSkillsData) {
        const map = {}
        userSkillsData.forEach(skill => {
          map[skill.skill_id] = skill.level
        })
        setUserSkills(map)
      }
    }

    fetchSkillsData()
  }, [user.id])

  const handleSkillChange = (skillId, level) => {
    setUserSkills(prev => ({ ...prev, [skillId]: level }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    const entries = Object.entries(userSkills).map(([skill_id, level]) => ({
      user_id: user.id,
      skill_id,
      level,
    }))

    if (entries.length === 0) {
      setMessage('Choose at least one skill before saving.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('user_skills')
      .upsert(entries, { onConflict: 'user_id,skill_id' })

    if (error) setMessage(error.message)
    else setMessage('Skills saved successfully.')
    setSaving(false)
  }

  const levelColor = (level) => {
    if (level === 'advanced') return 'bg-green-500'
    if (level === 'intermediate') return 'bg-yellow-500'
    if (level === 'beginner') return 'bg-red-500'
    return 'bg-gray-700'
  }

  return (
    <AppShell title="My Skills" subtitle="Select your current level for each important technology." maxWidth="max-w-4xl">
      <div className="space-y-8">
        {categories.map(category => (
          <Panel key={category}>
            <h2 className="mb-5 text-xl font-bold text-blue-400">{category}</h2>
            <div className="space-y-4">
              {skills.filter(skill => skill.category === category).map(skill => (
                <div key={skill.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-white sm:w-36">{skill.skill_name}</span>
                  <div className="flex flex-wrap gap-2">
                    {['beginner', 'intermediate', 'advanced'].map(level => (
                      <button
                        key={level}
                        onClick={() => handleSkillChange(skill.id, level)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                          userSkills[skill.id] === level
                            ? `${levelColor(level)} text-white`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                    {userSkills[skill.id] && (
                      <button
                        onClick={() => {
                          const updated = { ...userSkills }
                          delete updated[skill.id]
                          setUserSkills(updated)
                        }}
                        className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-500 hover:bg-gray-700"
                      >
                        clear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}

        {message && <p className="text-center text-sm text-blue-300">{message}</p>}

        <button onClick={handleSave} disabled={saving} className={`${primaryButtonClass} w-full`}>
          {saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>
    </AppShell>
  )
}
