import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

type Modo = "acceso" | "registro";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { modo: Modo | undefined } => ({
    modo: search['modo'] === "registro" ? "registro" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acceso docente — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Inicia sesión o crea tu cuenta para generar planeaciones NEM en un clic.",
      },
      { property: "og:title", content: "Acceso docente — DocentePRO Telesecundaria" },
      { property: "og:description", content: "Entra a tu panel de planeación didáctica." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { modo } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Modo>(modo === "registro" ? "registro" : "acceso");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  useEffect(() => {
    if (!authLoading && user) void navigate({ to: "/dashboard", replace: true });
  }, [authLoading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "registro") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nombre_completo: nombre },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setEmailEnviado(true);
          toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
          return;
        }
        toast.success("¡Bienvenido a DocentePRO!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error";
      toast.error(
        message.includes("Invalid login credentials")
          ? "Correo o contraseña incorrectos"
          : message.includes("already registered")
            ? "Ese correo ya tiene una cuenta. Inicia sesión."
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("No fue posible entrar con Google. Intenta de nuevo.");
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="gradient-aurora pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <Card className="border-border/70 shadow-lift">
            <CardContent className="p-7">
              {emailEnviado ? (
                <div className="py-6 text-center">
                  <span className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Mail className="h-6 w-6" />
                  </span>
                  <h1 className="text-xl font-bold">Confirma tu correo</h1>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Enviamos un enlace de confirmación a <strong className="text-foreground">{email}</strong>.
                    Ábrelo para activar tu cuenta docente.
                  </p>
                  <Button variant="outline" className="mt-6 w-full" onClick={() => setEmailEnviado(false)}>
                    Usar otro correo
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-center text-xl font-bold">
                    {tab === "registro" ? "Crea tu cuenta docente" : "Bienvenido de vuelta"}
                  </h1>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {tab === "registro"
                      ? "Empieza a planear con la Nueva Escuela Mexicana."
                      : "Accede a tus planeaciones y proyectos."}
                  </p>

                  <Tabs value={tab} onValueChange={(v) => setTab(v as Modo)} className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="acceso">Iniciar sesión</TabsTrigger>
                      <TabsTrigger value="registro">Registrarme</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {tab === "registro" ? (
                      <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre completo</Label>
                        <Input
                          id="nombre"
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Mtra. Adriana Ruiz"
                          required
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="docente@correo.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete={tab === "registro" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        required
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {tab === "registro" ? "Crear cuenta" : "Entrar"}
                    </Button>
                  </form>

                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">o</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={handleGoogle}
                    disabled={loading}
                  >
                    <GoogleIcon />
                    Continuar con Google
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al continuar aceptas el uso responsable de la plataforma conforme a los lineamientos de la NEM.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 2.9c2.3-2.1 3.6-5.2 3.6-8.7Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-4 3.1C3.1 21.3 7.2 24 12 24Z"
      />
      <path fill="#FBBC05" d="M5.1 14.4a7.1 7.1 0 0 1 0-4.8L1.1 6.5a12 12 0 0 0 0 11l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.2 0 3.1 2.7 1.1 6.5l4 3.1c1-2.9 3.7-4.9 6.9-4.9Z"
      />
    </svg>
  );
}