import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QrCode, Scissors, FileText, Trash2, ChevronRight, Check, X, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { api, labelsUrl, openPdf, reportUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatHours } from "@/lib/format";
import { Btn, ErrorBlock, IconBtn, Loading, Modal, PageHeader, ProgressBar } from "@/components/app/ui";

const Rows = ({ items, set, prefix, editing }) =>
  items.map((it, idx) => (
    <div key={`${it.label}-${idx}`} className="kv">
      <span className="lbl">{it.label.toUpperCase()}</span>
      {editing ? (
        <input
          className="in in-sm max-w-[60%]"
          value={it.value}
          placeholder="—"
          onChange={(e) => set((arr) => arr.map((x, j) => (j === idx ? { ...x, value: e.target.value } : x)))}
          data-testid={`${prefix}-input-${idx}`}
        />
      ) : (
        <span className="kv-val" data-testid={`${prefix}-value-${idx}`}>{it.value || "—"}</span>
      )}
    </div>
  ));

const PhaseRow = ({ p, i, sheetId, isAdmin, toggling, onToggle }) => (
  <div className={`phase-row rise ${p.required ? "" : "opacity-50"}`} style={{ animationDelay: `${i * 30}ms` }}>
    <Link to={`/phase/${sheetId}/${p.id}`} className="phase-main" data-testid={`phase-card-${p.id}`}>
      <span className="phase-num">{String(i + 1).padStart(2, "0")}</span>
      <span className="flex-1 min-w-0 flex flex-col gap-2">
        <span className="flex justify-between gap-2">
          <span className="font-display font-bold text-lg leading-tight line-clamp-2">{p.name}</span>
          <span className="pct">{Math.round(p.percent)}%</span>
        </span>
        <ProgressBar percent={p.percent} height={8} />
        <span className="lbl">{p.done}/{p.total} · {formatHours(p.seconds)}{p.in_progress > 0 ? ` · ${p.in_progress} IN CORSO` : ""}</span>
      </span>
      <ChevronRight className="h-6 w-6 shrink-0" />
    </Link>
    <button
      type="button"
      className={`req-toggle ${p.required ? "req-on" : ""}`}
      disabled={!isAdmin || toggling === p.id}
      onClick={() => onToggle(p.id, !p.required)}
      data-testid={`phase-required-toggle-${p.id}`}
    >
      {p.required ? <Check className="h-5 w-5 text-[#8DB0C7]" strokeWidth={3} /> : <X className="h-5 w-5" strokeWidth={3} />}
      <span className="font-bold">{p.required ? "SI" : "NO"}</span>
      <span className="text-[10px] leading-tight text-center">{p.required ? "DA FARE" : "NON PREVISTA"}</span>
    </button>
  </div>
);

