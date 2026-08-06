import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { copilotoResponder } from "@/lib/copilot.functions";

type Mensaje = { rol: "user" | "assistant"; texto: string };

const SUGERENCIAS = [
  "¿Cómo evalúo con lista de cotejo en un proyecto comunitario?",
  "Dame 5 actividades de inicio para Saberes y Pensamiento Científico, 2°",
  "Explica las 7 etapas de la metodología por proyectos de la NEM",
];

const BIENVENIDA: Mensaje = {
  rol: "assistant",
  texto:
    "¡Hola! Soy tu Copiloto Pedagógico. Pregúntame sobre la Nueva Escuela Mexicana, PDA, saberes, rúbricas, reactivos o adecuaciones y te respondo al instante.",
};

export function CopilotIA() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const responder = useServerFn(copilotoResponder);
  const finRef = useRef<HTMLDivElement>(null);

  const enviar = useMutation({
    mutationFn: async (pregunta: string) => {
      const historial = [...mensajes.slice(1), { rol: "user" as const, texto: pregunta }];
      return responder({ data: { mensajes: historial.slice(-12) } });
    },
    onSuccess: (r) => setMensajes((prev) => [...prev, { rol: "assistant", texto: r.respuesta }]),
    onError: (e: Error) => {
      toast.error(e.message);
      setMensajes((prev) => [
        ...prev,
        { rol: "assistant", texto: "No pude responder en este momento. Intenta de nuevo." },
      ]);
    },
  });

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, enviar.isPending]);

  function preguntar(pregunta: string) {
    const limpio = pregunta.trim();
    if (!limpio || enviar.isPending) return;
    setMensajes((prev) => [...prev, { rol: "user", texto: limpio }]);
    setTexto("");
    enviar.mutate(limpio);
  }

  return (
    <>
      <AnimatePresence>
        {abierto ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
          >
            <div className="flex items-center gap-2 border-b bg-primary px-4 py-3 text-primary-foreground">
              <Sparkles className="h-4 w-4" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Copiloto Pedagógico</p>
                <p className="text-xs opacity-80">NEM · Telesecundaria Fase 6</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/15"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar copiloto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {mensajes.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.rol === "user"
                        ? "ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                        : "w-fit max-w-[90%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                    }
                  >
                    {m.texto}
                  </div>
                ))}
                {mensajes.length === 1 ? (
                  <div className="space-y-2 pt-1">
                    {SUGERENCIAS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => preguntar(s)}
                        className="w-full rounded-xl border border-dashed px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
                {enviar.isPending ? (
                  <div className="flex w-fit items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Pensando…
                  </div>
                ) : null}
                <div ref={finRef} />
              </div>
            </ScrollArea>

            <form
              className="flex items-end gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                preguntar(texto);
              }}
            >
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    preguntar(texto);
                  }
                }}
                placeholder="Escribe tu duda pedagógica…"
                rows={1}
                className="max-h-28 min-h-10 resize-none text-sm"
              />
              <Button type="submit" size="icon" disabled={enviar.isPending || !texto.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Button
        onClick={() => setAbierto((v) => !v)}
        size="icon"
        className="fixed bottom-5 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
        aria-label="Abrir Copiloto Pedagógico"
      >
        {abierto ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </Button>
    </>
  );
}
