/**
 * Parse a Conselho assistant reply into per-speaker blocks
 * so the UI can render each counselor as its own bubble.
 */

export type SpeakerKind = "saraiva" | "conselheiro" | "narrador"

export interface SpeakerBlock {
  id: string
  name: string
  emoji: string
  kind: SpeakerKind
  text: string
}

const KNOWN: Record<string, { emoji: string; kind: SpeakerKind }> = {
  saraiva: { emoji: "⚖️", kind: "saraiva" },
  "steve jobs": { emoji: "🧠", kind: "conselheiro" },
  jobs: { emoji: "🧠", kind: "conselheiro" },
  "elon musk": { emoji: "⚡", kind: "conselheiro" },
  musk: { emoji: "⚡", kind: "conselheiro" },
  "warren buffett": { emoji: "📊", kind: "conselheiro" },
  buffett: { emoji: "📊", kind: "conselheiro" },
  "sun tzu": { emoji: "📕", kind: "conselheiro" },
  "rick rubin": { emoji: "🎨", kind: "conselheiro" },
  rubin: { emoji: "🎨", kind: "conselheiro" },
  "sam altman": { emoji: "🧬", kind: "conselheiro" },
  altman: { emoji: "🧬", kind: "conselheiro" },
  "jeff bezos": { emoji: "📦", kind: "conselheiro" },
  bezos: { emoji: "📦", kind: "conselheiro" },
  "napoleão": { emoji: "🗡️", kind: "conselheiro" },
  "napoleon bonaparte": { emoji: "🗡️", kind: "conselheiro" },
  "júlio césar": { emoji: "🏛️", kind: "conselheiro" },
  "julio cesar": { emoji: "🏛️", kind: "conselheiro" },
  "david ogilvy": { emoji: "✍️", kind: "conselheiro" },
  ogilvy: { emoji: "✍️", kind: "conselheiro" },
  "gary halbert": { emoji: "🔥", kind: "conselheiro" },
  halbert: { emoji: "🔥", kind: "conselheiro" },
  "robert cialdini": { emoji: "🧲", kind: "conselheiro" },
  cialdini: { emoji: "🧲", kind: "conselheiro" },
  nietzsche: { emoji: "⚡", kind: "conselheiro" },
  "friedrich nietzsche": { emoji: "⚡", kind: "conselheiro" },
  maquiavel: { emoji: "♟️", kind: "conselheiro" },
  "marco aurélio": { emoji: "🗿", kind: "conselheiro" },
  "marco aurelio": { emoji: "🗿", kind: "conselheiro" },
  "carl jung": { emoji: "🌙", kind: "conselheiro" },
  jung: { emoji: "🌙", kind: "conselheiro" },
  "nikola tesla": { emoji: "💡", kind: "conselheiro" },
  tesla: { emoji: "💡", kind: "conselheiro" },
  "leonardo da vinci": { emoji: "🎭", kind: "conselheiro" },
  "ray dalio": { emoji: "📈", kind: "conselheiro" },
  dalio: { emoji: "📈", kind: "conselheiro" },
  "charlie munger": { emoji: "🧩", kind: "conselheiro" },
  munger: { emoji: "🧩", kind: "conselheiro" },
  "peter thiel": { emoji: "🎯", kind: "conselheiro" },
  thiel: { emoji: "🎯", kind: "conselheiro" },
  "naval ravikant": { emoji: "🌊", kind: "conselheiro" },
  naval: { emoji: "🌊", kind: "conselheiro" },
}

function resolveMeta(name: string, emojiFromMatch?: string) {
  const key = name.trim().toLowerCase()
  const known = KNOWN[key]
  if (known) {
    return {
      name: name.trim(),
      emoji: emojiFromMatch || known.emoji,
      kind: known.kind,
    }
  }
  const isSaraiva = key.includes("saraiva")
  return {
    name: name.trim(),
    emoji: emojiFromMatch || (isSaraiva ? "⚖️" : "👤"),
    kind: (isSaraiva ? "saraiva" : "conselheiro") as SpeakerKind,
  }
}

