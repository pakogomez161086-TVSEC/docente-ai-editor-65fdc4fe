import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { FileDown, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { exportarPDF, exportarWord, type DocumentoExport } from "@/lib/exportar";
import { generarExamen } from "@/lib/examenes.functions";

export const Route = createFileRoute("/_authenticated/examenes")({
  head: () => ({
    meta: [
      { title: "Generador de exámenes — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Crea exámenes con banco de reactivos por grado, disciplina, PDA y nivel de dificultad, con clave de respuestas y exportación a PDF o Word.",
      },
      { property: "og:title", content: "Generador de exámenes — DocentePRO" },
      {
        property: "og:description",
        content: "Reactivos alineados a la NEM con clave de respuestas en un clic.",
      },
    ],
  }),
  component: ExamenesPage,
});

type Reactivo = {
  numero?: number;
  tipo?: string;
  enunciado?: string;
  opciones?: string[];
  dificultad?: string;
  pda?: string;
  aprendizaje?: string;
};
type Clave = { numero?: number; respuesta?: string; justificacion?: string };

const CAMPOS = [
  "Lenguajes",
  "Saberes y Pensamiento Científico",
  "Ética, Naturaleza y Sociedades",
  "De lo Humano y lo Comunitario",
];

const TIPOS = [
  { valor: "opcion_multiple", etiqueta: "Opción múltiple" },
  { valor: "falso_verdadero", etiqueta: "Falso / Verdadero" },
  { valor: "relacion", etiqueta: "Relación de columnas" },
  { valor: "abierta", etiqueta: "Respuesta abierta" },
] as const;

function ExamenesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const crear = useServerFn(generarExamen);

  const [grado, setGrado] = useState("1");
  const [trimestre, setTrimestre] = useState("1");
  const [campo, setCampo] = useState(CAMPOS[0]!);
  const [disciplina, setDisciplina] = useState("");
  const [pda, setPda] = useState("");
  const [dificultad, setDificultad] = useState("media");
  const [cantidad, setCantidad] = useState("10");
  const [tipos, setTipos] = useState<string[]>(["opcion_multiple", "falso_verdadero"]);

  const examenes = useQuery({
    queryKey: ["examenes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("examenes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sesión no disponible.");
      if (!disciplina.trim()) throw new Error("Indica la disciplina o asignatura.");
      if (!tipos.length) throw new Error("Selecciona al menos un tipo de reactivo.");

      const resultado = (await crear({
        data: {
          grado: Number(grado),
          trimestre: Number(trimestre),
          campo_formativo: campo,
          disciplina: disciplina.trim(),
          pda: pda.trim() || undefined,
          dificultad: dificultad as "baja" | "media" | "alta" | "mixta",
          num_reactivos: Number(cantidad),
          tipos: tipos as ("opcion_multiple" | "falso_verdadero" | "relacion" | "abierta")[],
        },
      })) as unknown as {
        titulo?: string;
        instrucciones?: string;
        reactivos?: Reactivo[];
        clave_respuestas?: Clave[];
      };

      const { error } = await supabase.from("examenes").insert({
        user_id: user.id,
        titulo: resultado.titulo ?? `Examen ${campo} ${grado}°`,
        grado: Number(grado),
        trimestre: Number(trimestre),
        campo_formativo: campo,
        disciplina: disciplina.trim(),
        pda: pda.trim() || null,
        dificultad,
        num_reactivos: Number(cantidad),
        instrucciones: resultado.instrucciones ?? null,
        reactivos: resultado.reactivos ?? [],
        clave_respuestas: resultado.clave_respuestas ?? [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Examen generado y guardado");
      void queryClient.invalidateQueries({ queryKey: ["examenes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("examenes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Examen eliminado");
      void queryClient.invalidateQueries({ queryKey: ["examenes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function documento(ex: NonNullable<typeof examenes.data>[number], conClave: boolean): DocumentoExport {
    const reactivos = (ex.reactivos as Reactivo[]) ?? [];
    const clave = (ex.clave_respuestas as Clave[]) ?? [];
    return {
      titulo: ex.titulo,
      subtitulo: `${ex.disciplina ?? ""} · ${ex.campo_formativo ?? ""}`,
      metadatos: [
        { etiqueta: "Grado", valor: ex.grado ? `${ex.grado}°` : null },
        { etiqueta: "Trimestre", valor: ex.trimestre },
        { etiqueta: "Reactivos", valor: reactivos.length },
        { etiqueta: "Dificultad", valor: ex.dificultad },
      ],
      secciones: [
        { titulo: "Instrucciones", parrafos: [ex.instrucciones] },
        {
          titulo: "Reactivos",
          parrafos: reactivos.flatMap((r, i) => [
            `${r.numero ?? i + 1}. ${r.enunciado ?? ""}`,
            ...(r.opciones ?? []).map(
              (o, j) => `    ${String.fromCharCode(97 + j)}) ${o}`,
            ),
          ]),
        },
        ...(conClave
          ? [
              {
                titulo: "Clave de respuestas",
                tabla: {
                  encabezados: ["N.º", "Respuesta", "Justificación"],
                  filas: clave.map((c, i) => [c.numero ?? i + 1, c.respuesta, c.justificacion]),
                },
              } satisfies DocumentoExport["secciones"][number],
            ]
          : []),
      ],
    };
  }

  return (
    <DashboardShell titulo="Generador de exámenes" subtitulo="Banco de reactivos alineado a la NEM">
      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Configura tu examen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Grado</Label>
              <Select value={grado} onValueChange={setGrado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3"].map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}° grado
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trimestre</Label>
              <Select value={trimestre} onValueChange={setTrimestre}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3"].map((t) => (
                    <SelectItem key={t} value={t}>
                      Trimestre {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Campo formativo</Label>
              <Select value={campo} onValueChange={setCampo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Input
                id="disciplina"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                placeholder="Ej. Matemáticas"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pda">PDA o contenido (opcional)</Label>
              <Input
                id="pda"
                value={pda}
                onChange={(e) => setPda(e.target.value)}
                placeholder="Ej. Proporcionalidad directa"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dificultad</Label>
              <Select value={dificultad} onValueChange={setDificultad}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="mixta">Mixta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Número de reactivos</Label>
            <div className="flex flex-wrap gap-2">
              {["5", "10", "15", "20", "30"].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={cantidad === n ? "default" : "outline"}
                  onClick={() => setCantidad(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipos de reactivo</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const activo = tipos.includes(t.valor);
                return (
                  <Button
                    key={t.valor}
                    type="button"
                    size="sm"
                    variant={activo ? "secondary" : "outline"}
                    onClick={() =>
                      setTipos((prev) =>
                        activo ? prev.filter((v) => v !== t.valor) : [...prev, t.valor],
                      )
                    }
                  >
                    {t.etiqueta}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button onClick={() => generar.mutate()} disabled={generar.isPending} className="w-full sm:w-auto">
            {generar.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generar examen completo
          </Button>
        </CardContent>
      </Card>

      {(examenes.data ?? []).length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <p className="font-semibold">Aún no tienes exámenes</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Configura grado, disciplina y dificultad para generar reactivos con clave de respuestas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {(examenes.data ?? []).map((ex, i) => {
            const reactivos = (ex.reactivos as Reactivo[]) ?? [];
            const clave = (ex.clave_respuestas as Clave[]) ?? [];
            return (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
              >
                <AccordionItem value={ex.id} className="rounded-xl border bg-card px-4 shadow-soft">
                  <AccordionTrigger className="text-left">
                    <div className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                      <span className="font-semibold">{ex.titulo}</span>
                      {ex.disciplina ? <Badge variant="secondary">{ex.disciplina}</Badge> : null}
                      {ex.grado ? <Badge variant="outline">{ex.grado}°</Badge> : null}
                      <Badge variant="outline">{reactivos.length} reactivos</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm">
                    {ex.instrucciones ? (
                      <p className="rounded-lg bg-muted/50 p-3 text-muted-foreground">{ex.instrucciones}</p>
                    ) : null}
                    <ol className="space-y-3">
                      {reactivos.map((r, idx) => (
                        <li key={idx} className="rounded-lg border p-3">
                          <p className="font-medium">
                            {r.numero ?? idx + 1}. {r.enunciado}
                          </p>
                          {(r.opciones ?? []).length > 0 ? (
                            <ul className="mt-1 space-y-0.5 text-muted-foreground">
                              {(r.opciones ?? []).map((o, j) => (
                                <li key={j}>
                                  {String.fromCharCode(97 + j)}) {o}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {r.dificultad ? (
                              <Badge variant="outline" className="text-[10px]">
                                {r.dificultad}
                              </Badge>
                            ) : null}
                            {r.pda ? (
                              <Badge variant="secondary" className="text-[10px]">
                                {r.pda}
                              </Badge>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                    {clave.length > 0 ? (
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Clave de respuestas
                        </p>
                        <ul className="space-y-0.5">
                          {clave.map((c, idx) => (
                            <li key={idx}>
                              <span className="font-medium">{c.numero ?? idx + 1}.</span> {c.respuesta}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => exportarPDF(documento(ex, false))}>
                        <FileDown className="mr-1 h-4 w-4" />
                        PDF (alumno)
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportarPDF(documento(ex, true))}>
                        <FileDown className="mr-1 h-4 w-4" />
                        PDF con clave
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportarWord(documento(ex, true))}>
                        <FileDown className="mr-1 h-4 w-4" />
                        Word
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(ex.id)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      )}
    </DashboardShell>
  );
}
