import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { Panel, primaryButtonClass, secondaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'

export default function Readiness() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [scores, setScores] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAndCalculate = async () => {
      setLoading(true)

      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('*, skills(skill_name, category)')
        .eq('user_id', user.id)

      const technicalSkills = (skillsData || []).filter(skill =>
        ['Frontend', 'Backend', 'Database', 'Language', 'Tools'].includes(skill.skills?.category)
      )

      const levelScore = { beginner: 33, intermediate: 66, advanced: 100 }

      const averageLevel = (items) => {
        if (items.length === 0) return 0
        const total = items.reduce((sum, item) => sum + (levelScore[item.level] || 0), 0)
        return Math.round(total / items.length)
      }

      const technicalScore = averageLevel(technicalSkills)
      const communicationScore = averageLevel((skillsData || []).filter(skill => skill.skills?.category === 'Soft Skills'))
      const aptitudeScore = averageLevel((skillsData || []).filter(skill => skill.skills?.category === 'Core'))

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const { data: resume } = await supabase
        .from('resumes')
        .select('ats_score')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const projectScore = profile?.github_url ? 60 : 20
      const resumeScore = resume?.ats_score ?? 30

      const overall = Math.round(
        0.35 * technicalScore +
        0.20 * projectScore +
        0.15 * resumeScore +
        0.15 * aptitudeScore +
        0.15 * communicationScore
      )

      setScores({
        overall,
        technical: technicalScore,
        projects: projectScore,
        resume: resumeScore,
        aptitude: aptitudeScore,
        communication: communicationScore,
      })

      setLoading(false)
    }

    fetchAndCalculate()
  }, [user.id])

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getBarColor = (score) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getLabel = (score) => {
    if (score >= 70) return 'Strong'
    if (score >= 40) return 'Improving'
    return 'Needs Work'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Calculating your score...</p>
      </div>
    )
  }

  const breakdown = [
    { label: 'Technical Skills', score: scores.technical, weight: '35%' },
    { label: 'Projects', score: scores.projects, weight: '20%' },
    { label: 'Resume', score: scores.resume, weight: '15%' },
    { label: 'Aptitude and DSA', score: scores.aptitude, weight: '15%' },
    { label: 'Communication', score: scores.communication, weight: '15%' },
  ]

  return (
    <AppShell
      title="Placement Readiness"
      subtitle="A practical score based on your skills, resume, project signal, aptitude, and communication."
      maxWidth="max-w-4xl"
    >
      <Panel className="mb-8 text-center">
        <p className="text-gray-400 mb-2">Overall Readiness Score</p>
        <p className={`text-7xl sm:text-8xl font-black mb-2 ${getScoreColor(scores.overall)}`}>
          {scores.overall}%
        </p>
        <p className="text-xl">{getLabel(scores.overall)}</p>
        <div className="mt-4 h-4 overflow-hidden rounded-full bg-gray-800">
          <div className={`h-4 rounded-full transition-all ${getBarColor(scores.overall)}`} style={{ width: `${scores.overall}%` }} />
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-6 text-xl font-bold">Score Breakdown</h2>
        {breakdown.map(item => (
          <div key={item.label} className="mb-5">
            <div className="mb-1 flex items-center justify-between gap-4">
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">weight: {item.weight}</span>
                <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}%</span>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-800">
              <div className={`h-3 rounded-full transition-all ${getBarColor(item.score)}`} style={{ width: `${item.score}%` }} />
            </div>
          </div>
        ))}
      </Panel>

      <Panel className="mt-8">
        <h2 className="mb-4 text-xl font-bold">What to improve next?</h2>
        <ul className="space-y-3">
          {scores.technical < 70 && <li className="text-sm text-yellow-400">Add more technical skills and level them up.</li>}
          {scores.projects < 70 && <li className="text-sm text-yellow-400">Add your GitHub URL in Profile to improve your project score.</li>}
          {scores.resume < 70 && <li className="text-sm text-yellow-400">Upload your resume to get feedback and improve your resume score.</li>}
          {scores.aptitude < 70 && <li className="text-sm text-yellow-400">Practice DSA and Aptitude, then mark them in the Skills page.</li>}
          {scores.communication < 70 && <li className="text-sm text-yellow-400">Work on Communication skills and mark your level in the Skills page.</li>}
          {scores.overall >= 70 && <li className="text-sm text-green-400">You are in good shape. Keep polishing your resume and practicing interviews.</li>}
        </ul>
      </Panel>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button onClick={() => navigate('/skills')} className={primaryButtonClass}>Update Skills</button>
        <button onClick={() => navigate('/planner')} className={secondaryButtonClass}>Open Planner</button>
      </div>
    </AppShell>
  )
}
