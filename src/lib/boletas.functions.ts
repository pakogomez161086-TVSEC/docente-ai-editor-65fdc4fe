import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { llamarGemini } from "./ia.server";

export const generarInformePedagogico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        alumno: z.string().min(1),
        grado: z.number().int().min(1).max(3),
        grupo: z.string().min(1),
        trimestre: z.number().int().min(1).max(3),
        calificaciones: z
          .array(
            z.object({
              disciplina: z.string(),
              campo_formativo: z.string(),
              calificacion: z.number(),
              observaciones: z.string().optional(),
            }),
          )
          .min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const detalle = data.calificaciones
      .map(
        (c) =>
          `- ${c.disciplina} (${c.campo_formativo}): ${c.calificacion}${c.observaciones ? ` — ${c.observaciones}` : ""}`,
      )
      .join("\n");

    const prompt = `Genera un informe pedagógico trimestral para un estudiante de Telesecundaria Fase 6, alineado a la Nueva Escuela Mexicana y a la evaluación formativa.

Datos:
- Estudiante: ${data.alumno}
- Grado y grupo: ${data.grado}° ${data.grupo}
- Trimestre: ${data.trimestre}
Calificaciones por disciplina:
${detalle}

Devuelve EXACTAMENTE este JSON:
{
  "promedio": number,
  "valoracion_global": string,
  "fortalezas": string[],
  "areas_de_oportunidad": string[],
  "por_campo_formativo": [{ "campo_formativo": string, "nivel": "Destacado"|"Satisfactorio"|"En proceso"|"Requiere apoyo", "comentario": string }],
  "recomendaciones_docente": string[],
  "recomendaciones_familia": string[],
  "comentario_boleta": string
}
Reglas: lenguaje profesional, formativo y en español de México; nada de juicios negativos sobre la persona; el comentario_boleta debe tener entre 60 y 90 palabras.`;

    return llamarGemini(prompt);
  });
