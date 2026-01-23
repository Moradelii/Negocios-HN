
import { GoogleGenAI } from "@google/genai";

/**
 * Helper to get a safe instance of the AI client.
 * Uses process.env.API_KEY exclusively.
 */
const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key no configurada.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Genera una descripción profesional utilizando el modelo básico.
 */
export const generateBusinessDescription = async (name: string, category: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe una descripción profesional y atractiva de máximo 150 caracteres para un negocio llamado "${name}" que pertenece a la categoría de "${category}" en Honduras. Usa un tono confiable.`
    });
    return response.text?.trim() || "Un negocio comprometido con la excelencia.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Servicio local dedicado a brindar la mejor atención.";
  }
};

/**
 * Asistente para recomendar negocios basado en búsquedas.
 * Se utiliza el modelo básico Flash para mantener la funcionalidad gratuita/estándar.
 */
export const searchAssistant = async (query: string, businesses: any[]): Promise<string> => {
  try {
    const ai = getAiClient();
    const businessNames = businesses.map(b => `${b.name} (${b.category})`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `El usuario busca: "${query}". Basado en estos negocios: [${businessNames}], recomienda brevemente cuáles podrían interesarle. Responde de forma amable y corta.`
    });
    return response.text?.trim() || "No pudimos procesar tu búsqueda detallada.";
  } catch (error) {
    console.error("Gemini Search Assistant Error:", error);
    return "Error al conectar con el asistente.";
  }
};
