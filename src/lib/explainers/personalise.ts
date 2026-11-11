export function buildEmphasis(input: {
  weakTopics: string[];
  message: string;
}) {
  const topics = [...new Set(input.weakTopics.map((topic) => topic.trim()).filter(Boolean))].slice(
    0,
    3
  );
  const note = localNote(input.message);
  const parts: string[] = [];
  if (topics.length > 0) {
    parts.push(`Emphasise ${topics.join(", ")}.`);
  }
  if (note) {
    parts.push(`Use this local example: ${note}.`);
  }
  return parts.join(" ");
}

function localNote(message: string) {
  const cleaned = message
    .replace(
      /\b(please|can you|could you|explain|show me|show us|the water cycle|water cycle|in english|in kiswahili|in swahili)\b/gi,
      " "
    )
    .replace(/[^a-z0-9' ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 8) return "";
  return cleaned.slice(0, 160);
}
