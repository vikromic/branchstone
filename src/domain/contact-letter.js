// Pure composition of the addressed contact letter. The website never sends it:
// the page hands the `mailto` link or the plain text to the visitor's own mail app.

export function buildContactLetter(values, tickets, text, recipient) {
  const subject = `[Branchstone] ${values.subject.trim()}`;
  const workLines = tickets.length
    ? ["", `${text.selectedWorks}:`, ...tickets.map((artwork) => `— ${artwork.name}${artwork.collection ? ` / ${artwork.collection}` : ""}`)]
    : [];
  const body = [
    `${text.senderName}: ${values.name.trim()}`,
    `${text.senderEmail}: ${values.email.trim()}`,
    ...workLines,
    "",
    `${text.messageLabel}:`,
    values.message.trim(),
    "",
    text.preparedBy,
  ].join("\n");

  return {
    mailto: `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    plain: `To: ${recipient}\nSubject: ${subject}\n\n${body}`,
  };
}

export function removeGeneratedSentence(value, sentence) {
  if (!sentence) return value;
  const sentenceStart = value.indexOf(sentence);
  if (sentenceStart < 0) return value;

  const before = value.slice(0, sentenceStart);
  const after = value.slice(sentenceStart + sentence.length);
  if (!before.trim()) return after.replace(/^\s+/, "");
  if (!after.trim()) return before.replace(/\s+$/, "");

  const separatedByLineBreak = /\r?\n\s*$/.test(before) || /^\s*\r?\n/.test(after);
  return separatedByLineBreak
    ? `${before.replace(/\s+$/, "")}\n\n${after.replace(/^\s+/, "")}`
    : `${before.replace(/[\t ]+$/, "")} ${after.replace(/^[\t ]+/, "")}`;
}
