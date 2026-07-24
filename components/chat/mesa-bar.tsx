"use client"

import { cn } from "@/lib/utils"
import { EnergyMode, MODE_META, Seat } from "@/lib/conselho/roster"
import { Mic2, PanelRight } from "lucide-react"

interface MesaBarProps {
  roster: Seat[]
  mode: EnergyMode
  activeSpeaker?: string | null
  focusSeatId?: string | null
  onModeChange: (mode: EnergyMode) => void
  onToggleSeat: (id: string) => void
  onFocusSeat: (id: string | null) => void
  onOpenCanvas: () => void
  isThinking?: boolean
}

export function MesaBar({
  roster,
  mode,
  activeSpeaker,
  focusSeatId,
  onModeChange,
  onToggleSeat,
  onFocusSeat,
  onOpenCanvas,
  isThinking,
}: MesaBarProps) {
  const seated = roster.filter((s) => s.seated)

  return (
    <div className="border-b border-border/60 bg-background/90 backdrop-blur-md z-10">
      {/* Energy modes */}
      <div className="px-4 md:px-16 lg:px-24 pt-3 pb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase mr-1">
          Energia
        </span>
        {(Object.keys(MODE_META) as EnergyMode[]).map((m) => {
          const meta = MODE_META[m]
          const active = mode === m
          return (
            <button
              key={m}
              type="button"
              title={meta.hint}
              onClick={() => onModeChange(m)}
              className={cn(
                "px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wide uppercase border transition-all",
                active
                  ? m === "rapido"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                    : m === "mesa"
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : m === "treplica"
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                        : "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {meta.label}
              <span className="hidden sm:inline opacity-70"> · {meta.short}</span>
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          type="button"
          onClick={onOpenCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/50 text-muted-foreground hover:text-foreground font-mono text-[10px] uppercase tracking-wider transition-colors"
        >
          <PanelRight className="w-3.5 h-3.5" />
          Tensão
        </button>
      </div>

      {/* Live table chips */}
      <div className="px-4 md:px-16 lg:px-24 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-neural">
        <span className="font-mono text-[9px] tracking-[0.15em] text-muted-foreground uppercase shrink-0">
          Mesa
        </span>

        {/* Saraiva always present */}
        <div
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border",
            "bg-amber-500/10 border-amber-500/40 text-amber-200"
          )}
        >
          <span className="text-sm">⚖️</span>
          <span className="font-mono text-[10px] uppercase tracking-wide">Saraiva</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>

        {roster.map((seat) => {
          const isActive =
            activeSpeaker &&
            seat.name.toLowerCase().includes(activeSpeaker.toLowerCase().split(" ")[0])
          const isFocus = focusSeatId === seat.id
          return (
            <button
              key={seat.id}
              type="button"
              title={`${seat.name} — ${seat.lens}. Clique: focar. Shift+clique: sentar/levantar.`}
              onClick={(e) => {
                if (e.shiftKey) {
                  onToggleSeat(seat.id)
                } else {
                  onFocusSeat(isFocus ? null : seat.id)
                }
              }}
              onDoubleClick={() => onToggleSeat(seat.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all",
                seat.seated
                  ? isActive || isThinking && isActive
                    ? "bg-primary/20 border-primary/60 text-foreground ring-1 ring-primary/40"
                    : isFocus
                      ? "bg-primary/15 border-primary/50 text-foreground"
                      : "bg-primary/[0.06] border-primary/30 text-foreground/90"
                  : "bg-muted/20 border-border/40 text-muted-foreground/50 opacity-60"
              )}
            >
              <span className="text-sm leading-none">{seat.emoji}</span>
              <span className="font-mono text-[10px] uppercase tracking-wide max-w-[7rem] truncate">
                {seat.name.split(" ").slice(-1)[0]}
              </span>
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  !seat.seated
                    ? "bg-muted-foreground/30"
                    : isActive
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-emerald-500/70"
                )}
              />
            </button>
          )
        })}

        <span className="hidden md:inline font-mono text-[9px] text-muted-foreground/50 ml-1 shrink-0">
          {seated.length} sentados · duplo-clique senta/levanta · clique foca
        </span>
      </div>

      {/* Mic of the turn */}
      {isThinking && (
        <div className="px-4 md:px-16 lg:px-24 pb-2.5 flex items-center gap-2 text-muted-foreground">
          <Mic2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-mono text-[10px] tracking-wide uppercase">
            {mode === "rapido" || mode === "veredito"
              ? "Microfone: Saraiva"
              : activeSpeaker
                ? `Microfone: ${activeSpeaker}`
                : `Microfone: mesa (${seated.map((s) => s.emoji).join(" ")})`}
          </span>
        </div>
      )}
    </div>
  )
}

