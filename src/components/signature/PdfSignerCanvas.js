"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const DISPLAY_WIDTH = 720;
const DEFAULT_PLACEMENT = { xPct: 0.35, yPct: 0.82, wPct: 0.22 };

const PdfSignerCanvas = forwardRef(function PdfSignerCanvas(
  { fileBytes, signatureUrl },
  ref
) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState({ width: DISPLAY_WIDTH, height: DISPLAY_WIDTH * 1.41 });
  const [placement, setPlacement] = useState(DEFAULT_PLACEMENT);
  const [aspectRatio, setAspectRatio] = useState(0.4);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load the PDF document
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      const doc = await pdfjsLib.getDocument({ data: fileBytes.slice(0) }).promise;
      if (cancelled) return;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setPageIndex(0);
    })();
    return () => { cancelled = true; };
  }, [fileBytes]);

  // Render the current page onto the canvas
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const page = await pdfDoc.getPage(pageIndex + 1);
      const base = page.getViewport({ scale: 1 });
      const scale = DISPLAY_WIDTH / base.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled) return;
      setPageSize({ width: viewport.width, height: viewport.height });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex]);

  useImperativeHandle(ref, () => ({
    getPlacement: () => ({ pageIndex, aspectRatio, ...placement }),
  }), [pageIndex, aspectRatio, placement]);

  function handlePointerDown(e) {
    e.preventDefault();
    const imgRect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - imgRect.left, y: e.clientY - imgRect.top };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sigWidthPx = placement.wPct * rect.width;
    const sigHeightPx = sigWidthPx * aspectRatio;

    let left = e.clientX - rect.left - dragOffset.current.x;
    let top = e.clientY - rect.top - dragOffset.current.y;
    left = Math.max(0, Math.min(left, rect.width - sigWidthPx));
    top = Math.max(0, Math.min(top, rect.height - sigHeightPx));

    setPlacement((p) => ({ ...p, xPct: left / rect.width, yPct: top / rect.height }));
  }

  function handlePointerUp() {
    setDragging(false);
  }

  const sigWidthPx = placement.wPct * pageSize.width;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="relative bg-white border border-slate-200 rounded-lg shadow-sm select-none"
        style={{ width: pageSize.width, height: pageSize.height }}
      >
        <canvas ref={canvasRef} className="block" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        )}

        {!loading && signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Signature"
            draggable={false}
            onLoad={(e) => setAspectRatio(e.target.naturalHeight / e.target.naturalWidth || 0.4)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute cursor-move touch-none drop-shadow-md"
            style={{
              left: placement.xPct * pageSize.width,
              top: placement.yPct * pageSize.height,
              width: sigWidthPx,
              height: "auto",
            }}
          />
        )}
      </div>

      <div className="flex items-center gap-4 w-full max-w-[720px]">
        {numPages > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted shrink-0">
            <button
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page {pageIndex + 1} / {numPages}</span>
            <button
              onClick={() => setPageIndex((p) => Math.min(numPages - 1, p + 1))}
              disabled={pageIndex === numPages - 1}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 flex-1 text-sm text-muted">
          <span className="shrink-0">Taille</span>
          <input
            type="range"
            min={0.1}
            max={0.5}
            step={0.01}
            value={placement.wPct}
            onChange={(e) => setPlacement((p) => ({ ...p, wPct: parseFloat(e.target.value) }))}
            className="flex-1 accent-primary-500"
          />
        </div>
      </div>
    </div>
  );
});

export default PdfSignerCanvas;
