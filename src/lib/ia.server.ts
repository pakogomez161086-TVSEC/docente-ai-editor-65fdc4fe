const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";

export const SYSTEM_PEDAGOGICO = `Eres un asistente pedagógico experto en la Nueva Escuela Mexicana y especialista en Telesecundaria Fase 6.
Organizas siempre: Grado, Trimestre, Campo Formativo, Disciplina, Proyecto Parcial de Aula, Proyecto Académico, Productos Integradores, PDA, Saberes Disciplinares, Secuencia Didáctica, Instrumentos, Evaluación, Planeaciones y Sesiones.
Nunca inventes contenidos oficiales que no puedas sustentar y respeta exactamente la estructura curricular. Responde SIEMPRE en español de México y SOLO con JSON válido, sin texto adicional ni bloques de código.`;

export type JsonIA = { [key: string]: JsonIA | JsonIA[] | string | number | boolean | null };

type Mensaje = { role: "user" | "assistant"; content: string };

async function llamarIA(instrucciones: string, mensajes: Mensaje[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: instrucciones,
      input: mensajes.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    if (res.status === 429) throw new Error("Límite de solicitudes de IA alcanzado. Intenta de nuevo en un momento.");
    if (res.status === 402) throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
    throw new Error(`Error de IA [${res.status}]: ${detalle.slice(0, 300)}`);
  }

  // Leer el stream SSE y acumular el texto de salida.
  const reader = res.body?.getReader();
  if (!reader) throw new Error("La IA no devolvió contenido.");
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";
  let errorEvento: string | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lineas = buffer.split("\n");
    buffer = lineas.pop() ?? "";
    for (const linea of lineas) {
      if (!linea.startsWith("data:")) continue;
      const payload = linea.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
          error?: { message?: string };
        };
        if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") {
          texto += ev.delta;
        } else if (ev.type === "response.completed" && ev.response?.output_text) {
          texto = ev.response.output_text;
        } else if (ev.type === "response.failed" || ev.type === "error") {
          errorEvento = ev.error?.message ?? "La generación falló.";
        }
      } catch {
        // línea parcial; se completa en el siguiente chunk
      }
    }
  }

  if (errorEvento) throw new Error(errorEvento);
  if (!texto.trim()) throw new Error("La IA devolvió una respuesta vacía. Intenta de nuevo.");
  return texto;
}

export async function llamarGemini(prompt: string, systemPrompt = SYSTEM_PEDAGOGICO): Promise<JsonIA> {
  const texto = await llamarIA(systemPrompt, [{ role: "user", content: prompt }]);
  try {
    return JSON.parse(texto) as JsonIA;
  } catch {
    const inicio = texto.indexOf("{");
    const fin = texto.lastIndexOf("}");
    if (inicio >= 0 && fin > inicio) return JSON.parse(texto.slice(inicio, fin + 1)) as JsonIA;
    throw new Error("La IA devolvió una respuesta que no se pudo interpretar.");
  }
}

export async function llamarGeminiTexto(
  mensajes: Mensaje[],
  systemPrompt: string,
): Promise<string> {
  const texto = await llamarIA(systemPrompt, mensajes);
  return texto.trim() || "No pude generar una respuesta.";
}
