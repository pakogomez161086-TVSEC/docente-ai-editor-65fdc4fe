import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { llamarGemini } from "./ia.server";

const ContextoProyecto = z.object({
  grado: z.number().int().min(1).max(3),
  tomo: z.number().int().min(1).max(3),
  trimestre: z.number().int().min(1).max(3).optional(),
  campo_formativo: z.string().min(1),
  disciplina: z.string().optional(),
  ppa: z.string().min(1),
  proyecto_academico: z.string().optional(),
  producto_integrador: z.string().optional(),
});

export const generarPlaneacion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ContextoProyecto.parse(input))
  .handler(async ({ data }) => {
    const prompt = `Genera una planeación didáctica completa de Telesecundaria Fase 6 alineada a la Nueva Escuela Mexicana.

Contexto:
- Grado: ${data.grado}°
- Tomo: ${data.tomo}
- Trimestre: ${data.trimestre ?? "por determinar"}
- Campo formativo: ${data.campo_formativo}
- Disciplina: ${data.disciplina ?? "integrada"}
- Proyecto Parcial de Aula (PPA): ${data.ppa}
- Proyecto académico: ${data.proyecto_academico ?? "derívalo del PPA"}
- Producto integrador: ${data.producto_integrador ?? "propón uno pertinente"}

Devuelve EXACTAMENTE este JSON:
{
  "titulo": string,
  "metodologia": string,
  "proposito": string,
  "inicio": string,
  "desarrollo": string,
  "cierre": string,
  "etapas": [{ "numero": number, "nombre": string, "descripcion": string, "actividades": string[] }],
  "evaluacion": { "diagnostica": string, "formativa": string, "sumativa": string },
  "rubricas": [{ "criterio": string, "excelente": string, "satisfactorio": string, "enProceso": string }],
  "listas_cotejo": [{ "indicador": string }],
  "productos": string[],
  "materiales": string[],
  "adecuaciones": string,
  "inclusion": string,
  "transversalidad": string,
  "pda": string[],
  "saberes": string[]
}
Las "etapas" deben ser las 7 etapas metodológicas del proyecto (metodología por proyectos comunitarios de la NEM).`;

    return llamarGemini(prompt);
  });

export const generarSesiones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        titulo: z.string().min(1),
        cantidad: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
        contexto: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Genera ${data.cantidad} sesiones de clase para la planeación "${data.titulo}".
Contexto pedagógico: ${data.contexto}

Devuelve EXACTAMENTE este JSON:
{ "sesiones": [{ "numero": number, "titulo": string, "tiempo": string, "inicio": string, "desarrollo": string, "cierre": string, "materiales": string[], "evaluacion": string, "instrumentos": string[] }] }
Deben ser exactamente ${data.cantidad} sesiones, numeradas de 1 a ${data.cantidad}, con progresión pedagógica coherente.`;

    return llamarGemini(prompt);
  });

export const analizarDocumento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ nombre: z.string().min(1), contenido: z.string().min(20).max(400_000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const prompt = `Analiza el siguiente documento oficial ("${data.nombre}") y organiza su contenido curricular.

--- INICIO DEL DOCUMENTO ---
${data.contenido.slice(0, 380_000)}
--- FIN DEL DOCUMENTO ---

Devuelve EXACTAMENTE este JSON:
{ "registros": [{ "grado": number|null, "tomo": number|null, "trimestre": number|null, "campo_formativo": string, "disciplina": string, "ppa": string, "proyecto_academico": string, "producto_integrador": string, "pda": string[], "saberes": string[], "secuencia": string[], "instrumentos": string[], "evaluaciones": string[], "productos": string[] }], "resumen": string }
Si un dato no aparece en el documento, usa null o una cadena vacía. No inventes contenidos oficiales.`;

    return llamarGemini(prompt);
  });
