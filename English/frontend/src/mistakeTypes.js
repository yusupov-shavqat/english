const TYPE_LABELS = {
  grammar: 'Grammatika',
  tense: 'Zamon',
  article: 'Artikl',
  preposition: 'Predlog',
  vocabulary: "So'z tanlash",
  'word-order': "So'z tartibi",
  spelling: 'Imlo',
  punctuation: 'Tinish belgisi',
}

export function typeLabel(type) {
  // Older answers could hold several types ("vocabulary|preposition"); show the first known one.
  const known = String(type ?? '')
    .split(/[\s|,/]+/)
    .find((t) => TYPE_LABELS[t])
  return TYPE_LABELS[known] ?? TYPE_LABELS.grammar
}
