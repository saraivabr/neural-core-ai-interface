"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import { ConversationStream, Message } from "./conversation-stream"
import { CommandDock } from "./command-dock"
import { LatentSidebar, Conversation } from "./latent-sidebar"
import { MesaBar } from "./mesa-bar"
import { TensionCanvas, PinItem } from "./tension-canvas"
import { Layers, Moon, Sun, Users } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import {
  DEFAULT_ROSTER,
  EnergyMode,
  looksLikeSmallTalk,
  seatedNames,
  Seat,
} from "@/lib/conselho/roster"
import { parseSpeakerBlocks } from "@/lib/conselho/parse-speakers"

const INITIAL_COUNCIL_MESSAGE: Message = {
  id: "init-saraiva",
  role: "assistant",
  content: `<<<SPEAKER name="Saraiva" emoji="⚖️">>>
Você entrou na sala do Conselho.

**Energia** em cima: Rápido (só eu) · Mesa · Tréplica · Veredito.
**Mesa**: clique foca um conselheiro; duplo-clique senta ou levanta.

Traga um **tema real** — ou diga "oi" no modo Rápido. Sem tema, não há guerra, só barulho.
<<<END>>>`,
  timestamp: "Agora",
}

export function NeuralCore() {
  const { theme, toggleTheme } = useTheme()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([INITIAL_COUNCIL_MESSAGE])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [mode, setMode] = useState<EnergyMode>("rapido")
  const [roster, setRoster] = useState<Seat[]>(DEFAULT_ROSTER)
  const [focusSeatId, setFocusSeatId] = useState<string | null>(null)
  const [pins, setPins] = useState<PinItem[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const focusSpeakerName = useMemo(() => {
    if (!focusSeatId) return null
    return roster.find((s) => s.id === focusSeatId)?.name ?? null
  }, [focusSeatId, roster])

  const activeSpeaker = useMemo(() => {
    if (!isThinking) return null
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.content)
    if (!last?.content) return mode === "rapido" || mode === "veredito" ? "Saraiva" : null
    const blocks = parseSpeakerBlocks(last.content)
    return blocks[blocks.length - 1]?.name ?? "Saraiva"
  }, [isThinking, messages, mode])

  const generateTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(conversation.messages)
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversation(null)
    setMessages([INITIAL_COUNCIL_MESSAGE])
    setPins([])
    setMode("rapido")
    setFocusSeatId(null)
    setSidebarOpen(false)
  }, [])

  const toggleSeat = useCallback((id: string) => {
    setRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, seated: !s.seated } : s))
    )
  }, [])

  const sendMessageContent = async (textToSend: string, modeOverride?: EnergyMode) => {
    if (!textToSend.trim() || isThinking) return

    let effectiveMode = modeOverride ?? mode
    // Auto-downgrade greetings to Rápido
    if (looksLikeSmallTalk(textToSend) && effectiveMode === "mesa") {
      effectiveMode = "rapido"
      setMode("rapido")
    }
    if (modeOverride) setMode(modeOverride)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: generateTimestamp(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setIsThinking(true)

    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: generateTimestamp(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    const mesa = seatedNames(roster)

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          mode: effectiveMode,
          mesa,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Falha ao comunicar com O Conselho.")
      }

      if (!response.body) return

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: accumulatedText } : msg
          )
        )
      }

      const finalMessages = [
        ...updatedMessages,
        { ...assistantMessage, content: accumulatedText },
      ]

      if (activeConversation) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === activeConversation.id
              ? { ...conv, messages: finalMessages, preview: userMessage.content }
              : conv
          )
        )
      } else {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title:
            userMessage.content.slice(0, 40) +
            (userMessage.content.length > 40 ? "..." : ""),
          preview: accumulatedText.slice(0, 80) + "...",
          date: "Hoje",
          messages: finalMessages,
        }
        setConversations((prev) => [newConv, ...prev])
        setActiveConversation(newConv)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "<<<SPEAKER name=\"Saraiva\" emoji=\"⚖️\">>>\n⚠️ Erro ao conectar com O Conselho: " +
                    (err.message || "Erro desconhecido") +
                    "\n<<<END>>>",
                }
              : msg
          )
        )
      }
    } finally {
      setIsThinking(false)
    }
  }

  const handleSubmit = useCallback(() => {
    sendMessageContent(inputValue)
  }, [inputValue, isThinking, messages, mode, roster])

  const handlePin = (speaker: string, emoji: string, text: string) => {
    setPins((prev) => [
      {
        id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        speaker,
        emoji,
        text,
      },
      ...prev,
    ])
    setCanvasOpen(true)
  }

  const handleDeepen = (speaker: string) => {
    sendMessageContent(
      `Aprofunda só a perspectiva de ${speaker}. Um SPEAKER só dele/dela, com mais concreto e menos abstração.`,
      mode === "rapido" ? "mesa" : mode
    )
  }

  const handleChallenge = (speaker: string) => {
    setMode("treplica")
    sendMessageContent(
      `Modo Tréplica: outro conselheiro sentado contesta ${speaker} pelo nome. Depois ${speaker} responde. Tags SPEAKER separadas.`,
      "treplica"
    )
  }

  const handleContinue = () => {
    setMode("mesa")
    sendMessageContent("1 - Continuar no Debate com a mesa sentada. Próximo giro.", "mesa")
  }

  const handleTreplica = () => {
    setMode("treplica")
    sendMessageContent(
      "2 - Entrar em Tréplica: os conselheiros se respondem e discordam pelo nome.",
      "treplica"
    )
  }

  const handleVerdict = () => {
    const pinBlock =
      pins.length > 0
        ? `\n\nPins do usuário para incorporar no veredito:\n${pins
            .map((p, i) => `${i + 1}. [${p.speaker}] ${p.text.slice(0, 200)}`)
            .join("\n")}`
        : ""
    setMode("veredito")
    sendMessageContent(
      `5 - Veredito de Saraiva + plano de ataque. Só Saraiva fala. Consolide acordo, tensão e ações.` +
        pinBlock,
      "veredito"
    )
    setCanvasOpen(false)
  }

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="noise-overlay" aria-hidden="true" />

      <header className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
              O Conselho
            </span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground/50">//</span>
          <span className="font-mono text-[10px] text-violet-400 uppercase font-medium">
            Líder: Saraiva
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors border border-border/50 rounded-md"
          >
            <Layers className="w-4 h-4" />
            <span className="font-mono text-[10px] tracking-wider uppercase hidden sm:inline">
              Histórico
            </span>
            {conversations.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 font-mono text-[9px] rounded">
                {conversations.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <MesaBar
        roster={roster}
        mode={mode}
        activeSpeaker={activeSpeaker}
        focusSeatId={focusSeatId}
        onModeChange={setMode}
        onToggleSeat={toggleSeat}
        onFocusSeat={setFocusSeatId}
        onOpenCanvas={() => setCanvasOpen(true)}
        isThinking={isThinking}
      />

      <ConversationStream
        messages={messages}
        isThinking={isThinking}
        focusSpeaker={focusSpeakerName}
        onPin={handlePin}
        onDeepen={handleDeepen}
        onChallenge={handleChallenge}
        onContinue={handleContinue}
        onTreplica={handleTreplica}
        onVerdict={handleVerdict}
      />

      {/* Contextual strip — only when not thinking and past first message */}
      {!isThinking && messages.length > 1 && (
        <div className="px-6 md:px-16 lg:px-24 py-2 border-t border-border/40 bg-background/50 backdrop-blur-sm flex flex-wrap items-center justify-center gap-2 z-10">
          <button
            onClick={() => {
              setMode("mesa")
              sendMessageContent(
                "Convocar a mesa agora no tema atual. Conselheiros sentados falam em SPEAKER tags.",
                "mesa"
              )
            }}
            className="px-2.5 py-1 text-[11px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded transition-all"
          >
            Convocar Mesa
          </button>
          <button
            onClick={handleContinue}
            className="px-2.5 py-1 text-[11px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded transition-all"
          >
            Continuar
          </button>
          <button
            onClick={handleTreplica}
            className="px-2.5 py-1 text-[11px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded transition-all"
          >
            Tréplica
          </button>
          <button
            onClick={handleVerdict}
            className="px-2.5 py-1 text-[11px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded transition-all"
          >
            Veredito
          </button>
          <button
            onClick={() => setCanvasOpen(true)}
            className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded transition-all"
          >
            Canvas ({pins.length})
          </button>
        </div>
      )}

      <CommandDock
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isThinking={isThinking}
        disabled={isThinking}
      />

      <LatentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      <TensionCanvas
        open={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        pins={pins}
        onRemovePin={(id) => setPins((p) => p.filter((x) => x.id !== id))}
        onGenerateVerdict={handleVerdict}
      />
    </div>
  )
}
