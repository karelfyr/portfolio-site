/**
 * Typographic rule for the whole site: a short function word (a, the, for, of, I, …) never ends
 * a line on its own. The space after it becomes a no-break space, so it always travels with the
 * word that follows ("a kid", "for a", "of the" stay together).
 *
 * Only words that read as orphans are bound – articles, prepositions, conjunctions and short
 * pronouns / auxiliaries – not every short word ("kid", "app", "now" break normally). A word
 * followed by punctuation ("a," / "it.") is the end of a phrase and isn't bound.
 */

const BIND = new Set(
  [
    // articles
    'a', 'an', 'the',
    // prepositions
    'at', 'by', 'for', 'in', 'of', 'off', 'on', 'per', 'to', 'up', 'via', 'as',
    // conjunctions
    'and', 'but', 'if', 'nor', 'or', 'so', 'yet',
    // pronouns / determiners
    'i', 'me', 'my', 'we', 'us', 'our', 'it', 'its', 'he', 'she', 'his', 'her', 'you',
    // short auxiliaries
    'is', 'am', 'are', 'was', 'be', 'do', 'can', 'not', 'no',
  ],
)

const NBSP = ' '

/** Applies the rule to one string. Leaves line breaks ("\n") and everything else untouched. */
export function bindShortWords(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const words = line.split(' ')
      let out = ''
      for (let i = 0; i < words.length; i++) {
        out += words[i]
        if (i === words.length - 1) break
        // Strip leading quotes / brackets ("(and", "“a") but not trailing punctuation.
        const bare = words[i].replace(/^[("“‘'[]+/, '').toLowerCase()
        out += BIND.has(bare) ? NBSP : ' '
      }
      return out
    })
    .join('\n')
}