/** Explicit tags: <<<SPEAKER name="X" emoji="Y">>> ... <<<END>>> */
function parseTagged(content: string): SpeakerBlock[] | null {
  const re =
    /<<<SPEAKER\s+name="([^"]+)"(?:\s+emoji="([^"]*)")?\s*>>>\s*([\s\S]*?)\s*<<<END>>>/gi
  const blocks: SpeakerBlock[] = []
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(content)) !== null) {
    const meta = resolveMeta(m[1], m[2])
    const text = m[3].trim()
    if (!text) continue
    blocks.push({
      id: `sp-${i++}-${meta.name}`,
      name: meta.name,
      emoji: meta.emoji,
      kind: meta.kind,
      text,
    })
  }
  return blocks.length >= 1 ? blocks : null
}

/** Known display names for line matching (longest first) */
const NAME_PATTERNS = [
  "Steve Jobs",
  "Elon Musk",
  "Warren Buffett",
  "Sun Tzu",
  "Rick Rubin",
  "Sam Altman",
  "Jeff Bezos",
  "Napoleão Bonaparte",
  "Napoleon Bonaparte",
  "Júlio César",
  "Julio Cesar",
  "David Ogilvy",
  "Gary Halbert",
  "Robert Cialdini",
  "Friedrich Nietzsche",
  "Marco Aurélio",
  "Marco Aurelio",
  "Carl Jung",
  "Nikola Tesla",
  "Leonardo da Vinci",
  "Ray Dalio",
  "Charlie Munger",
  "Peter Thiel",
  "Naval Ravikant",
  "Nietzsche",
  "Maquiavel",
  "Saraiva",
  "Jobs",
  "Musk",
  "Buffett",
  "Thiel",
  "Naval",
  "Halbert",
  "Ogilvy",
  "Cialdini",
  "Jung",
  "Tesla",
  "Dalio",
  "Munger",
  "Altman",
  "Rubin",
  "Bezos",
].sort((a, b) => b.length - a.length)

function displayNameOf(name: string): string {
  const map: Record<string, string> = {
    jobs: "Steve Jobs",
    musk: "Elon Musk",
    buffett: "Warren Buffett",
    altman: "Sam Altman",
    rubin: "Rick Rubin",
    bezos: "Jeff Bezos",
    thiel: "Peter Thiel",
    naval: "Naval Ravikant",
    dalio: "Ray Dalio",
    munger: "Charlie Munger",
    jung: "Carl Jung",
    tesla: "Nikola Tesla",
    ogilvy: "David Ogilvy",
    halbert: "Gary Halbert",
    cialdini: "Robert Cialdini",
  }
  return map[name.toLowerCase()] || name
}

/**
 * Line-based speaker detection.
 * Supports: **🧬 Sam Altman:** ... | 🧬 Sam Altman: ... | **Sam Altman:** ...
 */
function parseMarkdownSpeakers(content: string): SpeakerBlock[] | null {
  const lines = content.split("\n")
  type Hit = { lineIndex: number; name: string; emoji: string; textStartLine: number; headerTextLen: number }
  const hits: Hit[] = []

  for (let li = 0; li < lines.length; li++) {
    const trimmed = lines[li].trim()
    if (!trimmed || trimmed === "---") continue

    // Match: optional **, optional emoji, name, optional **, colon, rest
    // Handles **🧬 Sam Altman:** "..." and 🧬 Sam Altman: ...
    const re =
      /^(?:\*\*\s*)?(\p{Extended_Pictographic}(?:\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F)?)*)?\s*([A-Za-zÀ-ú][A-Za-zÀ-ú0-9\s.'.-]{1,40}?)\s*[*]*\s*:\s*[*]*\s*(.*)$/u
    const m = trimmed.match(re)
    if (!m) continue

    const emoji = (m[1] || "").replace(/\uFE0F/g, "")
    let name = (m[2] || "").trim().replace(/\*+$/g, "").trim()
    let inlineRest = (m[3] || "").trim().replace(/^\*+\s*/, "").trim()

    // reject non-person headers
    if (/^(próximo passo|proximo passo|modo|mesa|round|debate|tréplica|treplica|veredito|pauta)/i.test(name)) {
      continue
    }

    const lower = name.toLowerCase()
    const isKnown =
      /saraiva/.test(lower) ||
      !!KNOWN[lower] ||
      NAME_PATTERNS.some((n) => n.toLowerCase() === lower)

    // Title Case full name also ok
    const titleCase = /^[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú.'.-]+)+$/.test(name)
    if (!isKnown && !titleCase) continue

    hits.push({
      lineIndex: li,
      name: displayNameOf(name),
      emoji,
      textStartLine: li,
      headerTextLen: inlineRest.length,
    })
    // stash inline text on the line itself via a side channel on the line content:
    // we'll re-read from lines when building blocks
    ;(hits[hits.length - 1] as Hit & { inline: string }).inline = inlineRest
  }

  if (hits.length < 2) return null

  const blocks: SpeakerBlock[] = []
  for (let i = 0; i < hits.length; i++) {
    const cur = hits[i] as Hit & { inline?: string }
    const next = hits[i + 1]
    const parts: string[] = []
    if (cur.inline) parts.push(cur.inline)
    const from = cur.lineIndex + 1
    const to = next ? next.lineIndex : lines.length
    for (let j = from; j < to; j++) {
      const L = lines[j]
      if (L.trim() === "---") continue
      parts.push(L)
    }
    let text = parts.join("\n").trim()
    text = text.replace(/^---+\s*/g, "").replace(/\s*---+$/g, "").trim()
    text = stripWrappingQuotes(text)
    if (!text) continue
    const meta = resolveMeta(cur.name, cur.emoji)
    blocks.push({
      id: `sp-${i}-${meta.name}`,
      name: displayNameOf(meta.name),
      emoji: meta.emoji,
      kind: meta.kind,
      text,
    })
  }

  return blocks.length >= 2 ? blocks : null
}

function stripWrappingQuotes(text: string): string {
  // remove leading/trailing " on whole block if present
  let t = text.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('"') && t.endsWith('"'))) {
    t = t.slice(1, -1).trim()
  }
  // strip per-line opening quotes common in model output
  return t
}

