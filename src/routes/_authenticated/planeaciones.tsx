import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { FileDown, Loader2, NotebookPen, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generarPlaneacion } from "@/lib/ia.functions";

export const Route = createFileRoute("/_authenticated/planeaciones")({
  validateSearch: z.object({ proyecto: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Planeaciones didácticas — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Genera planeaciones NEM en un clic: propósito, etapas, evaluación, rúbricas y listas de cotejo.",
      },
      { property: "og:title", content: "Planeaciones didácticas — DocentePRO" },
      { property: "og:description", content: "Planeación didáctica completa alineada a la NEM en un clic." },
    ],
  }),
  component: PlaneacionesPage,
});

type Planeacion = {
  id: string;
  titulo: string;
  grado: number | null;
  tomo: number | null;
  campo_formativo: string | null;
  disciplina: string | null;
  metodologia: string | null;
  proposito: string | null;
  inicio: string | null;
  desarrollo: string | null;
  cierre: string | null;
  etapas: unknown;
  evaluacion: unknown;
  rubricas: unknown;
  materiales: string[];
  productos: string[];
  generada_por_ia: boolean;
};

type Generado = {
  titulo?: string;
  metodologia?: string;
  proposito?: string;
  inicio?: string;
  desarrollo?: string;
  cierre?: string;
  etapas?: unknown;
  evaluacion?: unknown;
  rubricas?: unknown;
  listas_cotejo?: unknown;
  materiales?: string[];
  productos?: string[];
  adecuaciones?: string;
  inclusion?: string;
  transversalidad?: string;
};

function PlaneacionesPage() {
  const { proyecto } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const generar = useServerFn(generarPlaneacion);
  const [proyectoSel, setProyectoSel] = useState<string>(proyecto ?? "");

  const proyectos = useQuery({
    queryKey: ["proyectos-todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos_aula")
        .select("id, grado, tomo, trimestre, campo_formativo, disciplina, ppa, proyecto_academico, producto_integrador")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const planeaciones = useQuery({
    queryKey: ["planeaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planeaciones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Planeacion[];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sesión no disponible");
      const p = proyectos.data?.find((x) => x.id === proyectoSel);
      if (!p) throw new Error("Selecciona un proyecto de aula");

      const res = (await generar({
        data: {
          grado: p.grado,
          tomo: p.tomo,
          trimestre: p.trimestre ?? undefined,
          campo_formativo: p.campo_formativo,
          disciplina: p.disciplina ?? undefined,
          ppa: p.ppa,
          proyecto_academico: p.proyecto_academico ?? undefined,
          producto_integrador: p.producto_integrador ?? undefined,
        },
      })) as Generado;

      const { error } = await supabase.from("planeaciones").insert({
        user_id: user.id,
        proyecto_id: p.id,
        titulo: res.titulo ?? p.ppa,
        grado: p.grado,
        tomo: p.tomo,
        campo_formativo: p.campo_formativo,
        disciplina: p.disciplina,
        metodologia: res.metodologia ?? null,
        proposito: res.proposito ?? null,
        inicio: res.inicio ?? null,
        desarrollo: res.desarrollo ?? null,
        cierre: res.cierre ?? null,
        etapas: (res.etapas ?? []) as never,
        evaluacion: (res.evaluacion ?? {}) as never,
        rubricas: (res.rubricas ?? []) as never,
        listas_cotejo: (res.listas_cotejo ?? []) as never,
        materiales: res.materiales ?? [],
        productos: res.productos ?? [],
        adecuaciones: res.adecuaciones ?? null,
        inclusion: res.inclusion ?? null,
        transversalidad: res.transversalidad ?? null,
        generada_por_ia: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Planeación generada");
      void queryClient.invalidateQueries({ queryKey: ["planeaciones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planeaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["planeaciones"] });
    },
  });

  return (
    <DashboardShell titulo="Planeaciones" subtitulo="Planeación didáctica NEM en un clic">
      <Card className="border-border/70 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generar planeación con IA</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={proyectoSel} onValueChange={setProyectoSel}>
            <SelectTrigger className="sm:max-w-md">
              <SelectValue placeholder="Selecciona un proyecto de aula" />
            </SelectTrigger>
            <SelectContent>
              {(proyectos.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.grado}° T{p.tomo} · {p.ppa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => crear.mutate()} disabled={!proyectoSel || crear.isPending}>
            {crear.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            {crear.isPending ? "Generando…" : "Generar en 1 clic"}
          </Button>
        </CardContent>
      </Card>

      {(planeaciones.data ?? []).length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <NotebookPen className="h-5 w-5" />
            </span>
            <p className="font-semibold">Aún no tienes planeaciones</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Elige un proyecto de aula y genera la planeación completa con propósito, etapas, evaluación y
              rúbricas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {(planeaciones.data ?? []).map((pl, i) => (
            <motion.div
              key={pl.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <AccordionItem value={pl.id} className="rounded-xl border bg-card px-4 shadow-soft">
                <AccordionTrigger className="text-left">
                  <div className="flex flex-1 flex-wrap items-center gap-2 pr-2">
                    <span className="font-semibold">{pl.titulo}</span>
                    {pl.campo_formativo ? <Badge variant="secondary">{pl.campo_formativo}</Badge> : null}
                    {pl.grado ? <Badge variant="outline">{pl.grado}°</Badge> : null}
                    {pl.generada_por_ia ? <Badge>IA</Badge> : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Bloque titulo="Propósito" texto={pl.proposito} />
                  <Bloque titulo="Metodología" texto={pl.metodologia} />
                  <div className="grid gap-3 md:grid-cols-3">
                    <Bloque titulo="Inicio" texto={pl.inicio} />
                    <Bloque titulo="Desarrollo" texto={pl.desarrollo} />
                    <Bloque titulo="Cierre" texto={pl.cierre} />
                  </div>
                  {Array.isArray(pl.etapas) && pl.etapas.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold">Etapas del proyecto</p>
                      <ol className="space-y-1 text-muted-foreground">
                        {(pl.etapas as { numero?: number; nombre?: string; descripcion?: string }[]).map(
                          (e, idx) => (
                            <li key={idx}>
                              <span className="font-medium text-foreground">
                                {e.numero ?? idx + 1}. {e.nombre}
                              </span>{" "}
                              {e.descripcion}
                            </li>
                          ),
                        )}
                      </ol>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm" variant="secondary">
                      <a href={`/sesiones?planeacion=${pl.id}`}>Generar sesiones</a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.print();
                      }}
                    >
                      <FileDown className="mr-1 h-4 w-4" />
                      Exportar / imprimir
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(pl.id)}>
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      )}
    </DashboardShell>
  );
}

function Bloque({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <p className="whitespace-pre-line">{texto}</p>
    </div>
  );
}
