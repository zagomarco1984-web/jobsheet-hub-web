import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Square, RotateCcw, Save, CameraIcon, BadgeCheck, HardHat, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatDuration, splitNames } from "@/lib/format";
import { Btn, ErrorBlock, Field, Loading, Modal, PageHeader, StatusBadge } from "@/components/app/ui";
import { SessionsSection } from "@/components/app/Sessions";
import { OperatorPicker } from "@/components/app/OperatorPicker";

const TimerCard = ({ step, elapsed }) => (
  <section className="summary rise" data-testid="timer-card">
    <div className="flex items-center justify-between gap-3">
      <StatusBadge status={step.status} data-testid="step-status-badge" />
      {step.operator && <span className="lbl text-neutral-300 flex items-center gap-1 truncate"><HardHat className="h-4 w-4" /> {step.operator}</span>}
    </div>
    <div className="timer" data-testid="step-timer">{formatDuration(elapsed)}</div>
    <div className="grid grid-cols-2 gap-4">
      <div><div className="lbl text-neutral-400">PRIMO AVVIO</div><div className="font-semibold text-white" data-testid="step-start-display">{formatDateTime(step.start_at)}</div></div>
      <div><div className="lbl text-neutral-400">ORA FINE</div><div className="font-semibold text-white" data-testid="step-end-display">{step.status === "paused" ? "IN PAUSA" : formatDateTime(step.end_at)}</div></div>
    </div>
  </section>
);

const Actions = ({ status, busy, onStart, onPause, onStop, onReopen }) => (
  <div className="action-bar" data-testid="step-actions">
    {status === "todo" && <Btn label="AVVIA" icon={Play} size="lg" onClick={onStart} loading={busy} className="w-full" data-testid="start-step-button" />}
    {status === "in_progress" && (
      <div className="grid grid-cols-2 gap-3">
        <Btn label="PAUSA" icon={Pause} size="lg" variant="outline" onClick={onPause} loading={busy} data-testid="pause-step-button" />
        <Btn label="TERMINA" icon={Square} size="lg" variant="inverse" onClick={onStop} loading={busy} data-testid="stop-step-button" />
      </div>
    )}
    {status === "paused" && (
      <div className="grid grid-cols-2 gap-3">
        <Btn label="RIPRENDI" icon={Play} size="lg" onClick={onStart} loading={busy} data-testid="resume-step-button" />
        <Btn label="TERMINA" icon={Square} size="lg" variant="inverse" onClick={onStop} loading={busy} data-testid="stop-step-button" />
      </div>
    )}
    {status === "done" && (
      <div className="grid grid-cols-2 gap-3">
        <div className="done-box" data-testid="step-done-indicator"><BadgeCheck className="h-6 w-6" /> COMPLETATO</div>
        <Btn label="RIAPRI" icon={RotateCcw} size="lg" variant="outline" onClick={onReopen} loading={busy} data-testid="reopen-step-button" />
      </div>
    )}
  </div>
);