/**
 * If content has a preamble before first speaker, keep as narrador block.
 */
function withPreamble(content: string, blocks: SpeakerBlock[]): SpeakerBlock[] {
  if (!blocks.length) return blocks
  const first = blocks[0]
  // Prefer full line start of first speaker header
  const lines = content.split("\n")
  let cutLine = -1
  for (let i = 0; i < lines.length; i++) {
    if (new RegExp(escapeReg(first.name), "i").test(lines[i]) && /:/.test(lines[i])) {
      cutLine = i
      break
    }
  }
  if (cutLine <= 0) return blocks
  const pre = lines.slice(0, cutLine).join("\n").trim().replace(/^---+\s*|\s*---+$/g, "").trim()
  if (pre.length < 12) return blocks
  // don't duplicate if first block is already saraiva with same text
  if (first.kind === "saraiva" && first.text.includes(pre.slice(0, 40))) return blocks
  return [
    {
      id: "sp-preamble",
      name: "Saraiva",
      emoji: "⚖️",
      kind: "saraiva",
      text: pre,
    },
    ...blocks,
  ]
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** If last block ends with "Próximo passo...", split menu into Saraiva bubble */
function splitMenuFromLast(blocks: SpeakerBlock[]): SpeakerBlock[] {
  if (!blocks.length) return blocks
  const last = blocks[blocks.length - 1]
  const menuRe = /\n\s*(?:\*\*)?\s*Pr[oó]ximo passo[^\n]*\n[\s\S]*$/i
  const m = last.text.match(menuRe)
  if (!m || m.index === undefined) return blocks
  const body = last.text.slice(0, m.index).trim()
  const menu = last.text.slice(m.index).trim()
  if (!menu || body.length < 5) return blocks
  const next = [...blocks]
  next[next.length - 1] = { ...last, text: stripWrappingQuotes(body) }
  next.push({
    id: "sp-menu-saraiva",
    name: "Saraiva",
    emoji: "⚖️",
    kind: "saraiva",
    text: menu.replace(/^\*+\s*|\s*\*+$/g, "").trim(),
  })
  return next
}

/**
 * Main entry: returns multiple blocks if parse succeeds, else one narrador/assistant block.
 */
export function parseSpeakerBlocks(content: string): SpeakerBlock[] {
  const raw = (content || "").trim()
  if (!raw) {
    return [{ id: "empty", name: "Neural Core", emoji: "◇", kind: "narrador", text: "" }]
  }

  const tagged = parseTagged(raw)
  if (tagged) return splitMenuFromLast(withPreamble(raw, tagged))

  const md = parseMarkdownSpeakers(raw)
  if (md) return splitMenuFromLast(withPreamble(raw, md))

  // fallback: single bubble
  return [
    {
      id: "full",
      name: "Saraiva",
      emoji: "⚖️",
      kind: "saraiva",
      text: raw,
    },
  ]
}
