import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { encode as arrayBufferToBase64 } from 'base64-arraybuffer';

/* ─── CSV Export ────────────────────────────────────── */

export function exportToCSV(
  columns: { key: string; label: string }[],
  data: Record<string, unknown>[],
  filename: string,
) {
  const BOM = '\uFEFF';
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns
      .map(c => {
        const v = row[c.key];
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(','),
  );
  const csv = BOM + [header, ...rows].join('\r\n');
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

/* ─── PNG Export (high-resolution) ──────────────────── */

export async function exportToPNG(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const scale = window.devicePixelRatio >= 2 ? 2 : 3;
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: scale,
    backgroundColor: '#020617',
    cacheBust: true,
    filter: (node: HTMLElement) => {
      // exclude interactive export buttons from the capture
      return !node?.classList?.contains?.('export-exclude');
    },
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/* ─── Font Loading ──────────────────────────────────── */

let _fontBase64Cache: string | null = null;

/**
 * Fetch Inter.ttf from /fonts/ and return base64 string.
 * Caches after first call for performance.
 */
async function loadInterFontBase64(): Promise<string> {
  if (_fontBase64Cache) return _fontBase64Cache;

  const response = await fetch('/fonts/Inter.ttf');
  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  _fontBase64Cache = arrayBufferToBase64(buffer);
  return _fontBase64Cache;
}

/**
 * Register the Inter font into a jsPDF instance.
 */
async function registerInterFont(pdf: jsPDF): Promise<void> {
  const base64 = await loadInterFontBase64();

  pdf.addFileToVFS('Inter-Regular.ttf', base64);
  pdf.addFont('Inter-Regular.ttf', 'Inter', 'normal', undefined, 'Identity-H');
}

/**
 * Set the Inter font on the PDF (must be registered first).
 */
function useInterFont(pdf: jsPDF, style: 'normal' | 'bold' = 'normal', size = 12) {
  // jsPDF doesn't distinguish bold if we only have one weight registered,
  // so we always use 'normal' style but adjust size for emphasis.
  pdf.setFont('Inter', style);
  pdf.setFontSize(size);
}

/* ─── Chart Capture ─────────────────────────────────── */

/**
 * Wait for next animation frame + a short delay to ensure
 * all charts have finished their render cycle.
 */
function waitForRender(ms = 100): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      setTimeout(resolve, ms);
    });
  });
}

/**
 * Validate that a DOM element is suitable for capture.
 */
function isElementCapturable(el: HTMLElement): boolean {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Capture a DOM element as a PNG data URL using html2canvas.
 * Retries once on failure after waiting for a re-render.
 */
async function captureElementAsImage(
  el: HTMLElement,
  sectionTitle: string,
): Promise<string | null> {
  // First attempt
  const result = await _tryCapture(el, sectionTitle, 1);
  if (result) return result;

  // Retry after waiting for render
  console.warn(`[PDF Export] Retry capture for "${sectionTitle}" after waiting…`);
  await waitForRender(300);
  return _tryCapture(el, sectionTitle, 2);
}

async function _tryCapture(
  el: HTMLElement,
  sectionTitle: string,
  attempt: number,
): Promise<string | null> {
  if (!isElementCapturable(el)) {
    console.warn(
      `[PDF Export] Element for "${sectionTitle}" has zero dimensions (attempt ${attempt}). Skipping capture.`,
    );
    return null;
  }

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#0f172a',
      scale: 2,
      useCORS: true,
      logging: false,
      removeContainer: true,
      allowTaint: true,
    });

    // Validate the resulting canvas
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn(`[PDF Export] Canvas for "${sectionTitle}" is empty (attempt ${attempt}).`);
      return null;
    }

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error(`[PDF Export] html2canvas failed for "${sectionTitle}" (attempt ${attempt}):`, err);
    return null;
  }
}

/* ─── PDF Export (structured, multi-page) ───────────── */

export interface PDFMetadata {
  title: string;
  subtitle?: string;
  university?: string;
  year?: number | string;
  faculty?: string;
  generatedAt: string;
  kpis: { label: string; value: string }[];
  sections: { title: string; element: HTMLElement }[];
  t: (key: string) => string;
}

