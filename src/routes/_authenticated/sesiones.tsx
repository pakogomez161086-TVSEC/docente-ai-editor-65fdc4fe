import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { generarSesiones } from "@/lib/ia.functions";

export const Route = createFileRoute("/_authenticated/sesiones")({
  validateSearch: z.object({ planeacion: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sesiones de clase — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Genera 5, 10, 15 o 20 sesiones con inicio, desarrollo, cierre, materiales e instrumentos.",
      },
      { property: "og:title", content: "Sesiones de clase — DocentePRO" },
      { property: "og:description", content: "Sesiones progresivas listas para el aula de Telesecundaria." },
    ],
  }),
  component: SesionesPage,
});

type Sesion = {
  id: string;
  numero: number;
  titulo: string;
  tiempo: string | null;
  inicio: string | null;
  desarrollo: string | null;
  cierre: string | null;
  evaluacion: string | null;
  materiales: string[];
  instrumentos: string[];
  planeacion_id: string | null;
};

function SesionesPage() {
  const { planeacion } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const generar = useServerFn(generarSesiones);
  const [planSel, setPlanSel] = useState(planeacion ?? "");
  const [cantidad, setCantidad] = useState("10");

  const planeaciones = useQuery({
    queryKey: ["planeaciones-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planeaciones")
        .select("id, titulo, proposito, campo_formativo, disciplina, grado, metodologia")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sesiones = useQuery({
    queryKey: ["sesiones", planSel],
    queryFn: async () => {
      let q = supabase.from("sesiones").select("*").order("numero");
      if (planSel) q = q.eq("planeacion_id", planSel);
      const { data, error } = await q;
      if (error) throw error;
      return data as Sesion[];
    },
  });

  const crear = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sesión no disponible");
      const pl = planeaciones.data?.find((p) => p.id === planSel);
      if (!pl) throw new Error("Selecciona una planeación");

      const res = (await generar({
        data: {
          titulo: pl.titulo,
          cantidad: Number(cantidad) as 5 | 10 | 15 | 20,
          contexto: `Grado ${pl.grado ?? "?"}. Campo formativo: ${pl.campo_formativo ?? "-"}. Disciplina: ${
            pl.disciplina ?? "-"
          }. Metodología: ${pl.metodologia ?? "-"}. Propósito: ${pl.proposito ?? "-"}`,
        },
      })) as { sesiones?: Omit<Sesion, "id" | "planeacion_id">[] };

      const filas = (res.sesiones ?? []).map((s, i) => ({
        user_id: user.id,
        planeacion_id: pl.id,
        numero: s.numero ?? i + 1,
        titulo: s.titulo ?? `Sesión ${i + 1}`,
        tiempo: s.tiempo ?? null,
        inicio: s.inicio ?? null,
        desarrollo: s.desarrollo ?? null,
        cierre: s.cierre ?? null,
        evaluacion: s.evaluacion ?? null,
        materiales: s.materiales ?? [],
        instrumentos: s.instrumentos ?? [],
      }));
      if (filas.length === 0) throw new Error("La IA no devolvió sesiones");

      await supabase.from("sesiones").delete().eq("planeacion_id", pl.id);
      const { error } = await supabase.from("sesiones").insert(filas);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sesiones generadas");
      void queryClient.invalidateQueries({ queryKey: ["sesiones"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell titulo="Sesiones" subtitulo="Secuencias didácticas por planeación">
      <Card className="border-border/70 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Generar sesiones con IA</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={planSel} onValueChange={setPlanSel}>
            <SelectTrigger className="sm:max-w-md">
              <SelectValue placeholder="Selecciona una planeación" />
            </SelectTrigger>
            <SelectContent>
              {(planeaciones.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cantidad} onValueChange={setCantidad}>
            <SelectTrigger className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["5", "10", "15", "20"].map((n) => (
                <SelectItem key={n} value={n}>
                  {n} sesiones
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => crear.mutate()} disabled={!planSel || crear.isPending}>
            {crear.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            Generar
          </Button>
        </CardContent>
      </Card>

      {(sesiones.data ?? []).length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <p className="font-semibold">Sin sesiones todavía</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Selecciona una planeación y elige cuántas sesiones necesitas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {(sesiones.data ?? []).map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <Card className="h-full border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Sesión {s.numero}</Badge>
                    {s.tiempo ? <Badge variant="outline">{s.tiempo}</Badge> : null}
                  </div>
                  <CardTitle className="pt-2 text-base leading-snug">{s.titulo}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {s.inicio ? (
                    <p>
                      <span className="font-medium text-foreground">Inicio: </span>
                      {s.inicio}
                    </p>
                  ) : null}
                  {s.desarrollo ? (
                    <p>
                      <span className="font-medium text-foreground">Desarrollo: </span>
                      {s.desarrollo}
                    </p>
                  ) : null}
                  {s.cierre ? (
                    <p>
                      <span className="font-medium text-foreground">Cierre: </span>
                      {s.cierre}
                    </p>
                  ) : null}
                  {s.evaluacion ? (
                    <p>
                      <span className="font-medium text-foreground">Evaluación: </span>
                      {s.evaluacion}
                    </p>
                  ) : null}
                  {s.materiales.length > 0 ? (
                    <p className="text-xs">Materiales: {s.materiales.join(", ")}</p>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
