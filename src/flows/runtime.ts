export function keywordMatch(text: string, keyword: string) {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function dedupInMemory(set: Set<string>, eventKey: string) {
  if (set.has(eventKey)) return false;
  set.add(eventKey);
  return true;
}

export function scheduleAt(seconds: number, now = new Date()) {
  return new Date(now.getTime() + seconds * 1000);
}

export function conditionContactHasTag(tags: string[], tag: string) {
  return tags.includes(tag);
}
