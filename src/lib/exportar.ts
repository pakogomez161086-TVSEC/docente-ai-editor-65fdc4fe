export type SeccionExport = {
  titulo: string;
  parrafos?: (string | null | undefined)[];
  lista?: (string | null | undefined)[];
  tabla?: { encabezados: string[]; filas: (string | number | null | undefined)[][] } | undefined;
};

export type DocumentoExport = {
  titulo: string;
  subtitulo?: string;
  metadatos?: { etiqueta: string; valor: string | number | null | undefined }[];
  secciones: SeccionExport[];
};

const escapar = (valor: unknown) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");

function renderSeccion(seccion: SeccionExport): string {
  const parrafos = (seccion.parrafos ?? []).filter(Boolean);
  const lista = (seccion.lista ?? []).filter(Boolean);
  const tabla = seccion.tabla;
  if (!parrafos.length && !lista.length && !tabla) return "";

  const cuerpo = [
    ...parrafos.map((p) => `<p>${escapar(p)}</p>`),
    lista.length ? `<ul>${lista.map((l) => `<li>${escapar(l)}</li>`).join("")}</ul>` : "",
    tabla
      ? `<table><thead><tr>${tabla.encabezados
          .map((h) => `<th>${escapar(h)}</th>`)
          .join("")}</tr></thead><tbody>${tabla.filas
          .map((f) => `<tr>${f.map((c) => `<td>${escapar(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`
      : "",
  ].join("");

  return `<section><h2>${escapar(seccion.titulo)}</h2>${cuerpo}</section>`;
}

export function construirHTML(doc: DocumentoExport): string {
  const metadatos = (doc.metadatos ?? []).filter((m) => m.valor !== null && m.valor !== undefined && m.valor !== "");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8" /><title>${escapar(doc.titulo)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "Segoe UI", Calibri, Arial, sans-serif; color: #16233a; font-size: 11.5pt; line-height: 1.5; }
  header { border-bottom: 3px solid #1d4ed8; padding-bottom: 10px; margin-bottom: 18px; }
  .marca { font-size: 15pt; font-weight: 700; color: #1d4ed8; letter-spacing: -0.3px; }
  .marca span { color: #f59e0b; }
  .sub { font-size: 9.5pt; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
  h1 { font-size: 17pt; margin: 14px 0 4px; color: #0f2557; }
  .subtitulo { color: #475569; font-size: 10.5pt; margin: 0 0 10px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .meta span { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; border-radius: 999px; padding: 3px 10px; font-size: 9pt; }
  section { margin-bottom: 16px; page-break-inside: avoid; }
  h2 { font-size: 11.5pt; text-transform: uppercase; letter-spacing: .6px; color: #1d4ed8; border-left: 4px solid #10b981; padding-left: 8px; margin: 0 0 6px; }
  p { margin: 0 0 6px; }
  ul { margin: 0 0 6px 18px; padding: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt; }
  th { background: #1d4ed8; color: #fff; text-align: left; padding: 6px 8px; }
  td { border: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  footer { margin-top: 22px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 8.5pt; color: #64748b; text-align: center; }
</style></head>
<body>
<header>
  <div class="marca">Docente<span>PRO</span> · Telesecundaria</div>
  <div class="sub">Nueva Escuela Mexicana · Fase 6 · Ciclo 2026–2027</div>
</header>
<h1>${escapar(doc.titulo)}</h1>
${doc.subtitulo ? `<p class="subtitulo">${escapar(doc.subtitulo)}</p>` : ""}
${metadatos.length ? `<div class="meta">${metadatos.map((m) => `<span>${escapar(m.etiqueta)}: ${escapar(m.valor)}</span>`).join("")}</div>` : ""}
${doc.secciones.map(renderSeccion).join("")}
<footer>Generado con DocentePRO Telesecundaria — ${new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}</footer>
</body></html>`;
}

const nombreArchivo = (titulo: string) =>
  titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "documento";

export function exportarPDF(doc: DocumentoExport) {
  const ventana = window.open("", "_blank", "width=900,height=1000");
  if (!ventana) throw new Error("El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.");
  ventana.document.write(construirHTML(doc));
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 400);
}

export function exportarWord(doc: DocumentoExport) {
  const html = construirHTML(doc);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo(doc.titulo)}.doc`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
