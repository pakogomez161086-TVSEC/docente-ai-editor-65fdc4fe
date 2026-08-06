import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CreditCard, LayoutTemplate, Lock, Save, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PIN_ADMIN = "admin123";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Panel de administración: usuarios, roles, estados de cuenta, planes, suscripciones y landing page editable.",
      },
      { property: "og:title", content: "Administración — DocentePRO" },
      { property: "og:description", content: "Gestiona cuentas, roles, planes, suscripciones y la landing." },
    ],
  }),
  component: AdminPage,
});

type EstadoCuenta = "activo" | "inactivo" | "suspendido";
type Rol = "administrador" | "docente" | "suscriptor";

function AdminPage() {
  const { isAdmin } = useAuth();
  const [pin, setPin] = useState("");
  const [desbloqueado, setDesbloqueado] = useState(false);
  const queryClient = useQueryClient();

  const docentes = useQuery({
    queryKey: ["admin-docentes"],
    enabled: isAdmin && desbloqueado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre_completo, escuela, cct, grado, estado, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const roles = useQuery({
    queryKey: ["admin-roles"],
    enabled: isAdmin && desbloqueado,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const planes = useQuery({
    queryKey: ["admin-planes"],
    enabled: desbloqueado,
    queryFn: async () => {
      const { data, error } = await supabase.from("planes").select("*").order("orden");
      if (error) throw error;
      return data;
    },
  });

  const suscripciones = useQuery({
    queryKey: ["admin-suscripciones"],
    enabled: isAdmin && desbloqueado,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suscripciones")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const landing = useQuery({
    queryKey: ["admin-landing"],
    enabled: desbloqueado,
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_config").select("*").order("orden");
      if (error) throw error;
      return data;
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoCuenta }) => {
      const { error } = await supabase.from("profiles").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      void queryClient.invalidateQueries({ queryKey: ["admin-docentes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alternarRol = useMutation({
    mutationFn: async ({ userId, rol, activar }: { userId: string; rol: Rol; activar: boolean }) => {
      if (activar) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: rol });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", rol);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Roles actualizados");
      void queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarPlan = useMutation({
    mutationFn: async (plan: {
      id: string;
      precio: number;
      precio_promocion: number | null;
      promocion_activa: boolean;
      activo: boolean;
    }) => {
      const { id, ...campos } = plan;
      const { error } = await supabase.from("planes").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plan actualizado");
      void queryClient.invalidateQueries({ queryKey: ["admin-planes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const guardarLanding = useMutation({
    mutationFn: async ({ id, contenido, activo }: { id: string; contenido: string; activo: boolean }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(contenido);
      } catch {
        throw new Error("El contenido debe ser JSON válido.");
      }
      const { error } = await supabase
        .from("landing_config")
        .update({ contenido: parsed as never, activo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Landing actualizada");
      void queryClient.invalidateQueries({ queryKey: ["admin-landing"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isAdmin) {
    return (
      <DashboardShell titulo="Administración" subtitulo="Acceso restringido">
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <p className="font-semibold">Solo administradores</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Este panel está reservado para la cuenta administradora de DocentePRO.
            </p>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  if (!desbloqueado) {
    return (
      <DashboardShell titulo="Administración" subtitulo="Verificación de seguridad">
        <Card className="mx-auto max-w-sm border-border/70 shadow-soft">
          <CardHeader className="items-center text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <CardTitle className="text-base">Ingresa tu PIN de administrador</CardTitle>
            <CardDescription>El panel de administración está protegido con PIN.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (pin === PIN_ADMIN) {
                  setDesbloqueado(true);
                  toast.success("Panel desbloqueado");
                } else {
                  toast.error("PIN incorrecto");
                }
              }}
            >
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                autoComplete="off"
              />
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const rolesPorUsuario = new Map<string, Rol[]>();
  for (const r of roles.data ?? []) {
    const lista = rolesPorUsuario.get(r.user_id) ?? [];
    lista.push(r.role as Rol);
    rolesPorUsuario.set(r.user_id, lista);
  }

  return (
    <DashboardShell titulo="Administración" subtitulo="Usuarios, suscripciones y landing page">
      <div className="grid gap-4 sm:grid-cols-4">
        <Metrica etiqueta="Docentes registrados" valor={docentes.data?.length ?? 0} />
        <Metrica
          etiqueta="Cuentas activas"
          valor={(docentes.data ?? []).filter((d) => d.estado === "activo").length}
        />
        <Metrica etiqueta="Suscripciones" valor={suscripciones.data?.length ?? 0} />
        <Metrica etiqueta="Planes" valor={planes.data?.length ?? 0} />
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Users className="mr-1.5 h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="suscripciones">
            <CreditCard className="mr-1.5 h-4 w-4" />
            Suscripciones
          </TabsTrigger>
          <TabsTrigger value="landing">
            <LayoutTemplate className="mr-1.5 h-4 w-4" />
            Landing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="pt-4">
          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Gestión de usuarios</CardTitle>
              <CardDescription>Modifica estados de cuenta y roles de cada docente.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Escuela</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Roles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(docentes.data ?? []).map((d) => {
                    const rolesUsuario = rolesPorUsuario.get(d.id) ?? [];
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.nombre_completo ?? "—"}</TableCell>
                        <TableCell>{d.email}</TableCell>
                        <TableCell>{d.escuela ?? "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={d.estado}
                            onValueChange={(v) =>
                              cambiarEstado.mutate({ id: d.id, estado: v as EstadoCuenta })
                            }
                          >
                            <SelectTrigger className="h-8 w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="activo">Activo</SelectItem>
                              <SelectItem value="inactivo">Inactivo</SelectItem>
                              <SelectItem value="suspendido">Suspendido</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {(["administrador", "docente", "suscriptor"] as Rol[]).map((rol) => {
                              const activo = rolesUsuario.includes(rol);
                              return (
                                <Button
                                  key={rol}
                                  size="sm"
                                  variant={activo ? "secondary" : "outline"}
                                  className="h-7 text-xs capitalize"
                                  onClick={() =>
                                    alternarRol.mutate({ userId: d.id, rol, activar: !activo })
                                  }
                                >
                                  {rol}
                                </Button>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suscripciones" className="space-y-4 pt-4">
          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Planes y promociones</CardTitle>
              <CardDescription>Ajusta precios, activa promociones y publica planes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {(planes.data ?? []).map((p) => (
                <EditorPlan key={p.id} plan={p} onGuardar={(v) => guardarPlan.mutate(v)} />
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Suscripciones activas</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {(suscripciones.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Todavía no hay suscripciones registradas.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Inicia</TableHead>
                      <TableHead>Termina</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(suscripciones.data ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.user_id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          <Badge variant={s.estado === "activa" ? "secondary" : "outline"}>{s.estado}</Badge>
                        </TableCell>
                        <TableCell>{s.monto != null ? `$${s.monto}` : "—"}</TableCell>
                        <TableCell>{new Date(s.inicia_en).toLocaleDateString("es-MX")}</TableCell>
                        <TableCell>
                          {s.termina_en ? new Date(s.termina_en).toLocaleDateString("es-MX") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="pt-4">
          <Card className="border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Landing page editable</CardTitle>
              <CardDescription>
                Edita el contenido de cada sección (slider, beneficios, testimonios, avisos) y publícalo al
                instante.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(landing.data ?? []).map((s) => (
                <EditorSeccion
                  key={s.id}
                  seccion={s}
                  onGuardar={(contenido, activo) =>
                    guardarLanding.mutate({ id: s.id, contenido, activo })
                  }
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Metrica({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <Card className="border-border/70 shadow-soft">
      <CardHeader className="pb-2">
        <CardDescription>{etiqueta}</CardDescription>
        <CardTitle className="font-display text-3xl">{valor}</CardTitle>
      </CardHeader>
    </Card>
  );
}

type PlanRow = {
  id: string;
  nombre: string;
  periodo: string;
  precio: number;
  precio_promocion: number | null;
  promocion_activa: boolean;
  activo: boolean;
  beneficios: string[];
};

function EditorPlan({
  plan,
  onGuardar,
}: {
  plan: PlanRow;
  onGuardar: (v: {
    id: string;
    precio: number;
    precio_promocion: number | null;
    promocion_activa: boolean;
    activo: boolean;
  }) => void;
}) {
  const [precio, setPrecio] = useState(String(plan.precio));
  const [promo, setPromo] = useState(plan.precio_promocion != null ? String(plan.precio_promocion) : "");
  const [promoActiva, setPromoActiva] = useState(plan.promocion_activa);
  const [activo, setActivo] = useState(plan.activo);

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{plan.nombre}</p>
        <Badge variant="outline">{plan.periodo}</Badge>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Precio</Label>
        <Input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Precio promocional</Label>
        <Input value={promo} onChange={(e) => setPromo(e.target.value)} inputMode="decimal" placeholder="—" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Promoción activa</span>
        <Switch checked={promoActiva} onCheckedChange={setPromoActiva} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Plan publicado</span>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={() =>
          onGuardar({
            id: plan.id,
            precio: Number(precio) || 0,
            precio_promocion: promo.trim() === "" ? null : Number(promo),
            promocion_activa: promoActiva,
            activo,
          })
        }
      >
        <Save className="mr-1 h-4 w-4" />
        Guardar
      </Button>
    </div>
  );
}

function EditorSeccion({
  seccion,
  onGuardar,
}: {
  seccion: { id: string; seccion: string; contenido: unknown; activo: boolean };
  onGuardar: (contenido: string, activo: boolean) => void;
}) {
  const [contenido, setContenido] = useState(JSON.stringify(seccion.contenido, null, 2));
  const [activo, setActivo] = useState(seccion.activo);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold capitalize">{seccion.seccion.replace(/_/g, " ")}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Visible</span>
          <Switch checked={activo} onCheckedChange={setActivo} />
        </div>
      </div>
      <Textarea
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        rows={8}
        className="font-mono text-xs"
      />
      <Button size="sm" onClick={() => onGuardar(contenido, activo)}>
        <Save className="mr-1 h-4 w-4" />
        Publicar cambios
      </Button>
    </div>
  );
}
