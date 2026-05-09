export const questionSets = {
  frontend: [
    'Explain how React state and props are different.',
    'How would you make a React page faster when it has a large list?',
    'What is the difference between controlled and uncontrolled form inputs?',
    'How do you make a website responsive for mobile screens?',
    'Tell me about a frontend project you built and one hard problem you solved.',
  ],
  backend: [
    'What happens from the moment a user sends an API request until they get a response?',
    'How would you design authentication for a web app?',
    'What is the difference between SQL and NoSQL databases?',
    'How do you handle errors in an API?',
    'Explain one backend project you built and the database design you used.',
  ],
  data: [
    'How would you clean a messy dataset before analysis?',
    'Explain the difference between WHERE and HAVING in SQL.',
    'How do you decide which chart to use for a dataset?',
    'What is one project where you found insight from data?',
    'How would you explain a technical data result to a non-technical person?',
  ],
  general: [
    'Tell me about yourself.',
    'Why should we hire you for this role?',
    'Describe a project you are proud of.',
    'Tell me about a time you solved a difficult problem.',
    'Where do you see yourself improving in the next 3 months?',
  ],
}

export const answerKeywords = [
  'project',
  'problem',
  'built',
  'learned',
  'improved',
  'user',
  'data',
  'tested',
  'result',
  'team',
  'database',
  'react',
  'api',
  'challenge',
  'solution',
]

export function getQuestionsForRole(roleName = '') {
  const normalizedRole = roleName.toLowerCase()

  if (normalizedRole.includes('frontend')) return [...questionSets.frontend, ...questionSets.general.slice(0, 2)]
  if (normalizedRole.includes('backend') || normalizedRole.includes('full stack')) return [...questionSets.backend, ...questionSets.general.slice(0, 2)]
  if (normalizedRole.includes('data')) return [...questionSets.data, ...questionSets.general.slice(0, 2)]

  return questionSets.general
}

export function scoreAnswer(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean)
  const lowerAnswer = answer.toLowerCase()
  const keywordMatches = answerKeywords.filter(keyword => lowerAnswer.includes(keyword)).length
  const lengthScore = Math.min(60, Math.round(words.length * 1.5))
  const keywordScore = Math.min(40, keywordMatches * 6)

  return Math.min(100, lengthScore + keywordScore)
}
