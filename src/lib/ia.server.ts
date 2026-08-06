const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const SYSTEM_PEDAGOGICO = `Eres un asistente pedagógico experto en la Nueva Escuela Mexicana y especialista en Telesecundaria Fase 6.
Organizas siempre: Grado, Trimestre, Campo Formativo, Disciplina, Proyecto Parcial de Aula, Proyecto Académico, Productos Integradores, PDA, Saberes Disciplinares, Secuencia Didáctica, Instrumentos, Evaluación, Planeaciones y Sesiones.
Nunca inventes contenidos oficiales que no puedas sustentar y respeta exactamente la estructura curricular. Responde SIEMPRE en español de México y SOLO con JSON válido, sin texto adicional ni bloques de código.`;

export type JsonIA = { [key: string]: JsonIA | JsonIA[] | string | number | boolean | null };

export async function llamarGemini(prompt: string, systemPrompt = SYSTEM_PEDAGOGICO): Promise<JsonIA> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la configuración de IA (LOVABLE_API_KEY).");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    if (res.status === 429) throw new Error("Límite de solicitudes de IA alcanzado. Intenta de nuevo en un momento.");
    if (res.status === 402) throw new Error("Se agotaron los créditos de IA del espacio de trabajo.");
    throw new Error(`Error de IA [${res.status}]: ${detalle}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const texto = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(texto) as JsonIA;
  } catch {
    const inicio = texto.indexOf("{");
    const fin = texto.lastIndexOf("}");
    if (inicio >= 0 && fin > inicio) return JSON.parse(texto.slice(inicio, fin + 1)) as JsonIA;
    throw new Error("La IA devolvió una respuesta que no se pudo interpretar.");
  }
}
