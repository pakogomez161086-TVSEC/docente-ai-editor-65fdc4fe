import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  LogOut,
  NotebookPen,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel docente — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Resumen de planeaciones, proyectos, pendientes y agenda del ciclo escolar.",
      },
      { property: "og:title", content: "Panel docente — DocentePRO Telesecundaria" },
      { property: "og:description", content: "Tu centro de control pedagógico." },
    ],
  }),
  component: Dashboard,
});

const actividad = [
  { mes: "Sep", planeaciones: 4 },
  { mes: "Oct", planeaciones: 9 },
  { mes: "Nov", planeaciones: 7 },
  { mes: "Dic", planeaciones: 12 },
  { mes: "Ene", planeaciones: 15 },
  { mes: "Feb", planeaciones: 11 },
];

const accesos = [
  { title: "Generar planeación", desc: "Secuencia completa en un clic", icon: NotebookPen },
  { title: "Nuevo proyecto de aula", desc: "Elige grado, tomo y campo", icon: BookOpen },
  { title: "Crear sesiones", desc: "5, 10, 15 o 20 sesiones", icon: ClipboardList },
  { title: "Analizar con IA", desc: "Sube libro, programa o guía", icon: Sparkles },
];

const pendientes = [
  { texto: "Entregar planeación del Tomo II a supervisión", fecha: "Vence en 2 días", urgente: true },
  { texto: "Consejo Técnico Escolar", fecha: "Último viernes del mes", urgente: false },
  { texto: "Registrar evaluaciones del segundo trimestre", fecha: "Vence en 9 días", urgente: false },
];

function Dashboard() {
  const { perfil, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const nombre = perfil?.nombre_completo ?? user?.email?.split("@")[0] ?? "Docente";
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  async function cerrarSesion() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { modo: undefined }, replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Panel docente</p>
              <p className="truncate text-xs text-muted-foreground">Ciclo escolar 2026–2027</p>
            </div>
            <ThemeToggle />
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                {iniciales || "DP"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={cerrarSesion} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>

          <main className="flex-1 space-y-6 p-4 sm:p-6">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="gradient-brand relative overflow-hidden rounded-3xl p-6 shadow-lift sm:p-8"
            >
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  {isAdmin ? (
                    <Badge variant="secondary" className="mb-3">
                      Administrador principal
                    </Badge>
                  ) : null}
                  <h1 className="text-2xl font-bold text-brand-foreground sm:text-3xl">
                    Hola, {nombre.split(" ")[0]}
                  </h1>
                  <p className="mt-2 max-w-lg text-sm text-brand-foreground/75">
                    Tienes 3 pendientes esta semana y 2 proyectos en curso. Genera tu siguiente
                    planeación en un clic.
                  </p>
                </div>
                <Button size="lg" variant="secondary" className="shadow-soft">
                  <Plus className="mr-1 h-4 w-4" />
                  Generar planeación completa
                </Button>
              </div>
            </motion.section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Planeaciones generadas", value: "58", delta: "+12 este mes", icon: NotebookPen },
                { label: "Proyectos activos", value: "6", delta: "2 por cerrar", icon: BookOpen },
                { label: "Sesiones creadas", value: "184", delta: "+31 este mes", icon: ClipboardList },
                { label: "Documentos exportados", value: "42", delta: "PDF y Word", icon: FileText },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <Card className="border-border/70 shadow-soft">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                          <s.icon className="h-4 w-4" />
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="mt-4 font-display text-3xl font-extrabold">{s.value}</p>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 shadow-soft lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Actividad del ciclo</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px] pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={actividad} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                      <defs>
                        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis
                        dataKey="mes"
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={32}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-popover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "0.75rem",
                          color: "var(--color-popover-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="planeaciones"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2.5}
                        fill="url(#areaFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-base">Avance por campo formativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { campo: "Lenguajes", valor: 82 },
                    { campo: "Saberes y Pensamiento Científico", valor: 64 },
                    { campo: "Ética, Naturaleza y Sociedades", valor: 47 },
                    { campo: "De lo Humano y lo Comunitario", valor: 35 },
                  ].map((c) => (
                    <div key={c.campo}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="pr-2 font-medium">{c.campo}</span>
                        <span className="text-muted-foreground">{c.valor}%</span>
                      </div>
                      <Progress value={c.valor} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 shadow-soft lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Accesos rápidos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {accesos.map((a) => (
                    <button
                      key={a.title}
                      type="button"
                      className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                        <a.icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{a.title}</span>
                        <span className="block text-xs text-muted-foreground">{a.desc}</span>
                      </span>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-soft">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">Pendientes</CardTitle>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendientes.map((p) => (
                    <div key={p.texto} className="rounded-xl border border-border/70 p-3">
                      <p className="text-sm font-medium leading-snug">{p.texto}</p>
                      <p
                        className={
                          p.urgente
                            ? "mt-1 text-xs font-semibold text-destructive"
                            : "mt-1 text-xs text-muted-foreground"
                        }
                      >
                        {p.fecha}
                      </p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/dashboard">Ver agenda completa</Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}