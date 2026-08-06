import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos de Aula — DocentePRO Telesecundaria" },
      {
        name: "description",
        content:
          "Organiza tus proyectos de aula por grado, tomo, campo formativo y disciplina alineados a la NEM.",
      },
      { property: "og:title", content: "Proyectos de Aula — DocentePRO Telesecundaria" },
      { property: "og:description", content: "Proyectos parciales de aula y proyectos académicos por tomo." },
    ],
  }),
  component: ProyectosPage,
});

type Proyecto = {
  id: string;
  grado: number;
  tomo: number;
  trimestre: number | null;
  campo_formativo: string;
  disciplina: string | null;
  ppa: string;
  proyecto_academico: string | null;
  producto_integrador: string | null;
  pda: string[];
  saberes: string[];
  estado: string;
};

function ProyectosPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [grado, setGrado] = useState("1");
  const [tomo, setTomo] = useState("1");
  const [abierto, setAbierto] = useState(false);

  const campos = useQuery({
    queryKey: ["campos-formativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campos_formativos")
        .select("id, nombre, slug, color, disciplinas(id, nombre)")
        .order("orden");
      if (error) throw error;
      return data;
    },
  });

  const proyectos = useQuery({
    queryKey: ["proyectos", grado, tomo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos_aula")
        .select("*")
        .eq("grado", Number(grado))
        .eq("tomo", Number(tomo))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Proyecto[];
    },
  });

  const crear = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Sesión no disponible");
      const payload = {
        user_id: user.id,
        grado: Number(grado),
        tomo: Number(tomo),
        trimestre: Number(form.get("trimestre") ?? 1),
        campo_formativo: String(form.get("campo_formativo") ?? ""),
        disciplina: String(form.get("disciplina") ?? "") || null,
        ppa: String(form.get("ppa") ?? ""),
        proyecto_academico: String(form.get("proyecto_academico") ?? "") || null,
        producto_integrador: String(form.get("producto_integrador") ?? "") || null,
        pda: String(form.get("pda") ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        saberes: String(form.get("saberes") ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const { error } = await supabase.from("proyectos_aula").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proyecto creado");
      setAbierto(false);
      void queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proyectos_aula").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proyecto eliminado");
      void queryClient.invalidateQueries({ queryKey: ["proyectos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [campoSel, setCampoSel] = useState<string>("");
  const disciplinas = campos.data?.find((c) => c.nombre === campoSel)?.disciplinas ?? [];

  return (
    <DashboardShell titulo="Proyectos de Aula" subtitulo="Grado · Tomo · Campo formativo · Disciplina">
      <section className="flex flex-wrap items-center gap-3">
        <Tabs value={grado} onValueChange={setGrado}>
          <TabsList>
            {["1", "2", "3"].map((g) => (
              <TabsTrigger key={g} value={g}>
                {g}° grado
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={tomo} onValueChange={setTomo}>
          <TabsList>
            {["1", "2", "3"].map((t) => (
              <TabsTrigger key={t} value={t}>
                Tomo {["I", "II", "III"][Number(t) - 1]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-1 h-4 w-4" />
              Nuevo proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo proyecto de aula</DialogTitle>
              <DialogDescription>
                {grado}° grado · Tomo {["I", "II", "III"][Number(tomo) - 1]}
              </DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                crear.mutate(new FormData(e.currentTarget));
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Trimestre</Label>
                  <Select name="trimestre" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3"].map((t) => (
                        <SelectItem key={t} value={t}>
                          Trimestre {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Campo formativo</Label>
                  <Select name="campo_formativo" value={campoSel} onValueChange={setCampoSel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {(campos.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.nombre}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Disciplina</Label>
                <Select name="disciplina" disabled={!campoSel}>
                  <SelectTrigger>
                    <SelectValue placeholder={campoSel ? "Selecciona" : "Elige un campo primero"} />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplinas.map((d) => (
                      <SelectItem key={d.id} value={d.nombre}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ppa">Proyecto Parcial de Aula</Label>
                <Input id="ppa" name="ppa" required placeholder="Nombre del PPA del libro de proyectos" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proyecto_academico">Proyecto académico</Label>
                <Input id="proyecto_academico" name="proyecto_academico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producto_integrador">Producto integrador</Label>
                <Input id="producto_integrador" name="producto_integrador" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pda">PDA (uno por línea)</Label>
                  <Textarea id="pda" name="pda" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saberes">Saberes (uno por línea)</Label>
                  <Textarea id="saberes" name="saberes" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={crear.isPending}>
                  {crear.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Guardar proyecto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      {proyectos.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando proyectos…</p>
      ) : (proyectos.data ?? []).length === 0 ? (
        <Card className="border-dashed shadow-soft">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <p className="font-semibold">Sin proyectos en este tomo</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crea tu primer proyecto de aula o impórtalo desde IA Pedagógica analizando el libro de
              proyectos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(proyectos.data ?? []).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <Card className="h-full border-border/70 shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{p.campo_formativo}</Badge>
                    {p.disciplina ? <Badge variant="outline">{p.disciplina}</Badge> : null}
                    {p.trimestre ? <Badge variant="outline">T{p.trimestre}</Badge> : null}
                  </div>
                  <CardTitle className="pt-2 text-base leading-snug">{p.ppa}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {p.proyecto_academico ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Proyecto académico: </span>
                      {p.proyecto_academico}
                    </p>
                  ) : null}
                  {p.producto_integrador ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Producto: </span>
                      {p.producto_integrador}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {p.pda.length} PDA · {p.saberes.length} saberes
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" className="flex-1">
                      <a href={`/planeaciones?proyecto=${p.id}`}>
                        <Sparkles className="mr-1 h-4 w-4" />
                        Generar planeación
                      </a>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Eliminar proyecto"
                      onClick={() => eliminar.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
