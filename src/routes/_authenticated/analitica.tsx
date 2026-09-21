import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analitica")({
  head: () => ({
    meta: [
      { title: "Analítica educativa — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Gráficos de desempeño por grupo, campo formativo, disciplina y trimestre para tus estudiantes.",
      },
      { property: "og:title", content: "Analítica educativa — DocentePRO" },
      { property: "og:description", content: "Visualiza el avance formativo de cada grupo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnaliticaPage,
});

const COLORES = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function AnaliticaPage() {
  const [grupoSel, setGrupoSel] = useState("todos");

  const grupos = useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("*").order("grado");
      if (error) throw error;
      return data;
    },
  });

  const alumnos = useQuery({
    queryKey: ["analitica-alumnos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alumnos").select("id, nombre_completo, grupo_id");
      if (error) throw error;
      return data;
    },
  });

  const calificaciones = useQuery({
    queryKey: ["analitica-calificaciones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calificaciones").select("*");
      if (error) throw error;
      return data;
    },
  });

  const datos = useMemo(() => {
    const listaAlumnos = alumnos.data ?? [];
    const idsGrupo =
      grupoSel === "todos"
        ? new Set(listaAlumnos.map((a) => a.id))
        : new Set(listaAlumnos.filter((a) => a.grupo_id === grupoSel).map((a) => a.id));
    const filas = (calificaciones.data ?? []).filter((c) => idsGrupo.has(c.alumno_id));

    const promedio = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
    const agrupar = (clave: "campo_formativo" | "disciplina") => {
      const mapa = new Map<string, number[]>();
      filas.forEach((c) => {
        const k = String(c[clave]);
        mapa.set(k, [...(mapa.get(k) ?? []), Number(c.calificacion)]);
      });
      return [...mapa.entries()].map(([nombre, valores]) => ({
        nombre,
        promedio: Number(promedio(valores).toFixed(1)),
      }));
    };

    const porTrimestre = [1, 2, 3].map((t) => ({
      nombre: `T${t}`,
      promedio: Number(
        promedio(filas.filter((c) => c.trimestre === t).map((c) => Number(c.calificacion))).toFixed(1),
      ),
    }));

    const rangos = [
      { nombre: "Destacado (9–10)", valor: filas.filter((c) => Number(c.calificacion) >= 9).length },
      {
        nombre: "Satisfactorio (8–8.9)",
        valor: filas.filter((c) => Number(c.calificacion) >= 8 && Number(c.calificacion) < 9).length,
      },
      {
        nombre: "En proceso (7–7.9)",
        valor: filas.filter((c) => Number(c.calificacion) >= 7 && Number(c.calificacion) < 8).length,
      },
      { nombre: "Requiere apoyo (<7)", valor: filas.filter((c) => Number(c.calificacion) < 7).length },
    ].filter((r) => r.valor > 0);

    return {
      total: filas.length,
      estudiantes: idsGrupo.size,
      general: Number(promedio(filas.map((c) => Number(c.calificacion))).toFixed(1)),
      campos: agrupar("campo_formativo"),
      disciplinas: agrupar("disciplina"),
      porTrimestre,
      rangos,
    };
  }, [alumnos.data, calificaciones.data, grupoSel]);

  const vacio = datos.total === 0;

  return (
    <DashboardShell
      titulo="Analítica educativa"
      subtitulo="Desempeño por grupo, campo formativo, disciplina y trimestre"
      acciones={
        <Select value={grupoSel} onValueChange={setGrupoSel}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los grupos</SelectItem>
            {(grupos.data ?? []).map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { etiqueta: "Promedio general", valor: vacio ? "—" : datos.general },
          { etiqueta: "Estudiantes", valor: datos.estudiantes },
          { etiqueta: "Registros de evaluación", valor: datos.total },
        ].map((k) => (
          <Card key={k.etiqueta}>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.etiqueta}</p>
              <p className="mt-2 text-3xl font-bold">{k.valor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {vacio ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Registra estudiantes y calificaciones en “Grupos” para ver tus gráficos de desempeño.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promedio por campo formativo</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.campos}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="nombre" fontSize={11} />
                  <YAxis domain={[5, 10]} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promedio por disciplina</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datos.disciplinas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis type="number" domain={[5, 10]} fontSize={11} />
                  <YAxis type="category" dataKey="nombre" width={110} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Avance por trimestre</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datos.porTrimestre}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="nombre" fontSize={11} />
                  <YAxis domain={[5, 10]} fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="promedio" stroke="hsl(var(--primary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución por nivel de logro</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={datos.rangos} dataKey="valor" nameKey="nombre" outerRadius={90} label>
                    {datos.rangos.map((r, i) => (
                      <Cell key={r.nombre} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
