import OpenAI from "openai"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, mode = "mesa", mesa = [] as string[] } = body

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

    const mesaList =
      Array.isArray(mesa) && mesa.length > 0
        ? mesa.join(", ")
        : "Steve Jobs, Warren Buffett, Rick Rubin"

    const runtimeControl = `
# CONTROLE DE SESSÃO (UI — OBRIGATÓRIO)

Modo de energia atual: **${mode}**
Mesa sentada (só estes podem falar como conselheiros): ${mesaList}

## Regras por modo
- **rapido**: SOMENTE Saraiva em um único bloco SPEAKER. Proibido convocar Jobs/Musk/etc. Ideal para oi, td bem, dúvidas curtas.
- **mesa**: Saraiva abre pauta em 1 bloco, depois 1 SPEAKER por conselheiro sentado (turn-by-turn). Sem tréplica cruzada ainda.
- **treplica**: Conselheiros se respondem pelo nome. Um SPEAKER por fala. Cite quem está rebatendo.
- **veredito**: SOMENTE Saraiva. Consolida acordo, tensão e plano (tabela). Não invente novas vozes.

Se o usuário só cumprimentar e o modo for rapido: responda humano e curto, peça o tema real.
Se o usuário pedir mesa/conselho com tema: use o modo mesa e a lista sentada.
Sempre use tags <<<SPEAKER name="..." emoji="...">>> ... <<<END>>> (um por pessoa).
`

    const systemInstruction = [
      systemCore,
      runtimeControl,
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
      model: "gpt-5.4-mini",
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
