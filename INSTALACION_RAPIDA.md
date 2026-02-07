# 🚀 Guía de Instalación - Solución CORS

## 📋 Pasos Rápidos

### Paso 1: Crear la carpeta `api` en la raíz de tu proyecto

```
tu-proyecto/
├── api/              ← CREAR ESTA CARPETA
│   └── chat.ts       ← Copiar el archivo que te envié
├── components/
├── services/
├── App.tsx
└── ...
```

### Paso 2: Copiar archivos

1. **Copia `api/chat.ts`** a tu carpeta `api/` (créala si no existe)
2. **Copia `vercel.json`** a la raíz de tu proyecto
3. **Opcional**: Copia `services/claudeService.ts` si quieres un servicio dedicado

### Paso 3: Opción A - Modificar tu `geminiService.ts` existente

Si prefieres no crear un archivo nuevo, simplemente REEMPLAZA el contenido de tu archivo `services/geminiService.ts` con esto:

```typescript
// services/geminiService.ts
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

/**
 * Genera una descripción de negocio usando Claude AI
 */
export const generateBusinessDescription = async (
  businessName: string,
  category: string,
  subCategory: string
): Promise<string> => {
  try {
    const prompt = \`Genera una descripción profesional y atractiva para un negocio hondureño con los siguientes datos:
- Nombre: \${businessName}
- Categoría: \${category}
- Subcategoría: \${subCategory}

La descripción debe:
1. Tener entre 100-150 palabras
2. Ser profesional pero amigable
3. Destacar los beneficios para el cliente
4. Usar lenguaje apropiado para el mercado hondureño
5. No usar emojis ni símbolos especiales
6. Enfocarse en la calidad del servicio/producto

Genera SOLO la descripción, sin títulos ni introducciones adicionales.\`;

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
    
    const generatedText = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\\n')
      .trim();

    if (!generatedText) {
      throw new Error('No se pudo generar la descripción');
    }

    return generatedText;

  } catch (error) {
    console.error('Error en generateBusinessDescription:', error);
    
    // Descripción por defecto en caso de error
    return \`\${businessName} es un establecimiento dedicado a \${subCategory} en Honduras. Ofrecemos servicios de calidad para satisfacer las necesidades de nuestros clientes. Contamos con experiencia en el sector de \${category} y nos comprometemos a brindar la mejor atención.\`;
  }
};
```

**CON ESTA OPCIÓN NO NECESITAS MODIFICAR `App.tsx`** porque ya estás importando `geminiService`.

### Paso 4: Instalar dependencia de Vercel

```bash
npm install @vercel/node --save-dev
```

### Paso 5: Obtener tu API Key de Anthropic

1. Ve a **https://console.anthropic.com**
2. Regístrate o inicia sesión
3. Ve a **Settings** → **Billing** → Agrega método de pago
4. Ve a **API Keys** → **Create Key**
5. Copia la key (empieza con `sk-ant-api03-...`)

### Paso 6: Configurar API Key en Vercel

1. Ve a **https://vercel.com/dashboard**
2. Selecciona tu proyecto
3. **Settings** → **Environment Variables**
4. Click en **"Add New"**:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-api03-tu-key-aqui`
   - Marca todas las casillas (Production, Preview, Development)
5. Click **Save**

### Paso 7: Subir cambios a GitHub

```bash
git add .
git commit -m "feat: Add Anthropic API proxy to fix CORS"
git push origin main
```

Vercel automáticamente detectará los cambios y desplegará.

## ✅ Verificar que Funciona

1. Espera que Vercel termine el despliegue (1-2 minutos)
2. Abre tu app en el navegador
3. Intenta registrar un nuevo negocio
4. Presiona el botón de generar descripción con IA
5. Revisa la consola del navegador - NO deberían aparecer errores CORS

## 🐛 Si algo sale mal

### Error: "Cannot find module '@vercel/node'"
```bash
npm install @vercel/node --save-dev
git add package.json package-lock.json
git commit -m "fix: Add @vercel/node dependency"
git push
```

### Error: "API key not configured"
- Verifica que agregaste `ANTHROPIC_API_KEY` en Vercel
- Asegúrate de que marcaste todas las opciones (Production, Preview, Development)
- Redesplega manualmente desde el dashboard de Vercel

### Error: "404 Not Found en /api/chat"
- Verifica que la carpeta `api/` esté en la raíz del proyecto
- Verifica que `vercel.json` esté en la raíz
- Redesplega el proyecto

### La descripción no se genera
- Abre la consola del navegador (F12)
- Ve a la pestaña Network
- Busca la petición a `/api/chat`
- Revisa el error específico
- Envíame el mensaje de error

## 📁 Archivos finales que debes tener

```
tu-proyecto/
├── api/
│   └── chat.ts          ← NUEVO
├── components/
├── services/
│   └── geminiService.ts ← MODIFICADO (con el código nuevo)
├── App.tsx
├── vercel.json          ← NUEVO
└── package.json         ← Actualizado con @vercel/node
```

## 💡 Resumen

- ✅ Creaste la carpeta `api/` con `chat.ts`
- ✅ Modificaste `services/geminiService.ts` (o creaste `claudeService.ts`)
- ✅ Copiaste `vercel.json` a la raíz
- ✅ Instalaste `@vercel/node`
- ✅ Configuraste `ANTHROPIC_API_KEY` en Vercel
- ✅ Subiste los cambios a GitHub

¡Listo! Ya no deberías ver errores CORS.
