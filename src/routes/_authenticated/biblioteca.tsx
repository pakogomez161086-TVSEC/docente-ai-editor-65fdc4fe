import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Library, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de recursos — DocentePRO Telesecundaria" },
      {
        name: "description",
        content: "Guarda enlaces, videos, formatos e instrumentos por campo formativo, disciplina y grado.",
      },
      { property: "og:title", content: "Biblioteca de recursos — DocentePRO" },
      { property: "og:description", content: "Todos tus recursos didácticos en un solo lugar." },
    ],
  }),
  component: BibliotecaPage,
});

const TIPOS = ["enlace", "video", "documento", "formato", "instrumento", "imagen"];

function BibliotecaPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("todos");

  const recursos = useQuery({
    queryKey: ["biblioteca"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("biblioteca_recursos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const crear = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Sesión no disponible");
      const { error } = await supabase.from("biblioteca_recursos").insert({
        user_id: user.id,
        titulo: String(form.get("titulo") ?? ""),
        descripcion: String(form.get("descripcion") ?? "") || null,
        tipo: String(form.get("tipo") ?? "enlace"),
        url: String(form.get("url") ?? "") || null,
        campo_formativo: String(form.get("campo_formativo") ?? "") || null,
        disciplina: String(form.get("disciplina") ?? "") || null,
        grado: form.get("grado") ? Number(form.get("grado")) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recurso agregado");
      setAbierto(false);
      void queryClient.invalidateQueries({ queryKey: ["biblioteca"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("biblioteca_recursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["biblioteca"] }),
  });

  const lista = (recursos.data ?? []).filter((r) => tipoFiltro === "todos" || r.tipo === tipoFiltro);

  return (
    <DashboardShell titulo="Biblioteca" subtitulo="Recursos, formatos e instrumentos">
      <section className="flex flex-wrap items-center gap-3">
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="max-w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-1 h-4 w-4" />
              Nuevo recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar recurso</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                crear.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" name="titulo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Enlace</Label>
                <Input id="url" name="url" type="url" placeholder="https://" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select name="tipo" defaultValue="enlace">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grado">Grado</Label>
                  <Input id="grado" name="grado" type="number" min={1} max={3} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campo_formativo">Campo formativo</Label>
                <Input id="campo_formativo" name="campo_formativo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" name="descripcion" rows={3} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={crear.isPending}>
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      {lista.length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Library className="h-5 w-5" />
            </span>
            <p className="font-semibold">Biblioteca vacía</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Guarda enlaces, videos y formatos que uses con frecuencia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((r) => (
            <Card key={r.id} className="flex h-full flex-col border-border/70 shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{r.tipo}</Badge>
                  {r.grado ? <Badge variant="outline">{r.grado}°</Badge> : null}
                  {r.campo_formativo ? <Badge variant="outline">{r.campo_formativo}</Badge> : null}
                </div>
                <CardTitle className="pt-2 text-base leading-snug">{r.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto space-y-3 text-sm text-muted-foreground">
                {r.descripcion ? <p>{r.descripcion}</p> : null}
                <div className="flex gap-2">
                  {r.url ? (
                    <Button asChild size="sm" variant="secondary" className="flex-1">
                      <a href={r.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Abrir
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar recurso"
                    onClick={() => eliminar.mutate(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
