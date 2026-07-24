"use client"

import { cn } from "@/lib/utils"
import { Pin, X, Sparkles, Swords, Handshake } from "lucide-react"

export interface PinItem {
  id: string
  speaker: string
  emoji: string
  text: string
}

interface TensionCanvasProps {
  open: boolean
  onClose: () => void
  pins: PinItem[]
  onRemovePin: (id: string) => void
  onGenerateVerdict: () => void
  agreements?: string[]
  conflicts?: string[]
}

export function TensionCanvas({
  open,
  onClose,
  pins,
  onRemovePin,
  onGenerateVerdict,
  agreements = [],
  conflicts = [],
}: TensionCanvasProps) {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md z-50",
          "bg-background border-l border-border shadow-2xl",
          "flex flex-col animate-drift-up"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              Canvas de tensão
            </p>
            <h2 className="font-serif text-lg text-foreground">O que a mesa está fazendo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-neural">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-emerald-400/90">
                Acordo
              </h3>
            </div>
            {agreements.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                Ainda sem síntese automática — pine frases e peça o veredito.
              </p>
            ) : (
              <ul className="space-y-2">
                {agreements.map((a, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 border-l-2 border-emerald-500/50 pl-3"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-rose-400/90">
                Conflito
              </h3>
            </div>
            {conflicts.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                Conflitos úteis aparecem quando a mesa discorda de verdade.
              </p>
            ) : (
              <ul className="space-y-2">
                {conflicts.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm text-foreground/90 border-l-2 border-rose-500/50 pl-3"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-amber-400/90">
                Pins ({pins.length})
              </h3>
            </div>
            {pins.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">
                Use <strong className="text-foreground/80">Citar no veredito</strong> nos cards
                para guardar insights.
              </p>
            ) : (
              <ul className="space-y-3">
                {pins.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-border/60 bg-muted/20 p-3 relative group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{p.emoji}</span>
                      <span className="font-mono text-[10px] uppercase text-muted-foreground">
                        {p.speaker}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed pr-6">
                      {p.text.slice(0, 280)}
                      {p.text.length > 280 ? "…" : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => onRemovePin(p.id)}
                      className="absolute top-2 right-2 p-1 text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100"
                      aria-label="Remover pin"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            onClick={onGenerateVerdict}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-lg",
              "bg-cyan-500/15 border border-cyan-500/40 text-cyan-200",
              "font-mono text-[11px] uppercase tracking-wider",
              "hover:bg-cyan-500/25 transition-colors"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Gerar Veredito Saraiva
            {pins.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-[9px]">
                {pins.length} pins
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