export async function exportToPDF(meta: PDFMetadata): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 15;
  const contentW = W - margin * 2;

  // ── Register and activate Inter font for Unicode support ──
  try {
    await registerInterFont(pdf);
  } catch (err) {
    console.error('[PDF Export] Failed to load Inter font, falling back to Helvetica:', err);
    // If font loading fails, we still proceed but Cyrillic may not render
  }

  // Wait for charts to fully render before capturing
  await waitForRender(200);

  /* ── Pre-capture all chart sections ─────── */
  // Capture charts BEFORE generating PDF pages to ensure DOM is stable
  const capturedSections: { title: string; imageData: string | null }[] = [];

  for (const section of meta.sections) {
    const imageData = await captureElementAsImage(section.element, section.title);
    capturedSections.push({ title: section.title, imageData });
  }

  /* ── Title Page ────────────────────── */
  // Dark background
  pdf.setFillColor(2, 6, 23); // #020617
  pdf.rect(0, 0, W, H, 'F');

  // Accent bar
  pdf.setFillColor(45, 212, 191); // #2dd4bf
  pdf.rect(0, 0, W, 4, 'F');

  // Title
  useInterFont(pdf, 'normal', 28);
  pdf.setTextColor(241, 245, 249); // slate-100
  pdf.text(meta.title, margin, 50);

  if (meta.subtitle) {
    useInterFont(pdf, 'normal', 12);
    pdf.setTextColor(148, 163, 184); // slate-400
    const subtitleLines = pdf.splitTextToSize(meta.subtitle, contentW);
    pdf.text(subtitleLines, margin, 62);
  }

  // Metadata block
  let metaY = 85;
  useInterFont(pdf, 'normal', 10);
  pdf.setTextColor(148, 163, 184);

  const metaLines: string[] = [];
  if (meta.university) metaLines.push(`${meta.t('university')}: ${meta.university}`);
  if (meta.year) metaLines.push(`${meta.t('col_year')}: ${meta.year}`);
  if (meta.faculty) metaLines.push(`${meta.t('col_faculty')}: ${meta.faculty}`);
  metaLines.push(`${meta.t('report_generated')}: ${meta.generatedAt}`);

  for (const line of metaLines) {
    pdf.text(line, margin, metaY);
    metaY += 7;
  }

  // Divider
  metaY += 5;
  pdf.setDrawColor(30, 41, 59); // slate-800
  pdf.setLineWidth(0.3);
  pdf.line(margin, metaY, W - margin, metaY);
  metaY += 10;

  /* ── KPI Summary Table ─────────────── */
  if (meta.kpis.length > 0) {
    useInterFont(pdf, 'normal', 14);
    pdf.setTextColor(241, 245, 249);
    pdf.text(meta.t('report_section_overview'), margin, metaY);
    metaY += 10;

    const colW = contentW / 2;
    const rowH = 10;

    for (let i = 0; i < meta.kpis.length; i++) {
      const kpi = meta.kpis[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * colW;
      const y = metaY + row * rowH;

      // KPI card background
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.roundedRect(x, y - 5, colW - 4, rowH - 1, 2, 2, 'F');

      useInterFont(pdf, 'normal', 8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(kpi.label, x + 3, y);

      useInterFont(pdf, 'normal', 11);
      pdf.setTextColor(45, 212, 191);
      pdf.text(kpi.value, x + colW - 8, y, { align: 'right' });
    }
    metaY += Math.ceil(meta.kpis.length / 2) * rowH + 10;
  }

  /* ── Chart Sections (each on new page) ── */
  for (const section of capturedSections) {
    pdf.addPage();

    // Dark background
    pdf.setFillColor(2, 6, 23);
    pdf.rect(0, 0, W, H, 'F');

    // Accent bar
    pdf.setFillColor(45, 212, 191);
    pdf.rect(0, 0, W, 2, 'F');

    // Section title
    useInterFont(pdf, 'normal', 16);
    pdf.setTextColor(241, 245, 249);
    pdf.text(section.title, margin, 20);

    if (section.imageData) {
      // Calculate image dimensions to fit within page
      try {
        const imgProps = pdf.getImageProperties(section.imageData);
        const imgW = contentW;
        const imgH = (imgProps.height / imgProps.width) * imgW;
        const maxH = H - 40; // leave room for header and footer
        const finalH = Math.min(imgH, maxH);

        pdf.addImage(section.imageData, 'PNG', margin, 28, imgW, finalH);
      } catch (err) {
        console.error(`[PDF Export] Failed to add image for "${section.title}":`, err);
        useInterFont(pdf, 'normal', 10);
        pdf.setTextColor(148, 163, 184);
        pdf.text(meta.t('chart_unavailable') || 'Chart could not be rendered.', margin, 35);
      }
    } else {
      // Fallback: chart capture failed
      useInterFont(pdf, 'normal', 10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(meta.t('chart_unavailable') || 'Chart could not be rendered.', margin, 35);
    }
  }

  /* ── Footer on every page ───────────── */
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    useInterFont(pdf, 'normal', 8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(meta.title, margin, H - 8);
    pdf.text(`${i} / ${totalPages}`, W - margin, H - 8, { align: 'right' });
  }

  pdf.save(`${meta.title.toLowerCase().replace(/\s+/g, '-')}-${meta.year || 'all'}.pdf`);
}

/* ─── Helper ────────────────────────────────────────── */

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
