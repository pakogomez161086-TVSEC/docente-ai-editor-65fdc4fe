import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario escolar 2026–2027 — DocentePRO" },
      {
        name: "description",
        content:
          "Consulta periodos de evaluación, consejos técnicos, suspensiones y días festivos del ciclo escolar.",
      },
      { property: "og:title", content: "Calendario escolar 2026–2027 — DocentePRO" },
      { property: "og:description", content: "Fechas oficiales del ciclo escolar de Telesecundaria." },
    ],
  }),
  component: CalendarioPage,
});

const COLOR: Record<string, string> = {
  suspension: "destructive",
  cte: "secondary",
  evaluacion: "default",
  inicio: "default",
  fin: "default",
};

function CalendarioPage() {
  const eventos = useQuery({
    queryKey: ["calendario-escolar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendario_escolar")
        .select("*")
        .order("fecha");
      if (error) throw error;
      return data;
    },
  });

  const meses = (eventos.data ?? []).reduce<Record<string, typeof eventos.data>>((acc, ev) => {
    const key = new Date(`${ev.fecha}T12:00:00`).toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
    acc[key] = [...(acc[key] ?? []), ev];
    return acc;
  }, {});

  return (
    <DashboardShell titulo="Calendario escolar" subtitulo="Ciclo 2026–2027">
      {Object.keys(meses).length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <CalendarRange className="h-5 w-5" />
            </span>
            <p className="font-semibold">Sin fechas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(meses).map(([mes, lista]) => (
            <Card key={mes} className="border-border/70 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">{mes}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(lista ?? []).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 w-10 shrink-0 text-center font-display text-lg font-bold text-primary">
                      {ev.fecha.slice(-2)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{ev.titulo}</p>
                      <Badge
                        variant={
                          (COLOR[ev.tipo] ?? "outline") as "default" | "secondary" | "destructive" | "outline"
                        }
                        className="mt-1"
                      >
                        {ev.tipo}
                      </Badge>
                      {ev.descripcion ? (
                        <p className="pt-1 text-xs text-muted-foreground">{ev.descripcion}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
