// Maps the CEFR level English estimated to the matching setup option.
export function recommendedLevel(profile) {
  const cefr = profile?.level?.toUpperCase() ?? ''
  if (cefr.startsWith('A')) return 'beginner'
  if (cefr.startsWith('B')) return 'intermediate'
  if (cefr.startsWith('C')) return 'advanced'
  return null
}
