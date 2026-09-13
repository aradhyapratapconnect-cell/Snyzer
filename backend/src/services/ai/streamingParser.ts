/**
 * Incremental `revisedText` extractor for streamed JSON (SNZ-061).
 *
 * The revision contract is `{"revisedText": "...", "analysis": {...}}` with
 * the text field first. While the provider streams, the backend holds the
 * raw accumulated JSON and uses this module to expose the displayable text
 * prefix so far — the frontend renders real tokens progressively instead of
 * waiting for the full response.
 *
 * The extractor is deliberately tolerant but never invents content: unknown
 * escapes or a missing key yield whatever clean prefix exists (possibly the
 * empty string); the completed, validated revision from `validateAIRevision`
 * remains the source of truth on `done`.
 */
export function extractDisplayablePrefix(accumulatedJson: string): string {
  const keyIndex = accumulatedJson.indexOf('"revisedText"');
  if (keyIndex === -1) {
    return '';
  }
  const colonIndex = accumulatedJson.indexOf(':', keyIndex + '"revisedText"'.length);
  if (colonIndex === -1) {
    return '';
  }
  const quoteIndex = accumulatedJson.indexOf('"', colonIndex + 1);
  if (quoteIndex === -1) {
    return '';
  }
  let output = '';
  let i = quoteIndex + 1;
  while (i < accumulatedJson.length) {
    const char = accumulatedJson[i];
    if (char === '"') {
      break;
    }
    if (char !== '\\') {
      output += char;
      i += 1;
      continue;
    }
    // Escape sequence: only emit when the full sequence has arrived, so a
    // chunk boundary mid-escape never corrupts output.
    const next = accumulatedJson[i + 1];
    if (next === undefined) {
      break;
    }
    if (next === '"' || next === '\\' || next === '/') {
      output += next;
      i += 2;
    } else if (next === 'n') {
      output += '\n';
      i += 2;
    } else if (next === 'r') {
      output += '\r';
      i += 2;
    } else if (next === 't') {
      output += '\t';
      i += 2;
    } else if (next === 'b') {
      output += '\b';
      i += 2;
    } else if (next === 'f') {
      output += '\f';
      i += 2;
    } else if (next === 'u') {
      const hex = accumulatedJson.slice(i + 2, i + 6);
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        output += String.fromCharCode(Number.parseInt(hex, 16));
        i += 6;
      } else {
        break;
      }
    } else {
      // Unknown escape: stop rather than emit garbage.
      break;
    }
  }
  return output;
}
