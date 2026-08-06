import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Users } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Panel de administración: docentes registrados, planes y suscripciones de la plataforma.",
      },
      { property: "og:title", content: "Administración — DocentePRO" },
      { property: "og:description", content: "Gestiona cuentas, planes y suscripciones." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = useAuth();

  const docentes = useQuery({
    queryKey: ["admin-docentes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre_completo, escuela, cct, grado, estado, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const planes = useQuery({
    queryKey: ["admin-planes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("planes").select("*").order("orden");
      if (error) throw error;
      return data;
    },
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

  return (
    <DashboardShell titulo="Administración" subtitulo="Docentes, planes y suscripciones">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Docentes registrados</CardDescription>
            <CardTitle className="font-display text-3xl">{docentes.data?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Cuentas activas</CardDescription>
            <CardTitle className="font-display text-3xl">
              {(docentes.data ?? []).filter((d) => d.estado === "activo").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/70 shadow-soft">
          <CardHeader className="pb-2">
            <CardDescription>Planes disponibles</CardDescription>
            <CardTitle className="font-display text-3xl">{planes.data?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Docentes
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Escuela</TableHead>
                <TableHead>Grado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(docentes.data ?? []).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nombre_completo ?? "—"}</TableCell>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>{d.escuela ?? "—"}</TableCell>
                  <TableCell>{d.grado ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={d.estado === "activo" ? "secondary" : "outline"}>{d.estado}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Planes y precios</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(planes.data ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{p.nombre}</p>
                {p.promocion_activa ? <Badge>Promoción</Badge> : null}
              </div>
              <p className="pt-1 font-display text-2xl">
                ${p.promocion_activa && p.precio_promocion != null ? p.precio_promocion : p.precio}
                <span className="text-sm text-muted-foreground"> / {p.periodo}</span>
              </p>
              <ul className="space-y-1 pt-2 text-sm text-muted-foreground">
                {p.beneficios.map((b, i) => (
                  <li key={i}>• {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
