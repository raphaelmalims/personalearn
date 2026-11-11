const ASK = /\b(explain|show me|show us)\b/i;
const TOPIC = /\bwater\s*cycle\b/i;
const SWAHILI = /\b(kiswahili|swahili)\b/i;

export function isExplainerRequest(text: string) {
  return ASK.test(text) && TOPIC.test(text);
}

export function languageFromRequest(text: string) {
  return SWAHILI.test(text) ? "sw" : "en";
}
