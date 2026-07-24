import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      )
    }

    // Carregar instruções do sistema do Conselho (Saraiva como líder)
    const instructionsPath = path.join(
      process.cwd(),
      "lib/conselho/SYSTEM_INSTRUCTIONS.md"
    )
    let systemInstruction = ""
    if (fs.existsSync(instructionsPath)) {
      systemInstruction = fs.readFileSync(instructionsPath, "utf-8")
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    })

    // Converter mensagens para o formato do Gemini API
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]?.content || ""

    const chat = model.startChat({
      history: history,
    })

    const result = await chat.sendMessageStream(lastMessage)

    // Stream de resposta no formato Server-Sent Events / ReadableStream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(encoder.encode(text))
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
    console.error("Erro na rota /api/chat:", error)
    return NextResponse.json(
      { error: error?.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
