const FAQ: Record<string, string> = {
  delivery:
    "We deliver across Borama! Typical delivery time is 25–45 minutes depending on restaurant and distance.",
  payment:
    "Pay securely at checkout. We accept cash on delivery and mobile money (demo mode).",
  cancel:
    "You can cancel orders while status is Pending. After acceptance, contact support via admin.",
  hours: "Most partner restaurants are open 8 AM – 11 PM. Check each restaurant's page for details.",
  fee: "Service tax is 5% plus a flat $2.50 delivery fee. Driver earns commission on each delivery.",
  borama: "Borama Food Delivery connects you with the best restaurants in Borama, Somaliland.",
};

const RECOMMENDATIONS = [
  "Try Hoyo's Kitchen for authentic Somali camel meat and rice — highly rated!",
  "Borama Pizza House is perfect for family nights — fast delivery under 30 mins.",
  "For a healthy option, Green Garden Cafe has fresh salads and smoothies.",
  "Sea Breeze Restaurant has the best grilled fish in town on weekends.",
];

export function getChatbotResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("recommend") || lower.includes("suggest") || lower.includes("what should")) {
    return RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)];
  }

  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key)) return answer;
  }

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("salaan")) {
    return "Salaan! I'm Food Bot, your Borama Food assistant. Ask me for recommendations, delivery info, or restaurant tips!";
  }

  if (lower.includes("pizza")) {
    return "Borama Pizza House has Margherita, Pepperoni, and Somali Fusion pizzas from $8. Want me to guide you to their menu?";
  }

  if (lower.includes("somali") || lower.includes("traditional")) {
    return "Hoyo's Kitchen specializes in traditional Somali cuisine — bariis, hilib, and suqaar. Rating 4.8★!";
  }

  return "I can help with food recommendations, delivery times, fees, and FAQs about Borama Food Delivery. Try asking: 'Recommend something' or 'What are delivery fees?'";
}
