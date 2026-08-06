import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  Layers,
  Library,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocentePRO Telesecundaria — Planeación NEM con IA" },
      {
        name: "description",
        content:
          "Genera planeaciones didácticas, proyectos de aula, sesiones y agenda docente en un clic. Alineado a la Nueva Escuela Mexicana, Fase 6.",
      },
      { property: "og:title", content: "DocentePRO Telesecundaria — Planeación NEM con IA" },
      {
        property: "og:description",
        content: "La plataforma más completa para docentes de Telesecundaria en México.",
      },
    ],
  }),
  component: Landing,
});

const modulos = [
  {
    icon: Layers,
    title: "Proyectos de Aula",
    text: "1°, 2° y 3° con Tomos I, II y III. Campos formativos, disciplinas, PPA y proyecto académico.",
  },
  {
    icon: Sparkles,
    title: "IA Pedagógica",
    text: "Analiza libros y programas oficiales y organiza automáticamente PDA, saberes y evaluación.",
  },
  {
    icon: NotebookPen,
    title: "Planeación Automática",
    text: "Secuencia completa con las 7 etapas metodológicas, rúbricas y listas de cotejo.",
  },
  {
    icon: ClipboardList,
    title: "Generador de Sesiones",
    text: "5, 10, 15 o 20 sesiones con inicio, desarrollo, cierre, materiales y tiempos.",
  },
  {
    icon: CalendarDays,
    title: "Agenda Docente",
    text: "Bitácora, acuerdos con padres, CTE, asistencia y planeadores semanal y mensual.",
  },
  {
    icon: Library,
    title: "Biblioteca Digital",
    text: "Guías, dosificaciones, programas y materiales por grado, campo y disciplina.",
  },
  {
    icon: FileText,
    title: "Exportación PDF y Word",
    text: "Documentos con formato institucional listos para entregar a supervisión.",
  },
  {
    icon: ShieldCheck,
    title: "Administración segura",
    text: "Roles, suscripciones y control de acceso protegido con PIN administrativo.",
  },
];

const planes = [
  {
    nombre: "Mensual",
    precio: "$149",
    periodo: "/mes",
    destacado: false,
    beneficios: ["Planeación ilimitada", "Generador de sesiones", "Exportación PDF y Word"],
  },
  {
    nombre: "Semestral",
    precio: "$699",
    periodo: "/6 meses",
    destacado: true,
    beneficios: [
      "Todo lo del plan mensual",
      "IA Pedagógica avanzada",
      "Agenda docente completa",
      "Biblioteca y calendario escolar",
    ],
  },
  {
    nombre: "Anual",
    precio: "$1,199",
    periodo: "/año",
    destacado: false,
    beneficios: ["Todo lo del semestral", "Respaldos automáticos", "Soporte prioritario"],
  },
];

