import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";

type MenuItemSummary = {
  name: string;
  price: number;
  description?: string | null;
};

const SYSTEM_PROMPT = `You are Food Bot, the AI assistant for Borama Food Delivery in Borama, Somaliland.
Your job is to answer every user question helpfully, not to remain silent.
Always reply in the same language as the user when possible; if the user writes in Somali, answer in Somali first.
If the question is broad or unrelated to menus, still give a useful, friendly answer and offer food app help.
You help customers discover food, compare dishes, answer questions about delivery, bookings, support, and restaurants.
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

  try {
    const result = await chat.sendMessage(userMessage);
    return (
      result.response.text() ||
      "Waan isku dayay laakiin jawaab cad ma soo bixin. Fadlan su'aashaada si kale u qor, aniguna mar kale ayaan kaa caawin doonaa."
    );
  } catch {
    return "Gemini hadda si ku-meel-gaar ah ayuu mashquulsan yahay, laakiin waan joogaa: ii qor su'aashaada cunto, restaurant, delivery, booking, ama support — waxaan kuugu jawaabi doonaa Soomaali ama Ingiriisi.";
  }
}
