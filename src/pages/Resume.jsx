import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import AppShell from '../components/AppShell'
import { Panel, primaryButtonClass } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { supabase } from '../services/supabaseClient'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

const KEYWORDS = [
  'javascript', 'react', 'node', 'express', 'sql', 'python',
  'java', 'html', 'css', 'git', 'api', 'database', 'mongodb',
  'typescript', 'redux', 'tailwind', 'rest', 'agile', 'dsa',
  'data structures', 'algorithms', 'problem solving', 'teamwork',
  'communication', 'leadership', 'project', 'internship', 'certificate',
]

export default function Resume() {
  const { user } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const fetchPreviousResume = async () => {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data) {
        setResult({
          atsScore: data.ats_score,
          feedback: data.ai_feedback,
        })
      }
    }

    fetchPreviousResume()
  }, [user.id])

  const extractTextFromPDF = async (selectedFile) => {
    const arrayBuffer = await selectedFile.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      text += `${content.items.map(item => item.str).join(' ')} `
    }

    return text.trim()
  }

  const analyzeResume = (text) => {
    const lowerText = text.toLowerCase()
    const foundKeywords = KEYWORDS.filter(keyword => lowerText.includes(keyword))
    const missingKeywords = KEYWORDS.filter(keyword => !lowerText.includes(keyword))

    const hasSections = {
      education: lowerText.includes('education') || lowerText.includes('college'),
      experience: lowerText.includes('experience') || lowerText.includes('internship'),
      projects: lowerText.includes('project'),
      skills: lowerText.includes('skill'),
      contact: lowerText.includes('email') || lowerText.includes('phone'),
      summary: lowerText.includes('summary') || lowerText.includes('objective'),
    }

    const sectionScore = Object.values(hasSections).filter(Boolean).length
    const keywordScore = Math.round((foundKeywords.length / KEYWORDS.length) * 100)
    const lengthScore = text.length > 500 ? 100 : Math.round((text.length / 500) * 100)
    const atsScore = Math.min(100, Math.round((keywordScore * 0.5) + (sectionScore * 5) + (lengthScore * 0.2)))
    const feedback = []

    if (!hasSections.summary) feedback.push('Add a professional Summary or Objective section at the top.')
    if (!hasSections.experience) feedback.push('Add an Internship or Work Experience section.')
    if (!hasSections.projects) feedback.push('Add a Projects section with 2 to 3 strong projects.')
    if (!hasSections.skills) feedback.push('Add a Skills section with your technical skills.')
    if (!hasSections.contact) feedback.push('Make sure your email and phone number are visible.')
    if (missingKeywords.length > 10) feedback.push(`Add more useful keywords like ${missingKeywords.slice(0, 5).join(', ')}.`)
    if (text.length < 300) feedback.push('Your resume seems short. Add more details about projects, skills, and achievements.')
    if (foundKeywords.length > 10) feedback.push('Good keyword coverage.')
    if (hasSections.projects) feedback.push('Projects section found.')
    if (hasSections.experience) feedback.push('Experience section found.')

    return { atsScore, feedback, foundKeywords, missingKeywords, hasSections }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.')
      return
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage('Only PDF files are allowed.')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName)

      setUploading(false)
      setAnalyzing(true)

      const text = await extractTextFromPDF(file)
      const analysis = analyzeResume(text)

      const { error: saveError } = await supabase.from('resumes').insert({
        user_id: user.id,
        file_url: urlData.publicUrl,
        extracted_text: text.slice(0, 5000),
        ats_score: analysis.atsScore,
        ai_feedback: analysis.feedback.join('\n'),
      })

      if (saveError) throw saveError

      setResult(analysis)
      setMessage('Resume analyzed successfully.')
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    }

    setUploading(false)
    setAnalyzing(false)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <AppShell title="Resume Analyzer" subtitle="Upload your resume PDF and get instant ATS-style feedback." maxWidth="max-w-4xl">
      <Panel className="mb-8">
        <label className="mb-3 block text-sm text-gray-400">Upload Resume (PDF only)</label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={event => setFile(event.target.files[0])}
          className="mb-4 w-full rounded-lg bg-gray-800 px-4 py-3 text-white outline-none"
        />
        {file && <p className="mb-4 text-sm text-green-400">{file.name} selected.</p>}
        {message && <p className="mb-4 text-sm text-blue-300">{message}</p>}
        <button onClick={handleUpload} disabled={uploading || analyzing} className={`${primaryButtonClass} w-full`}>
          {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </Panel>

      {result && (
        <>
          <Panel className="mb-6 text-center">
            <p className="mb-2 text-gray-400">ATS Score</p>
            <p className={`mb-2 text-7xl font-black sm:text-8xl ${getScoreColor(result.atsScore)}`}>{result.atsScore}%</p>
            <p className="text-sm text-gray-400">
              {result.atsScore >= 70
                ? 'Your resume is ATS friendly.'
                : result.atsScore >= 40
                  ? 'Your resume needs some improvements.'
                  : 'Your resume needs major improvements.'}
            </p>
          </Panel>

          <Panel>
            <h2 className="mb-4 text-xl font-bold">Feedback and Suggestions</h2>
            <ul className="space-y-3">
              {(Array.isArray(result.feedback) ? result.feedback : result.feedback?.split('\n') || []).map((item, index) => (
                <li key={index} className="text-sm text-gray-300">{item}</li>
              ))}
            </ul>
          </Panel>

          {result.foundKeywords && (
            <Panel className="mt-6">
              <h2 className="mb-4 text-xl font-bold">Keywords Found</h2>
              <div className="flex flex-wrap gap-2">
                {result.foundKeywords.map(keyword => (
                  <span key={keyword} className="rounded-full bg-green-950 px-3 py-1 text-xs text-green-300">{keyword}</span>
                ))}
              </div>
            </Panel>
          )}

          {result.missingKeywords && (
            <Panel className="mt-6">
              <h2 className="mb-4 text-xl font-bold">Missing Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map(keyword => (
                  <span key={keyword} className="rounded-full bg-red-950 px-3 py-1 text-xs text-red-300">{keyword}</span>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </AppShell>
  )
}
