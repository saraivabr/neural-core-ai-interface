"use client"

import { useEffect, useRef, useMemo } from "react"
import { StreamMessage } from "./stream-message"
import { NeuralMonitor } from "./neural-monitor"
import { parseSpeakerBlocks } from "@/lib/conselho/parse-speakers"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

interface ConversationStreamProps {
  messages: Message[]
  isThinking?: boolean
}

interface DisplayItem {
  key: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  speaker?: {
    name: string
    emoji: string
    kind: "saraiva" | "conselheiro" | "narrador"
  }
}

function expandMessages(messages: Message[]): DisplayItem[] {
  const items: DisplayItem[] = []

  for (const message of messages) {
    if (message.role === "user") {
      items.push({
        key: message.id,
        role: "user",
        content: message.content,
        timestamp: message.timestamp,
      })
      continue
    }

    // Empty streaming placeholder — single skeleton bubble
    if (!message.content.trim()) {
      items.push({
        key: message.id,
        role: "assistant",
        content: "",
        timestamp: message.timestamp,
        speaker: { name: "Saraiva", emoji: "⚖️", kind: "saraiva" },
      })
      continue
    }

    const blocks = parseSpeakerBlocks(message.content)
    for (const block of blocks) {
      items.push({
        key: `${message.id}__${block.id}`,
        role: "assistant",
        content: block.text,
        timestamp: message.timestamp,
        speaker: {
          name: block.name,
          emoji: block.emoji,
          kind: block.kind,
        },
      })
    }
  }

  return items
}

export function ConversationStream({ messages, isThinking = false }: ConversationStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const displayItems = useMemo(() => expandMessages(messages), [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [displayItems, isThinking])

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 overflow-y-auto scrollbar-neural px-6 md:px-16 lg:px-24">
      <NeuralMonitor isThinking={isThinking} />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 stagger-children">
          <p className="font-serif text-2xl text-foreground/80 mb-2">Bem-vindo ao Conselho</p>
          <p className="text-sm text-muted-foreground max-w-md text-center leading-relaxed">
            Mesa-redonda de perspectivas. Traga o tema e escolha quem senta — ou deixe Saraiva
            montar a mesa.
          </p>
        </div>
      ) : (
        <div className="space-y-6 pb-8">
          {displayItems.map((item) => (
            <StreamMessage
              key={item.key}
              role={item.role}
              content={item.content}
              timestamp={item.timestamp}
              speaker={item.speaker}
            />
          ))}

          {isThinking && (
            <div className="animate-drift-up">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⚖️</span>
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  SARAIVA · MONTANDO A MESA
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground rounded-r-xl border border-border/40 border-l-[3px] border-l-amber-500/80 bg-amber-500/[0.04] px-4 py-3 max-w-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="font-mono text-[11px] ml-1 text-muted-foreground/80">
                  conselheiros falando…
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
