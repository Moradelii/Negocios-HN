// services/geminiService.ts
// Actualizado para usar Claude AI a través de proxy

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
}

/**
 * Genera una descripción de negocio usando Claude AI
 * @param businessName - Nombre del negocio
 * @param category - Categoría del negocio
 * @param subCategory - Subcategoría del negocio
 * @returns Descripción generada o mensaje de error
 */
export const generateBusinessDescription = async (
  businessName: string,
  category: string,
  subCategory: string
): Promise<string> => {
  try {
    const prompt = `Genera una descripción profesional y atractiva para un negocio hondureño con los siguientes datos:
- Nombre: ${businessName}
- Categoría: ${category}
- Subcategoría: ${subCategory}

La descripción debe:
1. Tener entre 100-150 palabras
2. Ser profesional pero amigable
3. Destacar los beneficios para el cliente
4. Usar lenguaje apropiado para el mercado hondureño
5. No usar emojis ni símbolos especiales
6. Enfocarse en la calidad del servicio/producto

Genera SOLO la descripción, sin títulos ni introducciones adicionales.`;

    // Llamar al proxy de Vercel en lugar de directamente a Anthropic
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from proxy:', errorData);
      throw new Error(errorData.error || 'Error generando descripción');
    }

    const data: ClaudeResponse = await response.json();
    
    // Extraer el texto de la respuesta
    const generatedText = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n')
      .trim();

    if (!generatedText) {
      throw new Error('No se pudo generar la descripción');
    }

    return generatedText;

  } catch (error) {
    console.error('Error en generateBusinessDescription:', error);
    
    // Retornar descripción por defecto en caso de error
    return `${businessName} es un establecimiento dedicado a ${subCategory} en Honduras. Ofrecemos servicios de calidad para satisfacer las necesidades de nuestros clientes. Contamos con experiencia en el sector de ${category} y nos comprometemos a brindar la mejor atención.`;
  }
};

/**
 * Función genérica para llamar a Claude AI
 * @param messages - Array de mensajes para la conversación
 * @returns Respuesta de Claude
 */
export const callClaude = async (
  messages: ClaudeMessage[]
): Promise<string> => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la llamada a Claude');
    }

    const data: ClaudeResponse = await response.json();
    
    return data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n')
      .trim();

  } catch (error) {
    console.error('Error calling Claude:', error);
    throw error;
  }
};
