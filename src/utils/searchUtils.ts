// src/utils/searchUtils.ts

export interface SearchableItem {
  id: number;
  type: 'todo' | 'event' | 'goal' | 'habit' | 'log' | 'project' | 'note';
  title: string;
  subtitle?: string;
  date?: string;
}

/** Normalize a string for search: lowercase, trim, collapse whitespace */
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Check if a query matches a text using simple substring + word-boundary matching */
export function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text || !query) return false;
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  // Exact substring match
  if (normalizedText.includes(normalizedQuery)) return true;

  // All query words must appear somewhere in the text
  const queryWords = normalizedQuery.split(' ');
  return queryWords.every(word => normalizedText.includes(word));
}

/** Score a search match — higher is better. Returns 0 for no match. */
export function scoreMatch(text: string | null | undefined, query: string): number {
  if (!text || !query) return 0;
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 1;

  // Exact match
  if (normalizedText === normalizedQuery) return 100;

  // Starts with query
  if (normalizedText.startsWith(normalizedQuery)) return 80;

  // Contains exact query substring
  if (normalizedText.includes(normalizedQuery)) return 60;

  // All words present
  const queryWords = normalizedQuery.split(' ');
  const allPresent = queryWords.every(w => normalizedText.includes(w));
  if (allPresent) return 40;

  // Partial word matches
  const matchCount = queryWords.filter(w => normalizedText.includes(w)).length;
  if (matchCount > 0) return (matchCount / queryWords.length) * 20;

  return 0;
}

/** Filter and rank a list of searchable items by query */
export function searchItems<T extends { title?: string; name?: string; what_i_did?: string; date?: string }>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!query.trim()) return items;

  return items
    .map(item => ({ item, score: scoreMatch(getSearchableText(item), query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

/** Highlight matching portions of text by wrapping them in markers. Returns segments with match info. */
export function highlightMatches(text: string, query: string): Array<{ text: string; match: boolean }> {
  if (!query.trim() || !text) return [{ text, match: false }];

  const normalizedQuery = normalize(query);
  const lowerText = text.toLowerCase();
  const idx = lowerText.indexOf(normalizedQuery);
  if (idx === -1) return [{ text, match: false }];

  const segments: Array<{ text: string; match: boolean }> = [];
  if (idx > 0) segments.push({ text: text.slice(0, idx), match: false });
  segments.push({ text: text.slice(idx, idx + normalizedQuery.length), match: true });
  if (idx + normalizedQuery.length < text.length) {
    segments.push({ text: text.slice(idx + normalizedQuery.length), match: false });
  }
  return segments;
}
