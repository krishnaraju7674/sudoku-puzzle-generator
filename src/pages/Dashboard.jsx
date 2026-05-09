import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import { Panel, StatusBadge } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { readUserData } from '../services/localUserData'
import { supabase } from '../services/supabaseClient'

const cards = [
  {
    title: 'Profile',
    description: 'Add college, links, and target role details.',
    action: 'Open Profile',
    path: '/profile',
  },
  {
    title: 'Skills',
    description: 'Mark your level for each important skill.',
    action: 'Update Skills',
    path: '/skills',
  },
  {
    title: 'Readiness',
    description: 'See your placement score and weak areas.',
    action: 'View Score',
    path: '/readiness',
  },
  {
    title: 'Resume',
    description: 'Upload a PDF and get ATS-style feedback.',
    action: 'Analyze Resume',
    path: '/resume',
  },
  {
    title: 'Planner',
    description: 'Turn gaps into daily tasks and track progress.',
    action: 'Plan Week',
    path: '/planner',
  },
  {
    title: 'Applications',
    description: 'Track jobs, statuses, deadlines, and notes.',
    action: 'Track Jobs',
    path: '/applications',
  },
  {
    title: 'Mock Interview',
    description: 'Practice answers and save session scores.',
    action: 'Practice Now',
    path: '/interview',
  },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState({
    name: '',
    targetRole: 'Not selected',
    skillsCount: 0,
    resumeScore: null,
  })

  useEffect(() => {
    const fetchSummary = async () => {
      const [{ data: profile }, { data: skills }, { data: resume }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, roles(role_name)')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_skills')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('resumes')
          .select('ats_score')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setSummary({
        name: profile?.full_name || '',
        targetRole: profile?.roles?.role_name || 'Not selected',
        skillsCount: skills?.length || 0,
        resumeScore: resume?.ats_score ?? null,
      })
    }

    fetchSummary()
  }, [user.id])

  const localSummary = useMemo(() => {
    const tasks = readUserData(user.id, 'plannerTasks', [])
    const applications = readUserData(user.id, 'applications', [])
    const sessions = readUserData(user.id, 'interviewSessions', [])

    return {
      openTasks: tasks.filter(task => !task.completed).length,
      applications: applications.length,
      interviewScore: sessions[0]?.score ?? null,
    }
  }, [user.id])

  const stats = useMemo(() => [
    { label: 'Skills Saved', value: summary.skillsCount },
    { label: 'Resume Score', value: summary.resumeScore === null ? 'N/A' : `${summary.resumeScore}%` },
    { label: 'Open Tasks', value: localSummary.openTasks },
    { label: 'Applications', value: localSummary.applications },
  ], [localSummary, summary])

  return (
    <AppShell
      title={`Welcome${summary.name ? `, ${summary.name}` : ''}`}
      subtitle={`Target role: ${summary.targetRole}. Use this dashboard as your daily placement control center.`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map(stat => (
          <Panel key={stat.label} className="p-5">
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map(card => (
            <Panel key={card.title}>
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="mt-2 min-h-12 text-sm text-gray-400">{card.description}</p>
              <button
                onClick={() => navigate(card.path)}
                className="mt-5 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-gray-700"
              >
                {card.action}
              </button>
            </Panel>
          ))}
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="text-xl font-bold">Next Best Moves</h2>
            <div className="mt-4 space-y-3">
              {summary.skillsCount < 5 && (
                <div className="rounded-xl bg-gray-950 p-4">
                  <StatusBadge tone="yellow">Skills</StatusBadge>
                  <p className="mt-2 text-sm text-gray-300">Add at least 5 important skills so your readiness score becomes more useful.</p>
                </div>
              )}
              {summary.resumeScore === null && (
                <div className="rounded-xl bg-gray-950 p-4">
                  <StatusBadge tone="blue">Resume</StatusBadge>
                  <p className="mt-2 text-sm text-gray-300">Upload your resume once to unlock resume score tracking.</p>
                </div>
              )}
              {localSummary.applications === 0 && (
                <div className="rounded-xl bg-gray-950 p-4">
                  <StatusBadge tone="purple">Applications</StatusBadge>
                  <p className="mt-2 text-sm text-gray-300">Add your first internship or job application to start building momentum.</p>
                </div>
              )}
              {summary.skillsCount >= 5 && summary.resumeScore !== null && localSummary.applications > 0 && (
                <div className="rounded-xl bg-gray-950 p-4">
                  <StatusBadge tone="green">Good</StatusBadge>
                  <p className="mt-2 text-sm text-gray-300">Your base system is active. Keep planner tasks updated daily.</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <h2 className="text-xl font-bold">Interview Trend</h2>
            <p className="mt-4 text-5xl font-black text-blue-400">
              {localSummary.interviewScore === null ? 'N/A' : `${localSummary.interviewScore}%`}
            </p>
            <p className="mt-2 text-sm text-gray-400">Latest saved mock interview score</p>
          </Panel>
        </div>
      </div>
    </AppShell>
  )
}