const testimonios = [
  {
    nombre: "Mtra. Adriana Ruiz",
    escuela: "Telesecundaria 214, Veracruz",
    texto: "Antes tardaba un fin de semana en planear el trimestre. Ahora lo tengo en una tarde.",
  },
  {
    nombre: "Mtro. Julio Hernández",
    escuela: "Telesecundaria 58, Oaxaca",
    texto: "Las rúbricas y listas de cotejo salen alineadas al PDA. Supervisión quedó encantada.",
  },
  {
    nombre: "Mtra. Karla Domínguez",
    escuela: "Telesecundaria 7, Chiapas",
    texto: "La agenda docente y la bitácora me ahorran todo el papeleo del CTE.",
  },
];

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandLogo size="sm" />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
            <a href="#modulos" className="transition-colors hover:text-foreground">
              Módulos
            </a>
            <a href="#como-funciona" className="transition-colors hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#planes" className="transition-colors hover:text-foreground">
              Planes
            </a>
            <a href="#testimonios" className="transition-colors hover:text-foreground">
              Testimonios
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Ir al panel</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth" search={{ modo: undefined }}>Iniciar sesión</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth" search={{ modo: "registro" }}>
                    Prueba gratis
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="gradient-aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Nueva Escuela Mexicana · Fase 6
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Tu planeación de Telesecundaria,{" "}
              <span className="text-gradient-brand">lista en un clic</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              DocentePRO analiza los libros y programas oficiales con inteligencia artificial y genera
              proyectos de aula, secuencias didácticas, sesiones, rúbricas y tu agenda docente completa.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full shadow-glow sm:w-auto">
                <Link to="/auth" search={{ modo: "registro" }}>
                  Comenzar ahora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#modulos">Ver módulos</a>
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Sin tarjeta · Alineado a Programas Sintéticos, PDA y Libros de Proyectos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="rounded-3xl border bg-card p-2 shadow-lift">
              <div className="gradient-brand rounded-[1.25rem] p-6 sm:p-10">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { k: "3 grados · 9 tomos", v: "Estructura curricular completa" },
                    { k: "7 etapas", v: "Metodología por proyectos" },
                    { k: "PDF + Word", v: "Exportación institucional" },
                  ].map((item) => (
                    <div
                      key={item.k}
                      className="rounded-2xl bg-brand-foreground/10 p-5 text-left backdrop-blur-sm"
                    >
                      <p className="font-display text-lg font-bold text-brand-foreground">{item.k}</p>
                      <p className="mt-1 text-sm text-brand-foreground/75">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="modulos" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Todo lo que un docente necesita</h2>
          <p className="mt-4 text-muted-foreground">
            Una sola plataforma para planear, evaluar, documentar y organizar el ciclo escolar.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modulos.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
            >
              <Card className="h-full border-border/70 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="border-y bg-surface-elevated/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Tres pasos, cero trabajo repetitivo</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Elige grado y tomo",
                d: "Selecciona 1°, 2° o 3°, el tomo y el campo formativo. La estructura oficial ya está cargada.",
              },
              {
                n: "02",
                t: "Deja trabajar a la IA",
                d: "DocentePRO identifica el PPA, el proyecto académico, los PDA y los saberes disciplinares.",
              },
              {
                n: "03",
                t: "Descarga y entrega",
                d: "Planeación, sesiones, rúbricas y productos listos en PDF y Word con tu formato institucional.",
              },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border bg-card p-7 shadow-soft">
                <span className="font-display text-5xl font-extrabold text-primary/15">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Planes para cada docente</h2>
          <p className="mt-4 text-muted-foreground">Cancela cuando quieras. Precios en pesos mexicanos.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {planes.map((p) => (
            <Card
              key={p.nombre}
              className={
                p.destacado
                  ? "relative border-primary/40 shadow-glow lg:-translate-y-3"
                  : "border-border/70 shadow-soft"
              }
            >
              <CardContent className="p-7">
                {p.destacado ? (
                  <Badge className="mb-4 rounded-full">Más elegido</Badge>
                ) : (
                  <div className="mb-4 h-[22px]" aria-hidden />
                )}
                <h3 className="text-lg font-bold">{p.nombre}</h3>
                <p className="mt-3">
                  <span className="font-display text-4xl font-extrabold">{p.precio}</span>
                  <span className="text-sm text-muted-foreground">{p.periodo}</span>
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.beneficios.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-accent" />
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={p.destacado ? "default" : "outline"}
                  className="mt-7 w-full"
                  size="lg"
                >
                  <Link to="/auth" search={{ modo: "registro" }}>
                    Elegir {p.nombre}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="testimonios" className="border-t bg-surface-elevated/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Docentes que ya recuperaron su tiempo</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonios.map((t) => (
              <Card key={t.nombre} className="border-border/70 shadow-soft">
                <CardContent className="p-7">
                  <p className="text-sm leading-relaxed">“{t.texto}”</p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
                      <Users className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{t.nombre}</p>
                      <p className="text-xs text-muted-foreground">{t.escuela}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="gradient-brand relative overflow-hidden rounded-3xl px-8 py-16 text-center shadow-lift">
          <BookOpenCheck className="mx-auto mb-6 h-10 w-10 text-brand-foreground/80" />
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold text-brand-foreground sm:text-4xl">
            Empieza hoy tu próxima planeación
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-foreground/75">
            Únete a los docentes de Telesecundaria que planean con inteligencia artificial.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link to="/auth" search={{ modo: "registro" }}>
              Crear mi cuenta
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
          <BrandLogo size="sm" />
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} DocentePRO Telesecundaria · Alineado a la Nueva Escuela Mexicana
          </p>
        </div>
      </footer>
    </div>
  );
}
