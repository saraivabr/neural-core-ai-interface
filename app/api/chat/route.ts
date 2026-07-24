import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não foi configurada no ambiente." },
        { status: 500 }
      )
    }

    // Conselho: Saraiva (presidente) + knowledge de avatares/modos
    const conselhoDir = path.join(process.cwd(), "lib/conselho")
    const loadMd = (name: string) => {
      const p = path.join(conselhoDir, name)
      return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : ""
    }

    const systemCore = loadMd("SYSTEM_INSTRUCTIONS.md")
    const extras = loadMd("CONSELHEIROS_EXTRAS.md")
    // Profiles e frameworks são grandes — inclui resumo dos extras sempre;
    // profiles completos só se couberem de forma razoável no system.
    const profiles = loadMd("MINDS_PROFILES.md")
    const frameworks = loadMd("DEBATE_FRAMEWORKS.md")

    const MAX_KNOWLEDGE = 120_000
    let knowledge = [extras, profiles, frameworks].filter(Boolean).join("\n\n---\n\n")
    if (knowledge.length > MAX_KNOWLEDGE) {
      knowledge = knowledge.slice(0, MAX_KNOWLEDGE) + "\n\n[... knowledge truncado ...]"
    }

    const systemInstruction = [
      systemCore,
      knowledge && "\n\n# KNOWLEDGE BASE DO CONSELHO\n\n" + knowledge,
    ]
      .filter(Boolean)
      .join("\n")

    const openai = new OpenAI({ apiKey })

    // Formatar histórico para OpenAI
    const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemInstruction,
      },
      ...messages.map((msg: any) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
    ]

    const responseStream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.7,
      stream: true,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              controller.enqueue(encoder.encode(content))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("Erro na rota /api/chat (OpenAI):", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
