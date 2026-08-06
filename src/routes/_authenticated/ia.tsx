import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { analizarDocumento } from "@/lib/ia.functions";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => ({
    meta: [
      { title: "IA Pedagógica — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Analiza libros de proyectos y programas sintéticos para extraer PPA, PDA, saberes e instrumentos.",
      },
      { property: "og:title", content: "IA Pedagógica — DocentePRO" },
      { property: "og:description", content: "Convierte documentos oficiales en base de conocimiento curricular." },
    ],
  }),
  component: IAPage,
});

type Registro = {
  grado: number | null;
  tomo: number | null;
  trimestre: number | null;
  campo_formativo: string;
  disciplina: string;
  ppa: string;
  proyecto_academico: string;
  producto_integrador: string;
  pda: string[];
  saberes: string[];
  secuencia: string[];
  instrumentos: string[];
  evaluaciones: string[];
  productos: string[];
};

function IAPage() {
  const analizar = useServerFn(analizarDocumento);
  const inputRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("Documento pegado");
  const [resultado, setResultado] = useState<{ registros: Registro[]; resumen: string } | null>(null);

  const procesar = useMutation({
    mutationFn: async () => {
      const res = (await analizar({ data: { nombre, contenido: texto } })) as {
        registros?: Registro[];
        resumen?: string;
      };
      return { registros: res.registros ?? [], resumen: res.resumen ?? "" };
    },
    onSuccess: (data) => {
      setResultado(data);
      toast.success(`Se identificaron ${data.registros.length} registros curriculares`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      if (!resultado || resultado.registros.length === 0) throw new Error("Nada que guardar");
      const filas = resultado.registros.map((r) => ({
        grado: r.grado,
        tomo: r.tomo,
        trimestre: r.trimestre,
        campo_formativo: r.campo_formativo || null,
        disciplina: r.disciplina || null,
        ppa: r.ppa || null,
        proyecto_academico: r.proyecto_academico || null,
        pda: r.pda ?? [],
        saberes: r.saberes ?? [],
        productos: r.productos ?? [],
        etapas: (r.secuencia ?? []) as never,
        instrumentos: (r.instrumentos ?? []) as never,
        evaluaciones: (r.evaluaciones ?? []) as never,
        fuente: nombre,
      }));
      const { error } = await supabase.from("base_conocimiento").insert(filas);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Base de conocimiento actualizada"),
    onError: (e: Error) => toast.error(e.message),
  });

  async function leerArchivo(file: File) {
    setNombre(file.name);
    const contenido = await file.text();
    setTexto(contenido);
    toast.success(`${file.name} cargado (${Math.round(contenido.length / 1000)} mil caracteres)`);
  }

  return (
    <DashboardShell titulo="IA Pedagógica" subtitulo="Analiza documentos oficiales y organiza el currículo">
      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Cargar documento</CardTitle>
          <CardDescription>
            Sube o pega el contenido de libros de proyectos, programa sintético o materiales oficiales (.txt,
            .md, .csv). La IA extrae PPA, proyecto académico, PDA, saberes, secuencia, instrumentos y
            productos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void leerArchivo(f);
              }}
            />
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              <Upload className="mr-1 h-4 w-4" />
              Seleccionar archivo
            </Button>
            <Badge variant="outline" className="self-center">
              <FileText className="mr-1 h-3 w-3" />
              {nombre}
            </Badge>
          </div>
          <Textarea
            rows={10}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pega aquí el contenido del documento oficial…"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => procesar.mutate()} disabled={texto.trim().length < 20 || procesar.isPending}>
              {procesar.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Analizar con IA
            </Button>
            {resultado ? (
              <Button variant="outline" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                Guardar en base de conocimiento
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {resultado ? (
        <Card className="border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Resultado del análisis</CardTitle>
            <CardDescription>{resultado.resumen}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resultado.registros.map((r, i) => (
              <div key={i} className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {r.grado ? <Badge variant="secondary">{r.grado}°</Badge> : null}
                  {r.tomo ? <Badge variant="outline">Tomo {r.tomo}</Badge> : null}
                  {r.campo_formativo ? <Badge variant="outline">{r.campo_formativo}</Badge> : null}
                  {r.disciplina ? <Badge variant="outline">{r.disciplina}</Badge> : null}
                </div>
                <p className="pt-2 font-semibold">{r.ppa}</p>
                {r.proyecto_academico ? (
                  <p className="text-muted-foreground">Proyecto académico: {r.proyecto_academico}</p>
                ) : null}
                <p className="pt-1 text-xs text-muted-foreground">
                  {r.pda?.length ?? 0} PDA · {r.saberes?.length ?? 0} saberes · {r.instrumentos?.length ?? 0}{" "}
                  instrumentos
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
