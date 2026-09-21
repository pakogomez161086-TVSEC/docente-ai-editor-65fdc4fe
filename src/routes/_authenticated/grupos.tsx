import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/grupos")({
  head: () => ({
    meta: [
      { title: "Grupos y estudiantes — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Registra tus grupos, tu lista de estudiantes y las calificaciones por trimestre y disciplina.",
      },
      { property: "og:title", content: "Grupos y estudiantes — DocentePRO" },
      { property: "og:description", content: "Control de listas, tutores y evaluaciones trimestrales." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GruposPage,
});

function GruposPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [grupoSel, setGrupoSel] = useState<string>("");
  const [nuevoGrupo, setNuevoGrupo] = useState(false);
  const [nuevoAlumno, setNuevoAlumno] = useState(false);
  const [calificar, setCalificar] = useState<{ id: string; nombre: string } | null>(null);

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

  const calificaciones = useQuery({
    queryKey: ["calificaciones", grupoActual],
    enabled: Boolean(grupoActual),
    queryFn: async () => {
      const ids = (alumnos.data ?? []).map((a) => a.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("calificaciones").select("*").in("alumno_id", ids);
      if (error) throw error;
      return data;
    },
  });

  const crearGrupo = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Sesión no disponible");
      const { error } = await supabase.from("grupos").insert({
        docente_id: user.id,
        nombre: String(form.get("nombre") ?? ""),
        grado: Number(form.get("grado") ?? 1),
        ciclo: String(form.get("ciclo") ?? "2026-2027"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Grupo creado");
      setNuevoGrupo(false);
      void queryClient.invalidateQueries({ queryKey: ["grupos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const crearAlumno = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Sesión no disponible");
      if (!grupoActual) throw new Error("Primero crea un grupo");
      const lista = form.get("numero_lista");
      const { error } = await supabase.from("alumnos").insert({
        docente_id: user.id,
        grupo_id: grupoActual,
        nombre_completo: String(form.get("nombre_completo") ?? ""),
        numero_lista: lista ? Number(lista) : null,
        tutor: String(form.get("tutor") ?? "") || null,
        contacto_tutor: String(form.get("contacto_tutor") ?? "") || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estudiante agregado");
      setNuevoAlumno(false);
      void queryClient.invalidateQueries({ queryKey: ["alumnos", grupoActual] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminarAlumno = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alumnos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["alumnos", grupoActual] });
      void queryClient.invalidateQueries({ queryKey: ["calificaciones", grupoActual] });
    },
  });

  const guardarCalificacion = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user || !calificar) throw new Error("Selecciona un estudiante");
      const { error } = await supabase.from("calificaciones").upsert(
        {
          docente_id: user.id,
          alumno_id: calificar.id,
          trimestre: Number(form.get("trimestre") ?? 1),
          campo_formativo: String(form.get("campo_formativo") ?? ""),
          disciplina: String(form.get("disciplina") ?? ""),
          calificacion: Number(form.get("calificacion") ?? 10),
          observaciones: String(form.get("observaciones") ?? "") || null,
        },
        { onConflict: "alumno_id,trimestre,disciplina" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Calificación registrada");
      setCalificar(null);
      void queryClient.invalidateQueries({ queryKey: ["calificaciones", grupoActual] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promedioDe = (alumnoId: string) => {
    const filas = (calificaciones.data ?? []).filter((c) => c.alumno_id === alumnoId);
    if (filas.length === 0) return null;
    return (filas.reduce((s, c) => s + Number(c.calificacion), 0) / filas.length).toFixed(1);
  };

  return (
    <DashboardShell
      titulo="Grupos y estudiantes"
      subtitulo="Listas, tutores y evaluación trimestral"
      acciones={
        <Dialog open={nuevoGrupo} onOpenChange={setNuevoGrupo}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" /> Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo grupo</DialogTitle>
            </DialogHeader>
            <form
              id="form-grupo"
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                crearGrupo.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del grupo</Label>
                <Input id="nombre" name="nombre" placeholder="1° A" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="grado">Grado</Label>
                  <Input id="grado" name="grado" type="number" min={1} max={3} defaultValue={1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ciclo">Ciclo</Label>
                  <Input id="ciclo" name="ciclo" defaultValue="2026-2027" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={crearGrupo.isPending}>
                  Crear grupo
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Select value={grupoActual} onValueChange={setGrupoSel}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecciona un grupo" />
          </SelectTrigger>
          <SelectContent>
            {(grupos.data ?? []).map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.nombre} · {g.grado}° · {g.ciclo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={nuevoAlumno} onOpenChange={setNuevoAlumno}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!grupoActual}>
              <Plus className="mr-1 h-4 w-4" /> Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo estudiante</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                crearAlumno.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre completo</Label>
                <Input id="nombre_completo" name="nombre_completo" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="numero_lista">N.º de lista</Label>
                  <Input id="numero_lista" name="numero_lista" type="number" min={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutor">Madre, padre o tutor</Label>
                  <Input id="tutor" name="tutor" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contacto_tutor">Contacto</Label>
                <Input id="contacto_tutor" name="contacto_tutor" placeholder="Teléfono o correo" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={crearAlumno.isPending}>
                  Agregar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Lista del grupo
          </CardTitle>
          <Badge variant="secondary">{alumnos.data?.length ?? 0} estudiantes</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {(alumnos.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay estudiantes en este grupo.
            </p>
          ) : (
            (alumnos.data ?? []).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-primary">
                  {a.numero_lista ?? "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.nombre_completo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.tutor ? `Tutor: ${a.tutor}` : "Sin tutor registrado"}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {promedioDe(a.id) ?? "s/c"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => setCalificar({ id: a.id, nombre: a.nombre_completo })}>
                  Calificar
                </Button>
                <Button size="icon" variant="ghost" onClick={() => eliminarAlumno.mutate(a.id)} aria-label="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(calificar)} onOpenChange={(o) => !o && setCalificar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calificación de {calificar?.nombre}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              guardarCalificacion.mutate(new FormData(e.currentTarget));
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trimestre">Trimestre</Label>
                <Input id="trimestre" name="trimestre" type="number" min={1} max={3} defaultValue={1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calificacion">Calificación (5–10)</Label>
                <Input
                  id="calificacion"
                  name="calificacion"
                  type="number"
                  step="0.1"
                  min={5}
                  max={10}
                  defaultValue={8}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campo_formativo">Campo formativo</Label>
              <Input id="campo_formativo" name="campo_formativo" placeholder="Lenguajes" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <Input id="disciplina" name="disciplina" placeholder="Español" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input id="observaciones" name="observaciones" placeholder="Participación, evidencias…" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={guardarCalificacion.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
