"use client";

import { useMemo, useState } from "react";
import { Bot, MessageCircle, Sparkles, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Message = {
  role: "user" | "bot";
  text: string;
};

type FloatingHomeSupportProps = {
  whatsappNumber: string;
  defaultTitle?: string;
};

export function FloatingHomeSupport({
  whatsappNumber,
  defaultTitle = "Food AI",
}: FloatingHomeSupportProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Salaan 👋 Waxaan ahay Food AI. Wax kasta i waydii — cunto, restaurant, delivery, booking, ama caawimo — waxaan kuugu jawaabi doonaa Soomaali ama Ingiriisi.",
    },
  ]);

  const waLink = useMemo(() => {
    const digits = whatsappNumber.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(
      "Salaan, waxaan u baahanahay caawimo BoramaFood.",
    )}`;
  }, [whatsappNumber]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput("");

    const newMessages = [...messages, { role: "user", text: userMsg } as Message];
    setMessages(newMessages);
    setLoading(true);

    const history: { role: "user" | "model"; text: string }[] = newMessages
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text,
      }));

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text:
            data.reply ||
            data.error ||
            "Waan ka xumahay, hadda jawaab ma soo saari karo. Fadlan mar kale isku day.",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "Waan ka xumahay, server-ka AI-ga hadda wuu mashquulsan yahay. Mar kale isku day ama WhatsApp ii dir.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex w-[min(92vw,28rem)] max-h-[72vh] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between bg-linear-to-r from-brand-600 to-amber-500 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{defaultTitle}</p>
                <p className="text-xs text-orange-100">
                  Soomaali • Support • WhatsApp
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 transition hover:bg-white/15"
              aria-label="Close support widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-stone-50 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-stone-100 bg-white text-stone-800"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex w-fit gap-1 rounded-2xl border border-stone-100 bg-white px-3 py-2 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Qor su'aal..."
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}

      <div className="flex items-center gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
          aria-label="WhatsApp support"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:-translate-y-0.5"
          aria-label="Open AI support"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </button>
      </div>
    </div>
  );
}
