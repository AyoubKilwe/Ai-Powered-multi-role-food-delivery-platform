const FAQ: Record<string, string> = {
  delivery:
    "Waxaan ka shaqeynaa Borama oo dhan. Waqtiga delivery-ga badanaa waa 25–45 daqiiqo, iyadoo ku xiran masaafada iyo restaurant-ka.",
  payment:
    "Checkout-ka si ammaan ah ayaad ugu bixin kartaa. Demo ahaan waxaan taageernaa cash on delivery iyo mobile money.",
  cancel:
    "Order-ka waad joojin kartaa inta uu Pending yahay. Haddii la aqbalay, la xiriir support-ka admin-ka.",
  hours:
    "Restaurant-yada intooda badan waxay furan yihiin 8 subaxnimo ilaa 11 habeenimo.",
  fee: "Service tax waa 5% waxaana jira delivery fee go'an oo ah $2.50.",
  borama:
    "Borama Food Delivery wuxuu kuu xiraa restaurant-yada ugu fiican Borama, Somaliland.",
  support: "Waxaad nala soo xiriiri kartaa WhatsApp: +2520636279674",
};

const RECOMMENDATIONS: string[] = [
  "Try Hoyo's Kitchen for authentic Somali camel meat and rice — highly rated!",
  "Borama Pizza House is perfect for family nights — fast delivery under 30 mins.",
  "For a healthy option, Green Garden Cafe has fresh salads and smoothies.",
  "Sea Breeze Restaurant has the best grilled fish in town on weekends.",
];

export function getChatbotResponse(message: string): string {
  const lower = (message || "").toLowerCase();

  if (
    lower.includes("support") ||
    lower.includes("help") ||
    lower.includes("whatsapp") ||
    lower.includes("contact")
  ) {
    return (
      "Haa, caawimo ayaad heli kartaa. Nala soo xiriir WhatsApp: +2520636279674. " +
      "Haddii aad rabto, waxaan sidoo kale kaa caawin karaa restaurant, menu, delivery, booking, ama order."
    );
  }

  if (
    lower.includes("recommend") ||
    lower.includes("suggest") ||
    lower.includes("what should")
  ) {
    const pick =
      RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)];
    return `Haa, waxaan kugula talinayaa: ${pick}`;
  }

  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key)) return answer;
  }

  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("salaan")
  ) {
    return (
      "Salaan! Waxaan ahay Food Bot. I waydii cunto, restaurant, delivery, booking, support, ama talo cunto - " +
      "waxaan kuugu jawaabi doonaa Soomaali ahaan haddii aad Somali iigu qorto."
    );
  }

  if (
    lower.includes("somali") ||
    lower.includes("soomaali") ||
    lower.includes("maxaad") ||
    lower.includes("sidee") ||
    lower.includes("waa maxay")
  ) {
    return (
      "Haa, waxaan kuugu jawaabi karaa Soomaali. Ii qor su'aashaada si faahfaahsan, aniguna " +
      "waxaan kuu sharxi doonaa cunto, restaurant, delivery, booking, ama support si fudud."
    );
  }

  if (lower.includes("pizza")) {
    return (
      "Borama Pizza House wuxuu leeyahay Margherita, Pepperoni, iyo Somali Fusion pizzas laga bilaabo $8. " +
      "Haddii aad rabto, waxaan kuu tilmaami karaa menu-ga."
    );
  }

  if (lower.includes("traditional") || lower.includes("somali food")) {
    return "Hoyo's Kitchen waxay ku fiican tahay cunno Soomaali ah sida bariis, hilib, iyo suqaar. Qiimeyntu waa 4.8★!";
  }

  return (
    "Haa, waan kaa caawin karaa. Ii qor su'aashaada si fudud - haddii ay tahay cunto, restaurant, delivery, booking, support, " +
    "ama wax kale, waxaan isku dayayaa inaan si cad kuugu jawaabo. Haddii aad rabto taageero degdeg ah, WhatsApp noogu soo dir +2520636279674."
  );
}
