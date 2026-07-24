"use client"

import { useState, useCallback, useRef } from "react"
import { ConversationStream, Message } from "./conversation-stream"
import { CommandDock } from "./command-dock"
import { LatentSidebar, Conversation } from "./latent-sidebar"
import { Layers, Moon, Sun, ShieldAlert, Sparkles, Users } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

// Mensagem inicial — Saraiva, Presidente do Conselho
const INITIAL_COUNCIL_MESSAGE: Message = {
  id: "init-saraiva",
  role: "assistant",
  content: `**Saraiva entra na sala.**

Você entrou na mesa-redonda. Aqui não tem opinião genérica — tem **avatares com lentes** e atrito real.

🧠 Jobs · ⚡ Musk · 📊 Buffett · 📕 Sun Tzu · 🎨 Rick Rubin · 🧬 Sam Altman · e o banco completo.

Eu sou **Saraiva** — Presidente do Conselho.
Montamos a mesa (você escolhe quem senta, ou eu castro).
Rodamos em **Debate**, **Tréplica**, e eu fecho o **Veredito** com o plano.

**Qual é o tema — e quer escolher os conselheiros ou deixo a mesa comigo?**`,
  timestamp: "Agora"
}

export function NeuralCore() {
  const { theme, toggleTheme } = useTheme()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([INITIAL_COUNCIL_MESSAGE])
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateTimestamp = () => {
    const now = new Date()
    return now.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: false 
    })
  }

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation)
    setMessages(conversation.messages)
  }, [])

  const handleNewConversation = useCallback(() => {
    setActiveConversation(null)
    setMessages([INITIAL_COUNCIL_MESSAGE])
    setSidebarOpen(false)
  }, [])

  const sendMessageContent = async (textToSend: string) => {
    if (!textToSend.trim() || isThinking) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend.trim(),
      timestamp: generateTimestamp()
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setIsThinking(true)

    // ID para a mensagem da IA que vai receber o stream
    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: generateTimestamp()
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: abortControllerRef.current.signal
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

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        )
      }

      // Atualizar no histórico de conversas
      const finalMessages = [
        ...updatedMessages,
        { ...assistantMessage, content: accumulatedText }
      ]

      if (activeConversation) {
        setConversations(prev =>
          prev.map(conv =>
            conv.id === activeConversation.id
              ? { ...conv, messages: finalMessages, preview: userMessage.content }
              : conv
          )
        )
      } else {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: userMessage.content.slice(0, 40) + (userMessage.content.length > 40 ? "..." : ""),
          preview: accumulatedText.slice(0, 80) + "...",
          date: "Hoje",
          messages: finalMessages
        }
        setConversations(prev => [newConv, ...prev])
        setActiveConversation(newConv)
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "⚠️ **Erro ao conectar com O Conselho:** " + (err.message || "Erro desconhecido")
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
  }, [inputValue, isThinking, messages])

  const handleQuickOption = (optionText: string) => {
    sendMessageContent(optionText)
  }

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-16 lg:px-24 py-4 border-b border-border bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
              O Conselho
            </span>
          </div>
          <span className="font-mono text-[9px] text-muted-foreground/50">
            //
          </span>
          <span className="font-mono text-[10px] text-violet-400 uppercase font-medium">
            Líder: Saraiva
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Alternar tema */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {/* Histórico */}
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
      
      {/* Área principal do chat */}
      <ConversationStream 
        messages={messages} 
        isThinking={isThinking} 
      />

      {/* Botões rápidos de controle do Round (quando não está pensando) */}
      {!isThinking && messages.length > 1 && (
        <div className="px-6 md:px-16 lg:px-24 py-2 border-t border-border/40 bg-background/50 backdrop-blur-sm flex flex-wrap items-center justify-center gap-2 z-10">
          <span className="font-mono text-[10px] text-muted-foreground uppercase mr-1">Comandos do Round:</span>
          <button
            onClick={() => handleQuickOption("1 - Avançar para o próximo round")}
            className="px-2.5 py-1 text-[11px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded transition-all"
          >
            1️⃣ Próximo Round
          </button>
          <button
            onClick={() => handleQuickOption("2 - Aprofundar um ponto específico")}
            className="px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded transition-all"
          >
            2️⃣ Aprofundar
          </button>
          <button
            onClick={() => handleQuickOption("3 - Convocar mente adicional ao Conselho")}
            className="px-2.5 py-1 text-[11px] font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded transition-all"
          >
            3️⃣ Convocar Mente
          </button>
          <button
            onClick={() => handleQuickOption("4 - Provocar duelo entre duas mentes")}
            className="px-2.5 py-1 text-[11px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded transition-all"
          >
            4️⃣ Provocar Duelo
          </button>
          <button
            onClick={() => handleQuickOption("5 - Ir direto ao Plano de Ataque")}
            className="px-2.5 py-1 text-[11px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded transition-all"
          >
            5️⃣ Plano de Ataque
          </button>
        </div>
      )}
      
      {/* Dock de comandos */}
      <CommandDock
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isThinking={isThinking}
        disabled={isThinking}
      />
      
      {/* Barra lateral do Histórico */}
      <LatentSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  )
}