export default function Sheet() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const q = useQuery({ queryKey: ["sheet", id], queryFn: () => api(`/sheets/${id}`), refetchInterval: 15000 });
  const [editing, setEditing] = useState(false);
  const [info, setInfo] = useState([]);
  const [tol, setTol] = useState([]);
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    if (q.data && !editing) {
      setInfo(q.data.info);
      setTol(q.data.tolerances ?? []);
    }
  }, [q.data, editing]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return (<><PageHeader title="Scheda" back /><ErrorBlock message={q.error?.message ?? "Errore"} onRetry={() => q.refetch()} /></>);
  const sheet = q.data;

  const invalidateLists = () => {
    qc.invalidateQueries({ queryKey: ["sheets"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const toggleRequired = async (pid, required) => {
    setToggling(pid);
    try {
      qc.setQueryData(["sheet", id], await api(`/sheets/${id}/phases/${pid}`, { method: "PATCH", body: { required } }));
      invalidateLists();
      toast.success(required ? "Fase da fare" : "Fase non prevista");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  };

  const saveInfo = async () => {
    setSaving(true);
    try {
      await api(`/sheets/${id}`, { method: "PATCH", body: { info, tolerances: tol } });
      toast.success("Dati scheda salvati");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["sheet", id] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    try {
      await api(`/sheets/${id}`, { method: "DELETE" });
      invalidateLists();
      toast.success("Scheda eliminata");
      setDelOpen(false);
      nav("/", { replace: true });
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader
        title={sheet.title}
        subtitle={`SCHEDA · ${sheet.filename}`}
        back
        right={isAdmin && <IconBtn icon={Trash2} onClick={() => setDelOpen(true)} title="Elimina scheda" data-testid="delete-sheet-button" />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-6 min-w-0">
          <section className="summary rise" data-testid="sheet-summary">
            <div className="flex items-end justify-between gap-4">
              <div className="big-pct" data-testid="sheet-percent">{Math.round(sheet.progress.percent)}%</div>
              <div className="text-right lbl text-neutral-300 flex flex-col gap-1">
                <span>{sheet.progress.done}/{sheet.progress.total} STEP</span>
                <span>{formatHours(sheet.progress.seconds)} LAVORATE</span>
                <span className="text-[#8DB0C7]">{sheet.progress.in_progress} IN CORSO</span>
              </div>
            </div>
            <ProgressBar percent={sheet.progress.percent} height={14} />
          </section>
          <div className="grid gap-3 sm:grid-cols-3">
            <Btn label="ETICHETTE QR" icon={QrCode} variant="outline" onClick={() => openPdf(labelsUrl(`/sheets/${sheet.id}/labels.pdf`))} data-testid="position-labels-button" />
            <Btn label="TAGLIO BARRE" icon={Scissors} variant="inverse" onClick={() => nav(`/cutting/${sheet.id}`)} data-testid="open-cutting-button" />
            <Btn label="REPORT PDF" icon={FileText} onClick={() => openPdf(reportUrl(sheet.id))} data-testid="export-pdf-button" />
          </div>
          <h2 className="section-title">FASI DI LAVORAZIONE</h2>
          <div className="flex flex-col gap-3" data-testid="phases-list">
            {sheet.phases.map((p, i) => (
              <PhaseRow key={p.id} p={p} i={i} sheetId={sheet.id} isAdmin={isAdmin} toggling={toggling} onToggle={toggleRequired} />
            ))}
          </div>
        </div>
        <aside className="flex flex-col gap-6">
          <section className="panel">
            <div className="section-head">
              <h2 className="section-title">DATI SCHEDA</h2>
              {!editing && <button type="button" className="link-btn" onClick={() => setEditing(true)} data-testid="edit-info-button"><Pencil className="h-4 w-4" /> MODIFICA</button>}
            </div>
            {info.length === 0 && <p className="text-sm text-neutral-500">Nessun dato di intestazione trovato.</p>}
            <Rows items={info} set={setInfo} prefix="info" editing={editing} />
          </section>
          {tol.length > 0 && (
            <section className="panel" data-testid="tolerances-box">
              <h2 className="section-title mb-2">TOLLERANZE</h2>
              <Rows items={tol} set={setTol} prefix="tol" editing={editing} />
            </section>
          )}
          {editing && (
            <div className="flex gap-3">
              <Btn label="ANNULLA" variant="outline" onClick={() => setEditing(false)} className="flex-1" data-testid="cancel-info-button" />
              <Btn label="SALVA" icon={Save} onClick={saveInfo} loading={saving} className="flex-1" data-testid="save-info-button" />
            </div>
          )}
        </aside>
      </div>
      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Eliminare la scheda?" description="Tutti gli step, i tempi e le foto collegati verranno rimossi. L'azione è irreversibile." testid="delete-sheet-sheet">
        <Btn label="ELIMINA SCHEDA" icon={Trash2} variant="danger" onClick={del} data-testid="confirm-delete-sheet-button" />
      </Modal>
    </>
  );
}
