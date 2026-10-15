import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertOctagon, Check, CheckCheck, RefreshCw, Undo2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { num } from "@/lib/format";
import { Btn, Chip, ErrorBlock, Field, Loading, PageHeader, ProgressBar } from "@/components/app/ui";

const Pattern = ({ p, pi, pending, onToggle, onAll }) => {
  const doneCount = p.done.filter(Boolean).length;
  const all = doneCount === p.count;
  return (
    <section className={`panel ${all ? "border-[#00C853]" : ""}`} data-testid={`pattern-${pi}`}>
      <div className="flex items-start gap-4 mb-3">
        <span className="font-display font-bold text-3xl">{p.count}×</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold">{p.source === "scrap" ? "SFRIDO" : "BARRA"} {num(p.bar_length)} MM</div>
          {p.source === "scrap" && <div className="lbl text-brand truncate">DAL MAGAZZINO{p.scrap_origin ? ` · ${p.scrap_origin}` : ""}</div>}
          <div className="lbl">{p.pieces.length} {p.pieces.length === 1 ? "TUBO" : "TUBI"} · SCARTO {num(p.waste)} MM</div>
        </div>
        <span className="pct">{doneCount}/{p.count}</span>
      </div>
      <div className="bar-visual">
        {p.pieces.map((x, i) => (
          <div key={i} className="bar-piece" style={{ flex: x.length }} title={`P${x.pos} · ${num(x.length)}`}>
            <span className="truncate">P{x.pos} · {num(x.length)}</span>
          </div>
        ))}
        {p.waste > 0 && <div className="bar-waste" style={{ flex: Math.max(p.waste, p.bar_length * 0.02) }} />}
      </div>
      <div className="lbl mt-4 mb-2">SEGNA LE BARRE TAGLIATE</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {p.bar_ids.map((bid, i) => (
          <button key={bid} type="button" disabled={!!pending} onClick={() => onToggle(bid)} className={`bar-toggle ${p.done[i] ? "bar-done" : ""}`} data-testid={`bar-toggle-${pi}-${i}`}>
            {p.done[i] ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </button>
        ))}
      </div>
      <Btn
        label={all ? "SEGNA TUTTE DA FARE" : "SEGNA TUTTE FATTE"}
        icon={all ? Undo2 : CheckCheck}
        variant={all ? "outline" : "success"}
        onClick={() => onAll(p, !all)}
        loading={pending === p.key}
        disabled={!!pending && pending !== p.key}
        data-testid={`pattern-all-${pi}`}
      />
    </section>
  );
};

export default function Cutting() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const sheet = useQuery({ queryKey: ["sheet", id], queryFn: () => api(`/sheets/${id}`) });
  const q = useQuery({ queryKey: ["cutting", id], queryFn: () => api(`/sheets/${id}/cutting`) });
  const [kerf, setKerf] = useState("");
  const [mode, setMode] = useState("table");
  const [barLen, setBarLen] = useState("12000");
  const [useScraps, setUseScraps] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!q.data) return;
    setKerf(num(q.data.kerf));
    setMode(q.data.bar_mode);
    setBarLen(String(q.data.bar_length));
    setUseScraps(q.data.use_scraps);
  }, [q.data?.kerf, q.data?.bar_mode, q.data?.bar_length, q.data?.use_scraps]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = async (body) => qc.setQueryData(["cutting", id], await api(`/sheets/${id}/cutting`, { method: "PATCH", body }));

  const save = async () => {
    const v = parseFloat(kerf.replace(",", "."));
    if (isNaN(v) || v < 0 || v > 50) return toast.error("Spessore lama non valido (0-50 mm)");
    const bl = parseFloat(barLen.replace(",", "."));
    if (mode === "commercial" && (isNaN(bl) || bl < 500 || bl > 30000)) return toast.error("Lunghezza barra non valida (500-30000 mm)");
    setSaving(true);
    try {
      await patch({ kerf: v, bar_mode: mode, use_scraps: useScraps, ...(mode === "commercial" ? { bar_length: bl } : {}) });
      toast.success("Schema ricalcolato");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const toggle = async (barId) => {
    setPending(barId);
    try { await patch({ toggle: barId }); } catch (e) { toast.error(e.message); } finally { setPending(null); }
  };
  const markAll = async (p, value) => {
    setPending(p.key);
    try {
      for (let i = 0; i < p.bar_ids.length; i++) if (p.done[i] !== value) await patch({ toggle: p.bar_ids[i] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPending(null);
    }
  };

  if (q.isLoading) return <Loading />;
  const c = q.data;
  if (q.isError || !c) return (<><PageHeader title="Taglio barre" back /><ErrorBlock message={q.error?.message ?? "Errore"} onRetry={() => q.refetch()} /></>);
  const pct = c.totals.bars ? (c.totals.bars_done * 100) / c.totals.bars : 0;

  return (
    <>
      <PageHeader title="Taglio barre" subtitle={sheet.data?.title} back />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="flex flex-col gap-6">
          <section className="summary" data-testid="cutting-summary">
            <div className="flex justify-between items-end gap-3">
              <div>
                <div className="lbl text-neutral-400">BARRE TAGLIATE</div>
                <div className="big-pct" data-testid="bars-done-text">{c.totals.bars_done}/{c.totals.bars}</div>
              </div>
              <div className="text-right lbl text-neutral-300 flex flex-col gap-1">
                <span>{c.totals.pieces} TUBI</span>
                <span data-testid="new-bars-text">{c.totals.new_bars} BARRE NUOVE{c.totals.from_scraps ? ` + ${c.totals.from_scraps} SFRIDI` : ""}</span>
                <span>{num(c.totals.bar_meters)} M DI BARRA</span>
                <span className="text-[#8DB0C7]">RENDIMENTO {num(c.totals.efficiency)}%</span>
              </div>
            </div>
            <ProgressBar percent={pct} height={12} />
          </section>
          <section className="panel flex flex-col gap-3">
            <p className="text-sm text-neutral-600">Lunghezza di taglio = sviluppo "U" + {num(c.allowance)} mm. Ogni taglio consuma lo spessore lama.</p>
            <span className="lbl">BARRA DI PARTENZA</span>
            <div className="flex gap-2">
              {["table", "commercial"].map((m) => (
                <Chip key={m} on={mode === m} label={m === "table" ? "DA TABELLA" : "COMMERCIALE"} onClick={() => setMode(m)} data-testid={`bar-mode-${m}`} />
              ))}
            </div>
            {mode === "commercial" && (
              <Field label="LUNGHEZZA BARRA COMMERCIALE (MM)">
                <input className="in" inputMode="decimal" value={barLen} onChange={(e) => setBarLen(e.target.value)} placeholder="12000" data-testid="bar-length-input" />
              </Field>
            )}
            <label className="flex items-center gap-3 cursor-pointer font-semibold text-sm" data-testid="use-scraps-toggle">
              <input type="checkbox" className="check" checked={useScraps} onChange={() => setUseScraps((v) => !v)} />
              USA PRIMA GLI SFRIDI DEL MAGAZZINO
            </label>
            <p className="text-xs text-neutral-600">
              Sfridi compatibili: {c.spec.material || "—"} · Ø {c.spec.diameter || "—"} · sp {c.spec.thickness || "—"}. Gli scarti da {num(c.min_scrap)} mm in su finiscono nel magazzino quando segni la barra come fatta.
            </p>
            <Field label="SPESSORE LAMA (MM)">
              <input className="in" inputMode="decimal" value={kerf} onChange={(e) => setKerf(e.target.value)} placeholder="0" data-testid="kerf-input" />
            </Field>
            <Btn label="RICALCOLA" icon={RefreshCw} variant="inverse" onClick={save} loading={saving} data-testid="save-kerf-button" />
            <p className="text-xs text-neutral-600">Cambiare queste impostazioni ricalcola lo schema e azzera le barre segnate come fatte.</p>
            <Btn label="MAGAZZINO SFRIDI" icon={Warehouse} variant="outline" onClick={() => nav("/scraps")} data-testid="open-scraps-button" />
          </section>
        </aside>
        <div className="flex flex-col gap-6 min-w-0">
          {c.errors.length > 0 && (
            <div className="error-box" data-testid="cutting-errors">
              <AlertOctagon className="h-5 w-5" /> Tubi più lunghi della barra: {c.errors.map((e) => `POS ${e.pos}`).join(", ")}
            </div>
          )}
          <section className="panel overflow-x-auto">
            <h2 className="section-title mb-3">TUBI DA TAGLIARE</h2>
            {c.rows.length === 0 ? (
              <p className="text-sm text-neutral-500">Nessun dato di quantità / sviluppo / lunghezza tubo nella tabella di curvatura.</p>
            ) : (
              <table className="cut-table" data-testid="cutting-rows">
                <thead><tr>{["POS", "Q.TÀ", "SVILUPPO", `TAGLIO (+${num(c.allowance)})`, "BARRA"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.pos} data-testid={`cutting-row-${r.pos}`}>
                      <td className="font-bold">{r.pos}</td><td>{r.qty}</td><td>{num(r.develop)}</td><td>{num(r.cut_length)}</td><td>{num(r.bar_length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <h2 className="section-title">SCHEMI DI TAGLIO ({c.patterns.length})</h2>
          {c.patterns.map((p, pi) => <Pattern key={p.key} p={p} pi={pi} pending={pending} onToggle={toggle} onAll={markAll} />)}
        </div>
      </div>
    </>
  );
}
