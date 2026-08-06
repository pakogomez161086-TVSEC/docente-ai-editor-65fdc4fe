CREATE TABLE public.examenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  grado INTEGER,
  trimestre INTEGER,
  campo_formativo TEXT,
  disciplina TEXT,
  pda TEXT,
  dificultad TEXT NOT NULL DEFAULT 'media',
  num_reactivos INTEGER NOT NULL DEFAULT 10,
  instrucciones TEXT,
  reactivos JSONB NOT NULL DEFAULT '[]'::jsonb,
  clave_respuestas JSONB NOT NULL DEFAULT '[]'::jsonb,
  generado_por_ia BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.examenes TO authenticated;
GRANT ALL ON public.examenes TO service_role;

ALTER TABLE public.examenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Docentes gestionan sus examenes"
ON public.examenes FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Administradores ven todos los examenes"
ON public.examenes FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER trg_examenes_updated
BEFORE UPDATE ON public.examenes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_examenes_user ON public.examenes(user_id, created_at DESC);