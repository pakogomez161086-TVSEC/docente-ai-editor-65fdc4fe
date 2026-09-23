import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileDown, FileText, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { generarInformePedagogico } from "@/lib/boletas.functions";
import { exportarPDF, exportarWord, type DocumentoExport } from "@/lib/exportar";

export const Route = createFileRoute("/_authenticated/boletas")({
  head: () => ({
    meta: [
      { title: "Boletas e informes — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Genera boletas e informes pedagógicos trimestrales con comentarios personalizados y expórtalos.",
      },
      { property: "og:title", content: "Boletas e informes — DocentePRO" },
      { property: "og:description", content: "Informes formativos listos para entregar a las familias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BoletasPage,
});

type Informe = {
  promedio?: number;
  valoracion_global?: string;
  fortalezas?: string[];
  areas_de_oportunidad?: string[];
  por_campo_formativo?: { campo_formativo: string; nivel: string; comentario: string }[];
  recomendaciones_docente?: string[];
  recomendaciones_familia?: string[];
  comentario_boleta?: string;
};

function BoletasPage() {
  const generar = useServerFn(generarInformePedagogico);
  const [grupoSel, setGrupoSel] = useState("");
  const [alumnoSel, setAlumnoSel] = useState("");
  const [trimestre, setTrimestre] = useState("1");
  const [informe, setInforme] = useState<Informe | null>(null);

  const grupos = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("*").order("grado");
      if (error) throw error;
      return data;
    },
  });

  const grupoActual = grupoSel || grupos.data?.[0]?.id || "";

  const alumnos = useQuery({
    queryKey: ["alumnos", grupoActual],
    enabled: Boolean(grupoActual),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alumnos")
        .select("*")
        .eq("grupo_id", grupoActual)
        .order("numero_lista", { nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const alumnoActual = (alumnos.data ?? []).find((a) => a.id === alumnoSel) ?? alumnos.data?.[0];
  const grupoInfo = (grupos.data ?? []).find((g) => g.id === grupoActual);

  const calificaciones = useQuery({
    queryKey: ["boleta-calificaciones", alumnoActual?.id, trimestre],
    enabled: Boolean(alumnoActual?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calificaciones")
        .select("*")
        .eq("alumno_id", alumnoActual?.id ?? "")
        .eq("trimestre", Number(trimestre));
      if (error) throw error;
      return data;
    },
  });

  const crearInforme = useMutation({
    mutationFn: async () => {
      const filas = calificaciones.data ?? [];
      if (!alumnoActual || !grupoInfo) throw new Error("Selecciona un grupo y un estudiante");
      if (filas.length === 0) throw new Error("Este estudiante no tiene calificaciones en el trimestre elegido");
      return (await generar({
        data: {
          alumno: alumnoActual.nombre_completo,
          grado: grupoInfo.grado,
          grupo: grupoInfo.nombre,
          trimestre: Number(trimestre),
          calificaciones: filas.map((c) => ({
            disciplina: c.disciplina,
            campo_formativo: c.campo_formativo,
            calificacion: Number(c.calificacion),
            ...(c.observaciones ? { observaciones: c.observaciones } : {}),
          })),
        },
      })) as Informe;
    },
    onSuccess: (data) => {
      setInforme(data);
      toast.success("Informe generado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function documento(): DocumentoExport {
    const filas = calificaciones.data ?? [];
    return {
      titulo: `Boleta e informe pedagógico · ${alumnoActual?.nombre_completo ?? ""}`,
      subtitulo: `Trimestre ${trimestre} · Evaluación formativa · Nueva Escuela Mexicana`,
      metadatos: [
        { etiqueta: "Grado y grupo", valor: `${grupoInfo?.grado ?? ""}° ${grupoInfo?.nombre ?? ""}` },
        { etiqueta: "Ciclo escolar", valor: grupoInfo?.ciclo ?? "2026-2027" },
        { etiqueta: "Promedio", valor: informe?.promedio ?? "" },
        { etiqueta: "Valoración global", valor: informe?.valoracion_global ?? "" },
      ],
      secciones: [
        {
          titulo: "Calificaciones por disciplina",
          tabla: {
            encabezados: ["Campo formativo", "Disciplina", "Calificación", "Observaciones"],
            filas: filas.map((c) => [c.campo_formativo, c.disciplina, c.calificacion, c.observaciones]),
          },
        },
        {
          titulo: "Valoración por campo formativo",
          tabla: {
            encabezados: ["Campo formativo", "Nivel de logro", "Comentario"],
            filas: (informe?.por_campo_formativo ?? []).map((c) => [
              c.campo_formativo,
              c.nivel,
              c.comentario,
            ]),
          },
        },
        { titulo: "Fortalezas", lista: informe?.fortalezas ?? [] },
        { titulo: "Áreas de oportunidad", lista: informe?.areas_de_oportunidad ?? [] },
        { titulo: "Recomendaciones para el docente", lista: informe?.recomendaciones_docente ?? [] },
        { titulo: "Recomendaciones para la familia", lista: informe?.recomendaciones_familia ?? [] },
        { titulo: "Comentario de boleta", parrafos: [informe?.comentario_boleta] },
      ],
    };
  }

  function exportar(tipo: "pdf" | "word") {
    if (!informe) {
      toast.error("Primero genera el informe");
      return;
    }
    try {
      const doc = documento();
      if (tipo === "pdf") exportarPDF(doc);
      else exportarWord(doc);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <DashboardShell
      titulo="Boletas e informes"
      subtitulo="Informes pedagógicos trimestrales con comentarios personalizados"
      acciones={
        <>
          <Button variant="outline" size="sm" onClick={() => exportar("pdf")} disabled={!informe}>
            <FileDown className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportar("word")} disabled={!informe}>
            <FileText className="mr-1 h-4 w-4" /> Word
          </Button>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecciona al estudiante</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Grupo</Label>
            <Select
              value={grupoActual}
              onValueChange={(v) => {
                setGrupoSel(v);
                setAlumnoSel("");
                setInforme(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                {(grupos.data ?? []).map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.nombre} · {g.grado}°
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estudiante</Label>
            <Select
              value={alumnoActual?.id ?? ""}
              onValueChange={(v) => {
                setAlumnoSel(v);
                setInforme(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estudiante" />
              </SelectTrigger>
              <SelectContent>
                {(alumnos.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trimestre</Label>
            <Select
              value={trimestre}
              onValueChange={(v) => {
                setTrimestre(v);
                setInforme(null);
              }}
            >
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
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={() => crearInforme.mutate()}
              disabled={crearInforme.isPending || !alumnoActual}
            >
              {crearInforme.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Generar informe
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Calificaciones del trimestre {trimestre}</CardTitle>
          <Badge variant="secondary">{calificaciones.data?.length ?? 0} registros</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {(calificaciones.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Captura calificaciones en “Grupos” para generar la boleta.
            </p>
          ) : (
            (calificaciones.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
                <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-accent font-bold text-primary">
                  {c.calificacion}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.disciplina}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.campo_formativo}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {informe ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Informe pedagógico · promedio {informe.promedio ?? "—"} · {informe.valoracion_global ?? ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="rounded-xl bg-muted/50 p-4 leading-relaxed">{informe.comentario_boleta}</p>
            <div className="grid gap-5 md:grid-cols-2">
              <Bloque titulo="Fortalezas" items={informe.fortalezas} />
              <Bloque titulo="Áreas de oportunidad" items={informe.areas_de_oportunidad} />
              <Bloque titulo="Recomendaciones para el docente" items={informe.recomendaciones_docente} />
              <Bloque titulo="Recomendaciones para la familia" items={informe.recomendaciones_familia} />
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Valoración por campo formativo</p>
              {(informe.por_campo_formativo ?? []).map((c) => (
                <div key={c.campo_formativo} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{c.campo_formativo}</span>
                    <Badge variant="outline">{c.nivel}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{c.comentario}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}

function Bloque({ titulo, items }: { titulo: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
