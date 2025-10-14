// src/pages/api/generate-svg.js
import { OpenAI } from "openai";

const BASE_URL = import.meta.env.OR_URL;
const API_KEY = import.meta.env.OR_TOKEN;

export const POST = async ({ request }) => {
  const body = await request.json();
  console.log("Body reçu:", body);

  // Si c'est déjà un tableau → on prend direct
  // Sinon, on récupère body.messages
  const messages = Array.isArray(body) ? body : body.messages || [];
  
  // Récupérer le modèle sélectionné ou utiliser une valeur par défaut
  const selectedModel = body.model || "openai/gpt-4o-mini";

  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
  });

  const SystemMessage = {
    role: "system",
    content:
      "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG. Return ONLY the SVG code without any markdown formatting or code blocks.",
  };

  console.log("Utilisation du modèle:", selectedModel);

  const chatCompletion = await client.chat.completions.create({
    model: selectedModel,
    messages: [SystemMessage, ...messages],
  });

  const message = chatCompletion.choices[0].message || {};
  console.log("Generated SVG:", message);

  const svgMatch = message.content?.match(/<svg[\s\S]*?<\/svg>/i);
  message.content = svgMatch ? svgMatch[0] : "";

  return new Response(JSON.stringify({ svg: message }), {
    headers: { "Content-Type": "application/json" },
  });
};
