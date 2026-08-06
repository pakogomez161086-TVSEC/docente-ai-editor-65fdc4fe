import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { llamarGemini } from "./ia.server";

export const generarExamen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        grado: z.number().int().min(1).max(3),
        trimestre: z.number().int().min(1).max(3),
        campo_formativo: z.string().min(1),
        disciplina: z.string().min(1),
        pda: z.string().optional(),
        dificultad: z.enum(["baja", "media", "alta", "mixta"]),
        num_reactivos: z.number().int().min(5).max(40),
        tipos: z.array(z.enum(["opcion_multiple", "falso_verdadero", "relacion", "abierta"])).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Genera un examen para Telesecundaria Fase 6 alineado a la Nueva Escuela Mexicana.

Contexto:
- Grado: ${data.grado}°
- Trimestre: ${data.trimestre}
- Campo formativo: ${data.campo_formativo}
- Disciplina: ${data.disciplina}
- PDA / contenido: ${data.pda ?? "derívalo del campo formativo y la disciplina"}
- Nivel de dificultad: ${data.dificultad}
- Número exacto de reactivos: ${data.num_reactivos}
- Tipos de reactivo permitidos: ${data.tipos.join(", ")}

Devuelve EXACTAMENTE este JSON:
{
  "titulo": string,
  "instrucciones": string,
  "reactivos": [{ "numero": number, "tipo": "opcion_multiple"|"falso_verdadero"|"relacion"|"abierta", "enunciado": string, "opciones": string[], "dificultad": "baja"|"media"|"alta", "pda": string, "aprendizaje": string }],
  "clave_respuestas": [{ "numero": number, "respuesta": string, "justificacion": string }]
}
Reglas: exactamente ${data.num_reactivos} reactivos numerados de 1 a ${data.num_reactivos}; los reactivos abiertos llevan "opciones": []; la clave debe tener una entrada por cada reactivo.`;

    return llamarGemini(prompt);
  });
