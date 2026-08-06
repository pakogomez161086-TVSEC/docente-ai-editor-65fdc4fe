import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda docente — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Registra pendientes, reuniones, guardias, evaluaciones y avisos con prioridad y estado.",
      },
      { property: "og:title", content: "Agenda docente — DocentePRO" },
      { property: "og:description", content: "Organiza tu semana escolar sin perder ningún pendiente." },
    ],
  }),
  component: AgendaPage,
});

type Item = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  fecha: string;
  hora: string | null;
  grupo: string | null;
  prioridad: string;
  estado: string;
};

const CATEGORIAS = ["pendiente", "reunion", "guardia", "evaluacion", "aviso", "actividad"];
const PRIORIDADES = ["baja", "media", "alta"];

function AgendaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filtro, setFiltro] = useState("todos");

  const items = useQuery({
    queryKey: ["agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_items")
        .select("*")
        .order("fecha")
        .order("hora", { nullsFirst: true });
      if (error) throw error;
      return data as Item[];
    },
  });

  const crear = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Sesión no disponible");
      const { error } = await supabase.from("agenda_items").insert({
        user_id: user.id,
        titulo: String(form.get("titulo") ?? ""),
        descripcion: String(form.get("descripcion") ?? "") || null,
        categoria: String(form.get("categoria") ?? "pendiente"),
        fecha: String(form.get("fecha") ?? new Date().toISOString().slice(0, 10)),
        hora: String(form.get("hora") ?? "") || null,
        grupo: String(form.get("grupo") ?? "") || null,
        prioridad: String(form.get("prioridad") ?? "media"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro agregado");
      void queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actualizar = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase.from("agenda_items").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agenda_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  });

  const lista = (items.data ?? []).filter((i) => filtro === "todos" || i.categoria === filtro);

  return (
    <DashboardShell titulo="Agenda docente" subtitulo="Pendientes, reuniones, guardias y evaluaciones">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit border-border/70 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo registro</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                crear.mutate(form);
                e.currentTarget.reset();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" name="titulo" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input id="fecha" name="fecha" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input id="hora" name="hora" type="time" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select name="categoria" defaultValue="pendiente">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select name="prioridad" defaultValue="media">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo</Label>
                <Input id="grupo" name="grupo" placeholder="1° A" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Notas</Label>
                <Textarea id="descripcion" name="descripcion" rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={crear.isPending}>
                {crear.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Agregar a la agenda
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="max-w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              {CATEGORIAS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {lista.length === 0 ? (
            <Card className="border-dashed shadow-soft">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <p className="font-semibold">Tu agenda está vacía</p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {lista.map((i) => (
                <li
                  key={i.id}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{i.categoria}</Badge>
                      <Badge variant={i.prioridad === "alta" ? "destructive" : "outline"}>
                        {i.prioridad}
                      </Badge>
                      {i.grupo ? <Badge variant="outline">{i.grupo}</Badge> : null}
                      <span className="text-xs text-muted-foreground">
                        {i.fecha}
                        {i.hora ? ` · ${i.hora.slice(0, 5)}` : ""}
                      </span>
                    </div>
                    <p
                      className={`pt-2 font-medium ${
                        i.estado === "completado" ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {i.titulo}
                    </p>
                    {i.descripcion ? (
                      <p className="text-sm text-muted-foreground">{i.descripcion}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Marcar completado"
                      onClick={() =>
                        actualizar.mutate({
                          id: i.id,
                          estado: i.estado === "completado" ? "pendiente" : "completado",
                        })
                      }
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Eliminar"
                      onClick={() => eliminar.mutate(i.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
