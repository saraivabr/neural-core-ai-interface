export type EnergyMode = "rapido" | "mesa" | "treplica" | "veredito"

export interface Seat {
  id: string
  name: string
  emoji: string
  lens: string
  seated: boolean
}

export const DEFAULT_ROSTER: Seat[] = [
  { id: "jobs", name: "Steve Jobs", emoji: "🧠", lens: "Produto · simplicidade", seated: true },
  { id: "musk", name: "Elon Musk", emoji: "⚡", lens: "First principles · escala", seated: false },
  { id: "buffett", name: "Warren Buffett", emoji: "📊", lens: "Fundamentos · longo prazo", seated: true },
  { id: "suntzu", name: "Sun Tzu", emoji: "📕", lens: "Estratégia · posicionamento", seated: false },
  { id: "rubin", name: "Rick Rubin", emoji: "🎨", lens: "Essência · criatividade", seated: true },
  { id: "altman", name: "Sam Altman", emoji: "🧬", lens: "IA · futuro", seated: false },
]

export const MODE_META: Record<
  EnergyMode,
  { label: string; short: string; hint: string; color: string }
> = {
  rapido: {
    label: "Rápido",
    short: "Só Saraiva",
    hint: "Cumprimentos e dúvidas — 1 bolha",
    color: "amber",
  },
  mesa: {
    label: "Mesa",
    short: "Debate",
    hint: "3–5 conselheiros, turn-by-turn",
    color: "violet",
  },
  treplica: {
    label: "Tréplica",
    short: "Cruzamento",
    hint: "Eles se respondem e discordam",
    color: "rose",
  },
  veredito: {
    label: "Veredito",
    short: "Plano",
    hint: "Saraiva consolida e decide",
    color: "cyan",
  },
}

/** Greeting / small-talk → force Rápido */
export function looksLikeSmallTalk(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ")
  if (t.length > 100) return false
  // oi / td bem / blz / e aí — including typos like "oi td be m"
  return /^(oi+|ol[aá]|hey|hello|e a[ií]|eae|fala|salve|blz|beleza|suave)([\s,!.?]*(td|tudo)?\s*(be+m|blz|beleza)?[\s!?.]*)*$/i.test(
    t
  ) || /^(td|tudo)\s*(be+m|blz)/i.test(t)
}

export function seatedNames(roster: Seat[]): string[] {
  return roster.filter((s) => s.seated).map((s) => s.name)
}
