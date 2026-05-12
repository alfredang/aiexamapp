/**
 * Naive character-based chunker that tries to break on section/paragraph
 * boundaries. ~4 chars/token is a rough rule of thumb so charsPerChunk =
 * 4 * tokensPerChunk. Keeps each chunk well under the Claude context to
 * allow space for the system prompt + question schema.
 */
export function chunkBySection(text: string, tokensPerChunk = 6000): string[] {
  const max = tokensPerChunk * 4;
  const out: string[] = [];
  let buf = '';
  const paragraphs = text.split(/\n\s*\n/g);
  for (const p of paragraphs) {
    if (buf.length + p.length + 2 > max && buf.length > 0) {
      out.push(buf.trim());
      buf = '';
    }
    if (p.length > max) {
      // Single huge paragraph — split on sentences as a last resort.
      const sentences = p.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if (buf.length + s.length + 1 > max && buf.length > 0) {
          out.push(buf.trim());
          buf = '';
        }
        buf += (buf ? ' ' : '') + s;
      }
    } else {
      buf += (buf ? '\n\n' : '') + p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
