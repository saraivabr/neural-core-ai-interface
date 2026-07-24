"use client"

import { cn } from "@/lib/utils"
import { Check, Copy, Download, Share2 } from "lucide-react"
import { useState } from "react"
import { JSX } from "react/jsx-runtime"
import type { SpeakerKind } from "@/lib/conselho/parse-speakers"

interface StreamMessageProps {
  role: "user" | "assistant"
  content: string
  timestamp?: string
  /** When set, renders as a counselor/Saraiva chat bubble */
  speaker?: {
    name: string
    emoji: string
    kind: SpeakerKind
  }
}

export function StreamMessage({ role, content, timestamp, speaker }: StreamMessageProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conselho-${speaker?.name || "resposta"}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: speaker ? `${speaker.name} — O Conselho` : "O Conselho",
          text: content,
        })
      } catch {
        await handleCopy()
      }
    } else {
      await navigator.clipboard.writeText(content)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const isUser = role === "user"
  const kind = speaker?.kind || "narrador"

  const parseInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let keyIndex = 0

    while (remaining.length > 0) {
      const inlineCodeMatch = remaining.match(/^`([^`]+)`/)
      if (inlineCodeMatch) {
        parts.push(
          <code
            key={keyIndex++}
            className="px-1.5 py-0.5 bg-muted text-accent text-[13px] font-mono rounded"
          >
            {inlineCodeMatch[1]}
          </code>
        )
        remaining = remaining.slice(inlineCodeMatch[0].length)
        continue
      }

      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
      if (boldMatch) {
        parts.push(
          <strong key={keyIndex++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        )
        remaining = remaining.slice(boldMatch[0].length)
        continue
      }

      const italicMatch = remaining.match(/^\*([^*]+)\*/)
      if (italicMatch) {
        parts.push(
          <em key={keyIndex++} className="italic text-foreground/80">
            {italicMatch[1]}
          </em>
        )
        remaining = remaining.slice(italicMatch[0].length)
        continue
      }

      const nextSpecial = remaining.search(/[`*]/)
      if (nextSpecial === -1) {
        parts.push(remaining)
        break
      } else if (nextSpecial === 0) {
        parts.push(remaining[0])
        remaining = remaining.slice(1)
      } else {
        parts.push(remaining.slice(0, nextSpecial))
        remaining = remaining.slice(nextSpecial)
      }
    }

    return parts
  }

  const renderContent = () => {
    if (isUser) {
      return <p className="text-[15px] leading-relaxed">{content}</p>
    }

    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const codeContent = part.replace(/```\w*\n?/g, "").replace(/```$/, "")
        return (
          <div key={index} className="my-3 relative group">
            <pre className="code-block p-4 overflow-x-auto">
              <code className="text-[13px] text-muted-foreground">{codeContent}</code>
            </pre>
          </div>
        )
      }

      const lines = part.split("\n")
      return lines.map((line, lineIndex) => {
        if (line.startsWith("## ")) {
          return (
            <h2
              key={`${index}-${lineIndex}`}
              className="font-serif text-lg font-medium mt-3 mb-2 text-foreground"
            >
              {parseInlineMarkdown(line.replace("## ", ""))}
            </h2>
          )
        }
        if (line.startsWith("# ")) {
          return (
            <h1
              key={`${index}-${lineIndex}`}
              className="font-serif text-xl font-medium mt-3 mb-2 text-foreground"
            >
              {parseInlineMarkdown(line.replace("# ", ""))}
            </h1>
          )
        }
        if (line.startsWith("- ") || /^\d+[\.\)]\s/.test(line)) {
          return (
            <li
              key={`${index}-${lineIndex}`}
              className="text-[14px] leading-relaxed ml-4 text-foreground/90 list-disc"
            >
              {parseInlineMarkdown(line.replace(/^(?:- |\d+[\.\)]\s)/, ""))}
            </li>
          )
        }
        if (line.trim() === "") {
          return <div key={`${index}-${lineIndex}`} className="h-2" />
        }
        return (
          <p
            key={`${index}-${lineIndex}`}
            className="text-[14px] md:text-[15px] leading-relaxed text-foreground/90"
          >
            {parseInlineMarkdown(line)}
          </p>
        )
      })
    })
  }

  const tagLabel = isUser
    ? "USER_01"
    : speaker
      ? speaker.kind === "saraiva"
        ? "SARAIVA · PRESIDENTE"
        : speaker.name.toUpperCase().replace(/\s+/g, "_")
      : "NEURAL_CORE"

  const bubbleAccent =
    kind === "saraiva"
      ? "border-l-amber-500/80 bg-amber-500/[0.04]"
      : kind === "conselheiro"
        ? "border-l-primary/70 bg-primary/[0.03]"
        : "border-l-border bg-muted/20"

  return (
    <div
      className={cn(
        "animate-drift-up w-full",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}
    >
      {/* Tag */}
      <div className="flex items-center gap-2 mb-2 px-0.5">
        {!isUser && speaker && (
          <span className="text-base leading-none" aria-hidden>
            {speaker.emoji}
          </span>
        )}
        <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
          {tagLabel}
        </span>
        {timestamp && (
          <span className="font-mono text-[10px] text-muted-foreground/50">{timestamp}</span>
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[min(92%,42rem)]",
          isUser
            ? "text-right text-muted-foreground"
            : cn(
                "text-left w-full rounded-r-xl rounded-bl-xl border border-border/40",
                "border-l-[3px] px-4 py-3.5 shadow-sm",
                bubbleAccent
              )
        )}
      >
        {!isUser && speaker && (
          <div className="mb-2 flex items-center gap-2">
            <span className="font-serif text-[15px] font-medium text-foreground tracking-tight">
              {speaker.name}
            </span>
            {speaker.kind === "saraiva" && (
              <span className="font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                Presidente
              </span>
            )}
            {speaker.kind === "conselheiro" && (
              <span className="font-mono text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary/90">
                Conselheiro
              </span>
            )}
          </div>
        )}
        {renderContent()}
      </div>

      {/* Actions */}
      {!isUser && (
        <div className="mt-2 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "font-mono text-[10px] tracking-wider text-muted-foreground/60",
              "hover:text-muted-foreground transition-colors magnetic-hover"
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>COPIADO</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>COPIAR</span>
              </>
            )}
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={handleDownload}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "font-mono text-[10px] tracking-wider text-muted-foreground/60",
              "hover:text-muted-foreground transition-colors magnetic-hover"
            )}
          >
            <Download className="w-3 h-3" />
            <span>BAIXAR</span>
          </button>
          <span className="text-muted-foreground/30">|</span>
          <button
            onClick={handleShare}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1",
              "font-mono text-[10px] tracking-wider text-muted-foreground/60",
              "hover:text-muted-foreground transition-colors magnetic-hover"
            )}
          >
            {shared ? (
              <>
                <Check className="w-3 h-3" />
                <span>COMPARTILHADO</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3" />
                <span>COMPARTILHAR</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
