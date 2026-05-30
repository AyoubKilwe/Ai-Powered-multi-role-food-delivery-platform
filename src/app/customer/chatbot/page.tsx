"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Message {
  role: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "What's good for Somali food tonight?",
  "Recommend something under $15",
  "Compare pizza vs traditional dishes",
  "What restaurants deliver fastest?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Salaan! I'm your Food AI assistant for Borama. Ask me about any cuisine, dish, restaurant, or delivery — in English or Somali!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");
    const newMessages: Message[] = [
      ...messages,
      { role: "user", text: userMsg },
    ];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages
      .filter((m) => m.role === "user" || m.role === "bot")
      .slice(0, -1)
      .map((m) => ({
        role: (m.role === "user" ? "user" : "model") as "user" | "model",
        text: m.text,
      }));

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text:
            data.reply ||
            data.error ||
            "I couldn't generate a reply right now, but try asking again.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "Sorry, I couldn't reach the AI service right now. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
      <header className="flex items-center gap-4 border-b bg-linear-to-r from-brand-600 to-amber-500 px-6 py-5 text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            Food AI Assistant <Sparkles className="h-4 w-4" />
          </h2>
          <p className="text-sm text-orange-100">
            Ask for meals, restaurants, delivery info, or recommendations.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-stone-50 p-4 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-brand-600 text-white rounded-br-md"
                  : "bg-white text-stone-800 border border-stone-100 rounded-bl-md"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 rounded-2xl bg-white border px-4 py-3 w-fit shadow-sm">
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 border-t bg-white px-4 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => sendMessage(s)}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600 hover:border-brand-400 hover:bg-brand-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 border-t bg-white p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Somali food, pizza, seafood, delivery..."
          className="flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          disabled={loading}
        />
        <Button type="submit" disabled={loading} size="lg">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </section>
  );
}
