import { NextResponse } from "next/server";
import { askGemini } from "@/lib/gemini";
import { getChatbotResponse } from "@/lib/chatbot";

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const typedHistory = (history || []) as {
      role: "user" | "model";
      text: string;
    }[];

    let reply: string;
    try {
      reply = process.env.GEMINI_API_KEY
        ? await askGemini(message.trim(), typedHistory)
        : getChatbotResponse(message);
    } catch {
      reply = getChatbotResponse(message);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    return NextResponse.json(
      { reply: getChatbotResponse("recommend something") },
      { status: 200 },
    );
  }
}