export default function Step() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({ queryKey: ["step", id], queryFn: () => api(`/steps/${id}`) });
  const step = q.data;
  const [now, setNow] = useState(Date.now());
  const [crew, setCrew] = useState([]);
  const [notes, setNotes] = useState("");
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(null);
  const [viewer, setViewer] = useState(null);
  const photoInput = useRef(null);
  const openSession = step?.sessions?.find((x) => !x.end_at);

  useEffect(() => {
    if (!step) return;
    setNotes(step.notes);
    setFields(step.fields);
  }, [step]);
  useEffect(() => {
    setCrew(openSession ? splitNames(openSession.operator) : user?.name ? [user.name] : []);
  }, [step?.id, openSession?.id, openSession?.operator, user?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step?.status !== "in_progress") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [step?.status]);

  if (q.isLoading) return <Loading />;
  if (q.isError || !step) return (<><PageHeader title="Step" back /><ErrorBlock message={q.error?.message ?? "Errore"} onRetry={() => q.refetch()} /></>);

  const apply = (updated) => {
    qc.setQueryData(["step", id], updated);
    qc.invalidateQueries({ queryKey: ["steps", updated.sheet_id, updated.phase_id] });
    qc.invalidateQueries({ queryKey: ["sheet", updated.sheet_id] });
    qc.invalidateQueries({ queryKey: ["sheets"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      apply(await fn());
      toast.success(okMsg);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  };

  const elapsed = step.seconds + (step.status === "in_progress" ? Math.max(0, (now - q.dataUpdatedAt) / 1000) : 0);
  const start = () => {
    if (crew.length === 0) return toast.error("Inserisci almeno un operatore");
    run("timer", () => api(`/steps/${id}/start`, { method: "POST", body: { operator: crew.join(", ") } }), step.status === "paused" ? "Lavorazione ripresa" : "Lavorazione avviata");
  };
  const changeCrew = (v) => {
    setCrew(v);
    if (openSession && v.length > 0)
      run("crew", () => api(`/steps/${id}/sessions/${openSession.id}`, { method: "PATCH", body: { start_at: openSession.start_at, end_at: null, operator: v.join(", ") } }), "Operatori aggiornati");
  };
  const uploadPhoto = async (file) => {
    if (!file) return;
    setBusy("photo");
    try {
      const form = new FormData();
      form.append("file", file, file.name || `foto-${Date.now()}.jpg`);
      apply(await api(`/steps/${id}/photos`, { method: "POST", form }));
      toast.success("Foto caricata");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
      photoInput.current.value = "";
    }
  };
  const deletePhoto = (p) => {
    setViewer(null);
    run("photo", () => api(`/steps/${id}/photos/${p.id}`, { method: "DELETE" }), "Foto eliminata");
  };
  const phaseFields = step.phase_fields ?? Object.keys(step.fields);
  const ref = Object.entries(step.ref ?? {});

  return (
    <>
      <PageHeader title={`Posizione ${step.pos}`} subtitle={`${step.phase_name} · ${step.sheet_title}`} back />
      <div className="grid gap-6 lg:grid-cols-2 pb-28">
        <div className="flex flex-col gap-6 min-w-0">
          <TimerCard step={step} elapsed={elapsed} />
          {ref.length > 0 && (
            <section className="panel" data-testid="bending-data">
              <h2 className="section-title mb-2">DATI CURVATURA</h2>
              <div className="grid sm:grid-cols-2 gap-x-6">
                {ref.map(([k, v]) => (
                  <div key={k} className="kv"><span className="lbl truncate">{k.toUpperCase()}</span><span className="kv-val">{v}</span></div>
                ))}
              </div>
            </section>
          )}
          <SessionsSection step={step} now={now} onUpdated={apply} />
          <section className="panel">
            <h2 className="section-title mb-3">FOTO ({step.photos.length})</h2>
            <input ref={photoInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => uploadPhoto(e.target.files?.[0])} data-testid="photo-file-input" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {step.photos.map((p) => (
                <button key={p.id} type="button" className="thumb" onClick={() => setViewer(p)} data-testid={`photo-thumb-${p.id}`}>
                  <img src={fileUrl(p.path)} alt={`Foto posizione ${step.pos}`} className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
              <button type="button" className="thumb thumb-add" onClick={() => photoInput.current.click()} disabled={busy === "photo"} data-testid="add-photo-button">
                {busy === "photo" ? <Loader2 className="h-7 w-7 animate-spin" /> : <><CameraIcon className="h-8 w-8" /><span className="lbl text-brand">AGGIUNGI</span></>}
              </button>
            </div>
          </section>
        </div>
        <section className="panel h-fit flex flex-col gap-3">
          <h2 className="section-title">COMPILAZIONE</h2>
          <span className="lbl">{openSession ? "OPERATORI SESSIONE IN CORSO" : "OPERATORI PROSSIMA SESSIONE"}</span>
          <OperatorPicker testid="operator" value={crew} onChange={changeCrew} />
          {phaseFields.map((f) => (
            <Field key={f} label={f}>
              <input className="in" value={fields[f] ?? ""} placeholder="—" onChange={(e) => setFields((x) => ({ ...x, [f]: e.target.value }))} data-testid={`field-input-${f.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
            </Field>
          ))}
          <Field label="NOTE">
            <textarea className="in min-h-[110px] py-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Annotazioni, anomalie..." data-testid="notes-input" />
          </Field>
          <Btn label="SALVA DATI" icon={Save} variant="inverse" onClick={() => run("data", () => api(`/steps/${id}`, { method: "PATCH", body: { fields, notes } }), "Dati salvati")} loading={busy === "data"} data-testid="save-step-data-button" />
        </section>
      </div>
      <Actions
        status={step.status}
        busy={busy === "timer"}
        onStart={start}
        onPause={() => run("timer", () => api(`/steps/${id}/pause`, { method: "POST" }), "Lavorazione in pausa")}
        onStop={() => run("timer", () => api(`/steps/${id}/stop`, { method: "POST" }), "Step completato")}
        onReopen={() => run("timer", () => api(`/steps/${id}/reopen`, { method: "POST" }), "Step riaperto")}
      />
      <Modal open={!!viewer} onClose={() => setViewer(null)} title={viewer ? `${formatDateTime(viewer.uploaded_at)} · ${viewer.uploaded_by}` : ""} testid="photo-viewer">
        {viewer && <img src={fileUrl(viewer.path)} alt="Foto step" className="w-full max-h-[65vh] object-contain bg-neutral-100" />}
        {viewer && <Btn label="ELIMINA FOTO" icon={Trash2} variant="danger" onClick={() => deletePhoto(viewer)} data-testid="delete-photo-button" />}
      </Modal>
    </>
  );
}
