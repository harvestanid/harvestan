"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AgentResult = {
  agent: string;
  ok: boolean;
  hasil?: string;
  error?: string;
  meta?: any;
  html?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  judul?: string;
  catatan?: string;
};

type MultiPanel = {
  id: string;
  label: string;
  ok: boolean;
  agents: string[];
  alasan: string;
  rencana: string;
  error?: string;
  latencyMs: number;
};

type JudgeResult = {
  ok: boolean;
  pilihan: string;
  alasan: string;
  rencanaFinal: string;
  error?: string;
};

type Hasil = {
  ok: boolean;
  log_id?: string;
  perintah: string;
  rencana: string;
  hasil: AgentResult[];
  multi?: boolean;
  panels?: MultiPanel[];
  judge?: JudgeResult;
};

type LogItem = {
  id: string;
  perintah: string;
  rencana: string;
  hasil: AgentResult[];
  mode: string;
  feedback: string | null;
  created_at: string;
};

const CONTOH_PERINTAH = [
  "Bikin 3 konten TikTok tentang cara hitung bagi hasil tani",
  "Strategi marketing 30 hari untuk dapetin 100 user pertama",
  "Brainstorm 5 ide fitur baru untuk petani cabai",
  "Bikin content calendar seminggu untuk TikTok & Instagram",
  "Bikin infografis tentang kalkulator pupuk presisi Harvestan",
];

const AGENT_LABEL: Record<string, { icon: string; label: string }> = {
  "content-creator": { icon: "✍️", label: "Content Creator" },
  "marketing-strategist": { icon: "📊", label: "Marketing Strategist" },
  "idea-innovator": { icon: "💡", label: "Idea Innovator" },
  "social-media-manager": { icon: "📱", label: "Social Media Manager" },
  "image-creator": { icon: "🎨", label: "Image Creator" },
};

const markdownComponents = {
  table: ({ children }: any) => (
    <div className="table-wrapper">
      <table>{children}</table>
    </div>
  ),
};

