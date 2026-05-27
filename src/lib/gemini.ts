import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";

type MenuItemSummary = {
  name: string;
  price: number;
  description?: string | null;
};

const SYSTEM_PROMPT = `You are Food Bot, the AI assistant for Borama Food Delivery in Borama, Somaliland.
You help customers discover food, compare dishes, answer questions about delivery, bookings, and restaurants.
Be warm, concise, and helpful. You may respond in English or Somali if the user writes in Somali.
When recommending food, mention real items from the menu data provided.
Delivery: typically 25-45 min in Borama. Service tax 5%, delivery fee $2.50.
Never invent restaurants or menu items not in the context.`;

export async function getMenuContext(): Promise<string> {
  const restaurants = await db.restaurant.findMany({
    where: { isOpen: true },
    include: {
      menuItems: {
        where: { isAvailable: true },
        take: 8,
        select: { name: true, price: true, description: true },
      },
    },
    take: 10,
  });

  if (!restaurants.length) {
    return "No restaurant data loaded yet.";
  }

  return restaurants
    .map((r) => {
      const items = (r.menuItems as MenuItemSummary[])
        .map(
          (m: MenuItemSummary) =>
            `  - ${m.name} ($${m.price})${m.description ? `: ${m.description}` : ""}`,
        )
        .join("\n");
      return `${r.name} (${r.cuisine}, ★${r.rating}, ~${r.deliveryMins}min delivery):\n${items || "  (menu loading)"}`;
    })
    .join("\n\n");
}

export async function askGemini(
  userMessage: string,
  history: { role: "user" | "model"; text: string }[] = [],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "AI assistant is not configured. Please add GEMINI_API_KEY to your .env file.";
  }

  const menuContext = await getMenuContext();
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `${SYSTEM_PROMPT}\n\n--- CURRENT MENUS IN BORAMA ---\n${menuContext}`,
  });

  const chat = model.startChat({
    history: history.slice(-10).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
  });

  const result = await chat.sendMessage(userMessage);
  return (
    result.response.text() ||
    "I could not generate a response. Please try again."
  );
}
