import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import { Field, Panel, StatusBadge, inputClass, primaryButtonClass, secondaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'
import { createId, readUserData, todayISO, writeUserData } from '../services/localUserData'
import { getQuestionsForRole, scoreAnswer } from '../data/interviewQuestions'

export default function Interview() {
  const { user } = useAuth()
  const [targetRole, setTargetRole] = useState('General')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [sessions, setSessions] = useState(() => readUserData(user.id, 'interviewSessions', []))
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchRole = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles(role_name)')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.roles?.role_name) setTargetRole(profile.roles.role_name)
    }

    fetchRole()
  }, [user.id])

  const questions = useMemo(() => getQuestionsForRole(targetRole), [targetRole])
  const currentQuestion = questions[questionIndex]
  const currentAnswer = answers[questionIndex] || ''
  const currentScore = scoreAnswer(currentAnswer)

  const averageScore = useMemo(() => {
    const answeredScores = Object.values(answers).filter(Boolean).map(scoreAnswer)
    if (answeredScores.length === 0) return 0
    return Math.round(answeredScores.reduce((sum, score) => sum + score, 0) / answeredScores.length)
  }, [answers])

  const saveSessions = (nextSessions) => {
    setSessions(nextSessions)
    writeUserData(user.id, 'interviewSessions', nextSessions)
  }

  const handleAnswer = (event) => {
    setAnswers({ ...answers, [questionIndex]: event.target.value })
    setMessage('')
  }

  const finishSession = () => {
    const answeredCount = Object.values(answers).filter(Boolean).length
    if (answeredCount === 0) {
      setMessage('Answer at least one question before saving the session.')
      return
    }

    const session = {
      id: createId('interview'),
      role: targetRole,
      score: averageScore,
      answeredCount,
      totalQuestions: questions.length,
      createdAt: todayISO(),
    }

    saveSessions([session, ...sessions].slice(0, 10))
    setAnswers({})
    setQuestionIndex(0)
    setMessage('Interview session saved.')
  }

  const strengthLabel = (score) => {
    if (score >= 75) return 'Strong'
    if (score >= 45) return 'Good Start'
    return 'Needs Practice'
  }

  return (
    <AppShell
      title="Mock Interview"
      subtitle="Practice answers, get a simple score, and keep your recent sessions."
      maxWidth="max-w-5xl"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-500">Target role</p>
              <h2 className="text-2xl font-bold">{targetRole}</h2>
            </div>
            <Field label="Practice mode">
              <select value={targetRole} onChange={event => { setTargetRole(event.target.value); setQuestionIndex(0); setAnswers({}) }} className={inputClass}>
                <option>General</option>
                <option>Frontend Developer</option>
                <option>Backend Developer</option>
                <option>Full Stack Developer</option>
                <option>Data Analyst</option>
              </select>
            </Field>
          </div>

          <div className="rounded-2xl bg-gray-950 p-6">
            <div className="mb-4 flex items-center justify-between">
              <StatusBadge tone="blue">Question {questionIndex + 1} of {questions.length}</StatusBadge>
              <StatusBadge tone={currentScore >= 70 ? 'green' : currentScore >= 40 ? 'yellow' : 'red'}>
                {currentScore}% - {strengthLabel(currentScore)}
              </StatusBadge>
            </div>
            <h3 className="text-2xl font-bold leading-snug">{currentQuestion}</h3>
            <textarea
              value={currentAnswer}
              onChange={handleAnswer}
              className={`${inputClass} mt-6 min-h-56`}
              placeholder="Type your answer here. Try to include the situation, your action, the result, and what you learned."
            />
            <div className="mt-4 text-sm text-gray-400">
              Tip: strong answers usually mention the problem, your solution, the result, and what improved.
            </div>
          </div>

          {message && <p className="mt-4 text-sm text-blue-300">{message}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))}
              disabled={questionIndex === 0}
              className={secondaryButtonClass}
            >
              Previous
            </button>
            <button
              onClick={() => setQuestionIndex(Math.min(questions.length - 1, questionIndex + 1))}
              disabled={questionIndex === questions.length - 1}
              className={secondaryButtonClass}
            >
              Next
            </button>
            <button onClick={finishSession} className={primaryButtonClass}>
              Save Session
            </button>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="text-xl font-bold">Live Score</h2>
            <p className="mt-4 text-5xl font-black text-blue-400">{averageScore}%</p>
            <p className="mt-2 text-sm text-gray-400">Average across answered questions</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${averageScore}%` }} />
            </div>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-xl font-bold">Recent Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400">No saved sessions yet. Complete one round to see your history.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="rounded-xl bg-gray-950 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{session.role}</p>
                      <StatusBadge tone={session.score >= 70 ? 'green' : session.score >= 40 ? 'yellow' : 'red'}>{session.score}%</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{session.answeredCount}/{session.totalQuestions} answered on {session.createdAt}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  )
}
