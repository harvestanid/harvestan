"use client";

import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  parseImagePrompts,
  extractFallbackPrompt,
} from "@/lib/agents/tools/parse-image-prompts";

type AgentResult = {
  agent: string;
  ok: boolean;
  hasil?: string;
  error?: string;
  meta?: any;
};

type Hasil = {
  ok: boolean;
  log_id?: string;
  perintah: string;
  rencana: string;
  hasil: AgentResult[];
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
  "Bikin prompt gambar untuk konten TikTok tentang panen padi",
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

  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

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
  }) {
    if (!perintah.trim()) {
      alert("❌ Isi perintah dulu");
      return;
    }

    setLoading(true);
    if (!opts?.mode || opts.mode === "normal") {
      setHasil(null);
      setGeneratedImages({});
      setImageErrors({});
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
    });
    setGeneratedImages({});
    setImageErrors({});
    setShowLogs(false);
  }

  async function handleGenerateImage(prompt: string, key: string) {
    if (!prompt.trim()) {
      alert("❌ Prompt kosong");
      return;
    }

    setGeneratingImage(key);
    setImageErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch("/api/agents/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect_ratio: "1:1" }),
      });
      const json = await res.json();

      if (!res.ok) {
        setImageErrors((prev) => ({ ...prev, [key]: json.error || "Gagal" }));
        return;
      }

      setGeneratedImages((prev) => ({ ...prev, [key]: json.image }));
    } catch (err: any) {
      setImageErrors((prev) => ({ ...prev, [key]: err.message || "Unknown" }));
    } finally {
      setGeneratingImage(null);
    }
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
          Hasil bisa regenerate, refine, atau export PNG.
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

        <textarea
          value={perintah}
          onChange={(e) => setPerintah(e.target.value)}
          rows={4}
          placeholder="Contoh: Bikin 5 ide konten TikTok tentang cara panen padi..."
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
          className="w-full bg-[#2c5e2e] hover:bg-[#1f4521] text-white font-bold py-3.5 rounded-full transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
        >
          {loading ? "⏳ Agent sedang bekerja..." : "🚀 Jalankan"}
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
            AI Agents sedang bekerja...
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
              className={`flex-1 min-w-[110px] font-bold text-xs px-3 py-2.5 rounded-full transition border ${
                refineMode
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
              {exporting ? "⏳..." : "🖼️ Export PNG"}
            </button>
          </div>

          {refineMode && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-orange-800 uppercase tracking-widest">
                ✏️ Refine — feedback revisi
              </div>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Contoh: Buat lebih santai, tambah emoji..."
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
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#2c5e2e] to-[#1f4521] rounded-2xl p-5 text-white">
              <div className="text-[10px] font-bold text-[#f0b429] uppercase tracking-widest mb-2">
                📋 Rencana Orchestrator
              </div>
              <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {hasil.rencana}
              </pre>
            </div>

            {hasil.hasil.map((h, i) => {
              const meta = AGENT_LABEL[h.agent] || {
                icon: "🤖",
                label: h.agent,
              };

              const isImageCreator = h.agent === "image-creator";
              const parsedPrompts =
                isImageCreator && h.ok && h.hasil
                  ? parseImagePrompts(h.hasil)
                  : [];

              const fallbackPrompt =
                isImageCreator && h.ok && h.hasil && parsedPrompts.length === 0
                  ? extractFallbackPrompt(h.hasil)
                  : null;

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

                  {isImageCreator && h.ok && (
                    <div className="space-y-4">
                      {parsedPrompts.length > 0 && (
                        <>
                          {parsedPrompts.map((p, idx) => {
                            const key = `${i}-${idx}`;
                            const img = generatedImages[key];
                            const err = imageErrors[key];
                            const isLoading = generatingImage === key;

                            return (
                              <div
                                key={idx}
                                className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4"
                              >
                                <div className="text-xs font-bold text-pink-900 mb-2">
                                  🎨 Prompt #{idx + 1}
                                </div>

                                <div className="text-[11px] text-gray-700 space-y-1 mb-3">
                                  {p.deskripsi && (
                                    <div>
                                      <strong>Deskripsi:</strong> {p.deskripsi}
                                    </div>
                                  )}
                                  {p.style && (
                                    <div>
                                      <strong>Style:</strong> {p.style}
                                    </div>
                                  )}
                                  {p.warna && (
                                    <div>
                                      <strong>Warna:</strong> {p.warna}
                                    </div>
                                  )}
                                </div>

                                <div className="bg-white border border-pink-200 rounded-lg p-3 text-[11px] font-mono text-gray-800 mb-3 break-words">
                                  {p.promptAI}
                                </div>

                                {img ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={img}
                                    alt={`Generated ${idx + 1}`}
                                    className="w-full rounded-xl border-2 border-pink-300 shadow-md"
                                  />
                                ) : err ? (
                                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-2">
                                    ⚠️ {err}
                                  </div>
                                ) : null}

                                <div className="flex flex-wrap gap-2 mt-3">
                                  {!img && (
                                    <button
                                      onClick={() =>
                                        handleGenerateImage(p.promptAI, key)
                                      }
                                      disabled={isLoading}
                                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs px-4 py-2.5 rounded-full transition disabled:opacity-50"
                                    >
                                      {isLoading
                                        ? "⏳ Generate..."
                                        : "🎨 Generate Gambar"}
                                    </button>
                                  )}
                                  {img && (
                                    <a
                                      href={img}
                                      download={`harvestan-image-${key}.png`}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition text-center"
                                    >
                                      💾 Download
                                    </a>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.promptAI);
                                      alert("✅ Prompt disalin");
                                    }}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-full transition"
                                  >
                                    📋 Copy
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {parsedPrompts.length === 0 && (
                        <>
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                            >
                              {h.hasil}
                            </ReactMarkdown>
                          </div>

                          {fallbackPrompt && (
                            <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4">
                              <div className="text-xs font-bold text-pink-900 mb-2">
                                🎨 Generate Gambar
                              </div>
                              <div className="bg-white border border-pink-200 rounded-lg p-3 text-[11px] font-mono text-gray-800 mb-3 break-words">
                                {fallbackPrompt}
                              </div>

                              {generatedImages[`${i}-fallback`] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={generatedImages[`${i}-fallback`]}
                                  alt="Generated"
                                  className="w-full rounded-xl border-2 border-pink-300 shadow-md"
                                />
                              ) : imageErrors[`${i}-fallback`] ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mb-2">
                                  ⚠️ {imageErrors[`${i}-fallback`]}
                                </div>
                              ) : null}

                              <div className="flex flex-wrap gap-2 mt-3">
                                {!generatedImages[`${i}-fallback`] && (
                                  <button
                                    onClick={() =>
                                      handleGenerateImage(
                                        fallbackPrompt,
                                        `${i}-fallback`
                                      )
                                    }
                                    disabled={
                                      generatingImage === `${i}-fallback`
                                    }
                                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs px-4 py-2.5 rounded-full transition disabled:opacity-50"
                                  >
                                    {generatingImage === `${i}-fallback`
                                      ? "⏳ Generate..."
                                      : "🎨 Generate Gambar"}
                                  </button>
                                )}
                                {generatedImages[`${i}-fallback`] && (
                                  <a
                                    href={generatedImages[`${i}-fallback`]}
                                    download={`harvestan-image-${i}.png`}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition text-center"
                                  >
                                    💾 Download
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
                  "Bikin prompt gambar AI + generate gambar (Flux)"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