// ============================================================
// Iframe Infographic (responsif)
// ============================================================
function IframeInfographic({
  html,
  width,
  height,
  iframeRef,
}: {
  html: string;
  width: number;
  height: number;
  iframeRef: (el: HTMLIFrameElement | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const newScale = Math.min(1, containerWidth / width);
      setScale(newScale);
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width]);

  const scaledHeight = height * scale;

  const srcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  html, body { margin: 0; padding: 0; background: #ffffff; overflow: hidden; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  return (
    <div ref={containerRef} className="w-full">
      <div
        style={{
          width: "100%",
          height: `${scaledHeight}px`,
          position: "relative",
          overflow: "hidden",
          borderRadius: "16px",
          border: "2px solid #2c5e2e",
          background: "#ffffff",
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          title="Infografis"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            border: "none",
            position: "absolute",
            top: 0,
            left: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}

export function AgentsKlien() {
  const [perintah, setPerintah] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [refineMode, setRefineMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [exporting, setExporting] = useState(false);

  // Multi-orchestrator toggle (global, 1a)
  const [multiMode, setMultiMode] = useState(false);

  const iframeRefs = useRef<Record<number, HTMLIFrameElement | null>>({});
  const hasilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/agents/log");
      const json = await res.json();
      if (res.ok) setLogs(json.logs || []);
    } catch (err) {
      console.error("Load logs error:", err);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleJalankan(opts?: {
    mode?: "normal" | "refine";
    feedback?: string;
    hasilSebelumnya?: string;
    agentsFilter?: string[];
    logId?: string;
    multi?: boolean;
  }) {
    if (!perintah.trim()) {
      alert("❌ Isi perintah dulu");
      return;
    }

    const useMulti =
      opts?.multi !== undefined ? opts.multi : multiMode;

    // Refine gak support multi (untuk sementara)
    if (useMulti && opts?.mode === "refine") {
      alert("❌ Refine belum support mode multi. Matikan toggle dulu.");
      return;
    }

    setLoading(true);
    if (!opts?.mode || opts.mode === "normal") {
      setHasil(null);
    }
    setError(null);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perintah: perintah.trim(),
          mode: opts?.mode || "normal",
          feedback: opts?.feedback || "",
          hasil_sebelumnya: opts?.hasilSebelumnya || "",
          agents_filter: opts?.agentsFilter || undefined,
          log_id: opts?.logId || null,
          multi: useMulti,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal jalankan agent");
        return;
      }

      setHasil(json);
      setRefineMode(false);
      setFeedback("");
      loadLogs();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleRegenerate() {
    if (!hasil) return;
    if (!confirm("🔄 Jalankan ulang dengan perintah yang sama?")) return;

    // Kalau sebelumnya multi, regenerate juga multi
    const wasMulti = hasil.multi === true;

    if (wasMulti) {
      handleJalankan({ mode: "normal", multi: true, logId: hasil.log_id });
      return;
    }

    const agentsFilter = hasil.hasil.map((h) => {
      if (h.agent === "content-creator") return "content-creator";
      if (h.agent === "marketing-strategist") return "marketing";
      if (h.agent === "idea-innovator") return "idea-innovator";
      if (h.agent === "social-media-manager") return "social-media";
      if (h.agent === "image-creator") return "image-creator";
      return "content-creator";
    });

    handleJalankan({ mode: "normal", agentsFilter, logId: hasil.log_id });
  }

  async function handleRefine() {
    if (!hasil || !feedback.trim()) {
      alert("❌ Isi feedback dulu");
      return;
    }

    const hasilGabung = hasil.hasil
      .filter((h) => h.ok && h.hasil)
      .map((h) => `## ${h.agent}\n${h.hasil}`)
      .join("\n\n");

    await handleJalankan({
      mode: "refine",
      feedback: feedback.trim(),
      hasilSebelumnya: hasilGabung,
      logId: hasil.log_id,
      multi: false,
    });
  }

  async function handleExportPNG() {
    if (!hasilRef.current || !hasil) return;
    setExporting(true);

    const node = hasilRef.current;
    const originalWidth = node.style.width;
    const originalMaxWidth = node.style.maxWidth;
    const originalOverflow = node.style.overflow;

    node.style.width = "1280px";
    node.style.maxWidth = "none";
    node.style.overflow = "visible";

    const wrappers = node.querySelectorAll<HTMLElement>(
      ".table-wrapper, .overflow-x-auto, [class*='overflow']"
    );
    const originalWrapperStyles: Array<{ el: HTMLElement; overflow: string; width: string }> = [];
    wrappers.forEach((el) => {
      originalWrapperStyles.push({
        el,
        overflow: el.style.overflow,
        width: el.style.width,
      });
      el.style.overflow = "visible";
      el.style.width = "100%";
    });

    const tables = node.querySelectorAll<HTMLElement>("table");
    const originalTableStyles: Array<{ el: HTMLElement; width: string; minWidth: string }> = [];
    tables.forEach((el) => {
      originalTableStyles.push({
        el,
        width: el.style.width,
        minWidth: el.style.minWidth,
      });
      el.style.width = "100%";
      el.style.minWidth = "0";
    });

    await new Promise((r) => setTimeout(r, 300));

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: 1280,
        height: node.scrollHeight,
        style: {
          width: "1280px",
          maxWidth: "none",
          overflow: "visible",
        },
      });

      const link = document.createElement("a");
      link.download = `harvestan-agents-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("❌ Gagal export: " + (err.message || "Unknown"));
    } finally {
      node.style.width = originalWidth;
      node.style.maxWidth = originalMaxWidth;
      node.style.overflow = originalOverflow;
      originalWrapperStyles.forEach(({ el, overflow, width }) => {
        el.style.overflow = overflow;
        el.style.width = width;
      });
      originalTableStyles.forEach(({ el, width, minWidth }) => {
        el.style.width = width;
        el.style.minWidth = minWidth;
      });
      setExporting(false);
    }
  }

  async function handleDownloadInfographic(index: number, judul: string) {
    const iframe = iframeRefs.current[index];
    if (!iframe) {
      alert("❌ Iframe belum siap");
      return;
    }

    try {
      const doc = iframe.contentDocument;
      if (!doc) {
        alert("❌ Gak bisa akses iframe");
        return;
      }

      const root = doc.body.firstElementChild as HTMLElement;
      if (!root) {
        alert("❌ Konten iframe kosong");
        return;
      }

      const dataUrl = await toPng(root, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: root.offsetWidth,
        height: root.offsetHeight,
      });

      const safeJudul = (judul || "infografis")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

      const link = document.createElement("a");
      link.download = `harvestan-${safeJudul || "infografis"}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert("❌ Gagal download: " + (err.message || "Unknown"));
    }
  }

  async function handleHapusLog(id: string) {
    if (!confirm("⚠️ Hapus log ini?\n\nAksi tidak bisa dibatalkan.")) return;

    try {
      const res = await fetch(`/api/agents/log?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert("❌ " + (json.error || "Gagal hapus"));
        return;
      }
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      alert("❌ " + (err.message || "Unknown"));
    }
  }

  function handleBukaLog(log: LogItem) {
    setPerintah(log.perintah);
    setHasil({
      ok: true,
      log_id: log.id,
      perintah: log.perintah,
      rencana: log.rencana,
      hasil: log.hasil,
      multi: log.mode === "multi",
    });
    setShowLogs(false);
  }

  function formatTanggal(iso: string) {
    try {
      return new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#f0b429]/10 border-2 border-[#f0b429]/40 rounded-2xl p-4">
        <p className="text-xs text-[#2c5e2e] leading-relaxed">
          💡 Ketik perintah. Orchestrator otomatis pilih agent + multi-chain.
          Image Creator bikin <strong>infografis HTML</strong> (teks rapi) — tinggal download PNG.
          Aktifkan <strong>Multi-Orchestrator</strong> buat bandingin 3 model AI.
        </p>
      </div>

      <div className="bg-white border-2 border-[#2c5e2e]/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="block text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest">
            🎯 Perintah
          </label>
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition"
          >
            {showLogs ? "✕ Tutup Log" : `📜 Log (${logs.length})`}
          </button>
        </div>

        {/* Toggle Multi-Orchestrator */}
        <button
          type="button"
          onClick={() => setMultiMode(!multiMode)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition ${
            multiMode
              ? "bg-purple-50 border-purple-400"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-900">
                Multi-Orchestrator
              </div>
              <div className="text-[10px] text-gray-500">
                3 model AI bandingin rencana + 1 judge pilih terbaik
              </div>
            </div>
          </div>
          <div
            className={`flex-shrink-0 w-12 h-6 rounded-full transition relative ${
              multiMode ? "bg-purple-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${
                multiMode ? "left-6" : "left-0.5"
              }`}
            />
          </div>
        </button>

        <textarea
          value={perintah}
          onChange={(e) => setPerintah(e.target.value)}
          rows={4}
          placeholder="Contoh: Bikin infografis tentang kalkulator pupuk presisi..."
          disabled={loading}
          className="w-full border-2 border-[#2c5e2e]/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#f0b429] bg-white text-[#2c5e2e] disabled:opacity-60 resize-none"
        />

        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Contoh:
          </div>
          <div className="flex flex-wrap gap-2">
            {CONTOH_PERINTAH.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPerintah(c)}
                disabled={loading}
                className="text-[10px] bg-gray-100 hover:bg-[#f0b429]/20 text-gray-700 hover:text-[#2c5e2e] px-3 py-1.5 rounded-full transition disabled:opacity-50 text-left"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleJalankan()}
          disabled={loading || !perintah.trim()}
          className={`w-full font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md text-white ${
            multiMode
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-[#2c5e2e] hover:bg-[#1f4521]"
          }`}
        >
          {loading
            ? "⏳ Agent sedang bekerja..."
            : multiMode
            ? "🧠 Jalankan Multi-Orchestrator"
            : "🚀 Jalankan"}
        </button>
      </div>

      {showLogs && (
        <div className="bg-white border-2 border-purple-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-bold text-purple-800 uppercase tracking-widest">
              📜 Log ({logs.length})
            </div>
            <button
              type="button"
              onClick={loadLogs}
              disabled={loadingLogs}
              className="text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1.5 rounded-full transition disabled:opacity-50"
            >
              {loadingLogs ? "⏳..." : "🔄 Refresh"}
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-6 text-gray-400 italic text-sm">
              Belum ada log
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-purple-50 border border-purple-200 rounded-xl p-3 hover:bg-purple-100 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-purple-900 break-words">
                        {log.perintah}
                      </div>
                      <div className="text-[10px] text-purple-600 mt-1">
                        {formatTanggal(log.created_at)}
                        {log.mode === "refine" && " · 🔄 Refine"}
                        {log.mode === "multi" && " · 🧠 Multi"}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleBukaLog(log)}
                        className="text-[10px] font-bold bg-white hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-lg transition border border-purple-200"
                      >
                        Buka
                      </button>
                      <button
                        onClick={() => handleHapusLog(log.id)}
                        className="text-[10px] font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <p className="text-sm text-red-700 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3 animate-pulse">🤖</div>
          <p className="text-sm text-blue-800 font-semibold">
            {multiMode
              ? "3 Orchestrator + Judge sedang bekerja..."
              : "AI Agents sedang bekerja..."}
          </p>
        </div>
      )}

      {hasil && !loading && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-[#f0b429] rounded-2xl p-3 flex flex-wrap gap-2">
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 min-w-[110px] bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs px-3 py-2.5 rounded-full transition disabled:opacity-50 border border-blue-200"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={() => setRefineMode(!refineMode)}
              disabled={hasil.multi === true}
              className={`flex-1 min-w-[110px] font-bold text-xs px-3 py-2.5 rounded-full transition border ${
                hasil.multi === true
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : refineMode
                  ? "bg-orange-200 text-orange-900 border-orange-400"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200"
              }`}
            >
              ✏️ {refineMode ? "Tutup Refine" : "Refine"}
            </button>
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="flex-1 min-w-[110px] bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs px-3 py-2.5 rounded-full transition disabled:opacity-50 border border-purple-200"
            >
              {exporting ? "⏳..." : "🖼️ Export Semua PNG"}
            </button>
          </div>

          {refineMode && hasil.multi !== true && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-orange-800 uppercase tracking-widest">
                ✏️ Refine — feedback revisi
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Contoh: Buat warna lebih cerah, tambah emoji..."
                className="w-full border-2 border-orange-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 bg-white resize-none"
              />
              <button
                onClick={handleRefine}
                disabled={loading || !feedback.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-full transition disabled:opacity-50"
              >
                {loading ? "⏳ Merevisi..." : "🔄 Kirim & Revisi"}
              </button>
            </div>
          )}

          <div
            ref={hasilRef}
            className="space-y-4 bg-white p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-[#2c5e2e]/20 pb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-horizontal.png"
                alt="Harvestan"
                className="h-10 w-auto"
              />
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                AI Agents Output
                {hasil.multi && " · 🧠 Multi-Orchestrator"}
              </div>
            </div>

            {/* ============ MULTI-ORCHESTRATOR PANELS ============ */}
            {hasil.multi && hasil.panels && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-purple-800 uppercase tracking-widest">
                  🧠 Perbandingan 3 Orchestrator
                </div>

                {/* 3 panel sejajar (grid) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {hasil.panels.map((p) => (
                    <div
                      key={p.id}
                      className={`rounded-2xl border-2 p-4 ${
                        p.ok
                          ? "bg-purple-50 border-purple-300"
                          : "bg-red-50 border-red-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                            {p.id}
                          </div>
                          <div className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                            {p.label}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            p.ok
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {p.ok ? "✓" : "✗"}
                        </span>
                      </div>

                      <div className="text-[10px] text-gray-500 mb-2">
                        ⚡ {p.latencyMs}ms
                      </div>

                      {p.ok ? (
                        <pre className="text-[10px] leading-relaxed whitespace-pre-wrap font-sans text-gray-800">
                          {p.rencana}
                        </pre>
                      ) : (
                        <div className="text-[10px] text-red-700">
                          {p.error || "Gagal"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Judge Panel */}
                {hasil.judge && (
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-[#f0b429] rounded-2xl p-5">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚖️</span>
                        <div className="text-sm font-bold text-[#2c5e2e]">
                          Hasil Judge
                        </div>
                      </div>
                      {hasil.judge.ok && (
                        <span className="text-[10px] font-bold bg-[#2c5e2e] text-white px-3 py-1 rounded-full">
                          Pilih: {hasil.judge.pilihan}
                        </span>
                      )}
                    </div>

                    {hasil.judge.ok ? (
                      <>
                        {hasil.judge.alasan && (
                          <p className="text-xs text-gray-700 italic mb-3">
                            💬 {hasil.judge.alasan}
                          </p>
                        )}
                        <div className="bg-white border border-[#f0b429]/40 rounded-xl p-3">
                          <div className="text-[10px] font-bold text-[#2c5e2e] uppercase tracking-widest mb-2">
                            📋 Rencana Final
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans text-gray-800">
                            {hasil.judge.rencanaFinal}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-red-700">
                        {hasil.judge.error || "Judge gagal"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============ RENCANA YANG DIJALANKAN ============ */}
            <div className="bg-gradient-to-br from-[#2c5e2e] to-[#1f4521] rounded-2xl p-5 text-white">
              <div className="text-[10px] font-bold text-[#f0b429] uppercase tracking-widest mb-2">
                {hasil.multi ? "📋 Rencana yang Dijalankan" : "📋 Rencana Orchestrator"}
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {hasil.rencana}
              </pre>
            </div>

            {/* ============ HASIL AGENT ============ */}
            {hasil.hasil.map((h, i) => {
              const meta = AGENT_LABEL[h.agent] || {
                icon: "🤖",
                label: h.agent,
              };

              const isImageCreator = h.agent === "image-creator";
              const hasHtml = isImageCreator && h.ok && h.html;

              return (
                <div
                  key={i}
                  className={`border-2 rounded-2xl p-5 ${
                    h.ok
                      ? "bg-white border-[#2c5e2e]/20"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta.icon}</span>
                      <div className="text-sm font-bold text-[#2c5e2e]">
                        {meta.label}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        h.ok
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {h.ok ? "✓ Sukses" : "✗ Gagal"}
                    </span>
                  </div>

                  {hasHtml && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-[#2c5e2e]">
                        🎨 {h.judul || "Infografis"}
                      </div>

                      {h.catatan && (
                        <p className="text-[11px] text-gray-600 italic">
                          {h.catatan}
                        </p>
                      )}

                      <div className="bg-gray-100 rounded-2xl p-2 sm:p-4">
                        <IframeInfographic
                          html={h.html!}
                          width={h.width || 1080}
                          height={h.height || 1920}
                          iframeRef={(el) => {
                            iframeRefs.current[i] = el;
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleDownloadInfographic(i, h.judul || "")
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition"
                        >
                          💾 Download PNG
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(h.html || "");
                            alert("✅ HTML disalin");
                          }}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-full transition"
                        >
                          📋 Copy HTML
                        </button>
                      </div>
                    </div>
                  )}

                  {h.ok && h.hasil && !isImageCreator && (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {h.hasil}
                      </ReactMarkdown>
                    </div>
                  )}

                  {isImageCreator && h.ok && !hasHtml && h.hasil && (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {h.hasil}
                      </ReactMarkdown>
                    </div>
                  )}

                  {!h.ok && (
                    <div className="text-sm text-red-700">
                      {h.error || "Gagal"}
                    </div>
                  )}

                  {h.ok && h.hasil && !isImageCreator && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(h.hasil || "");
                        alert("✅ Hasil disalin");
                      }}
                      className="mt-3 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition"
                    >
                      📋 Copy Hasil
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">
          🤖 Agent yang Tersedia
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(AGENT_LABEL).map(([key, val]) => (
            <div
              key={key}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3"
            >
              <div className="text-lg mb-1">{val.icon}</div>
              <div className="font-bold text-gray-900 text-sm mb-1">
                {val.label}
              </div>
              <p className="text-xs text-gray-600">
                {key === "content-creator" &&
                  "Bikin draft konten: caption, script TikTok/IG, blog"}
                {key === "marketing-strategist" &&
                  "Strategi kampanye, analisis target, timeline, metrik"}
                {key === "idea-innovator" &&
                  "Brainstorming ide fitur, innovation, improvement"}
                {key === "social-media-manager" &&
                  "Content calendar, jadwal posting, strategi engagement"}
                {key === "image-creator" &&
                  "Bikin infografis HTML siap download PNG (brand Harvestan)"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
