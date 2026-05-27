import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { askGemini } from "@/lib/gemini";
import { getChatbotResponse } from "@/lib/chatbot";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Please sign in to use Food Bot" }, { status: 401 });
    }

    const { message, history } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const typedHistory = (history || []) as { role: "user" | "model"; text: string }[];

    let reply: string;
    if (process.env.GEMINI_API_KEY) {
      reply = await askGemini(message.trim(), typedHistory);
    } else {
      reply = getChatbotResponse(message);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble right now. Try asking about a specific dish or restaurant." },
      { status: 200 }
    );
  }
}
