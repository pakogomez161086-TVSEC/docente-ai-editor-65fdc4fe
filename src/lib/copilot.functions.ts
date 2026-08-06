import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { llamarGeminiTexto } from "./ia.server";

const SYSTEM_COPILOT = `Eres el Copiloto Pedagógico de DocentePRO Telesecundaria, experto en la Nueva Escuela Mexicana y en Telesecundaria Fase 6.
Ayudas al docente a resolver dudas sobre la NEM, campos formativos, PDA, saberes, metodologías por proyectos, evaluación formativa, rúbricas, listas de cotejo, reactivos y adecuaciones.
Responde en español de México, con lenguaje claro y profesional, en formato breve con viñetas cuando ayude.
Nunca inventes contenidos oficiales que no puedas sustentar: si no tienes el dato exacto del programa sintético, dilo y ofrece una propuesta claramente marcada como sugerencia.`;

export const copilotoResponder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        mensajes: z
          .array(
            z.object({
              rol: z.enum(["user", "assistant"]),
              texto: z.string().min(1).max(6000),
            }),
          )
          .min(1)
          .max(24),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const historial = data.mensajes.map((m) => ({
      role: m.rol as "user" | "assistant",
      content: m.texto,
    }));
    const respuesta = await llamarGeminiTexto(historial, SYSTEM_COPILOT);
    return { respuesta };
  });
