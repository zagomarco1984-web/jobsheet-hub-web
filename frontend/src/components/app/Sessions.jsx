import { useState } from "react";
import { Pencil, ClockPlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buildIso, formatDuration, splitNames, toDateInput, toTimeInput, todayInput } from "@/lib/format";
import { Btn, Field, Modal } from "@/components/app/ui";
import { OperatorPicker } from "@/components/app/OperatorPicker";

export const SessionsSection = ({ step, now, onUpdated }) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [operator, setOperator] = useState([]);
  const [saving, setSaving] = useState(false);
  const sessions = step.sessions ?? [];

  const open = (x) => {
    setEditing(x);
    if (x === "new") {
      setDate(todayInput()); setStart(""); setEnd("");
      setOperator(user?.name ? [user.name] : []);
    } else {
      setDate(toDateInput(x.start_at)); setStart(toTimeInput(x.start_at)); setEnd(toTimeInput(x.end_at));
      setOperator(splitNames(x.operator));
    }
  };

  const save = async () => {
    const st = buildIso(date, start);
    const en = buildIso(date, end);
    if (!st || en === undefined) {
      toast.error("Formato non valido: data GG/MM/AAAA, ora HH:MM");
      return;
    }
    setSaving(true);
    try {
      const body = { start_at: st, end_at: en, operator: operator.join(", ") };
      const updated = editing === "new"
        ? await api(`/steps/${step.id}/sessions`, { method: "POST", body })
        : await api(`/steps/${step.id}/sessions/${editing.id}`, { method: "PATCH", body });
      onUpdated(updated);
      toast.success(editing === "new" ? "Sessione aggiunta" : "Sessione aggiornata");
      setEditing(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      onUpdated(await api(`/steps/${step.id}/sessions/${editing.id}`, { method: "DELETE" }));
      toast.success("Sessione eliminata");
      setEditing(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const dur = (x) => {
    const a = new Date(x.start_at).getTime();
    const b = x.end_at ? new Date(x.end_at).getTime() : now;
    return formatDuration((b - a) / 1000);
  };

  return (
    <section className="panel">
      <h2 className="section-title mb-3">SESSIONI DI LAVORO ({sessions.length})</h2>
      <div className="flex flex-col" data-testid="sessions-list">
        {sessions.length === 0 && <p className="text-sm text-neutral-500 mb-2">Nessuna sessione. Premi AVVIA o aggiungi gli orari a mano.</p>}
        {sessions.map((x, i) => (
          <button key={x.id} type="button" className="session-row" onClick={() => open(x)} data-testid={`session-row-${i}`}>
            <span className="session-num">{i + 1}</span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block font-semibold">{toTimeInput(x.start_at)} → {x.end_at ? toTimeInput(x.end_at) : "IN CORSO"}</span>
              <span className="block lbl truncate">{toDateInput(x.start_at)}{x.operator ? ` · ${x.operator}` : ""}</span>
            </span>
            <span className="font-bold tabular-nums">{dur(x)}</span>
            <Pencil className="h-4 w-4 text-neutral-500" />
          </button>
        ))}
        <Btn label="AGGIUNGI ORARI A MANO" icon={ClockPlus} variant="outline" onClick={() => open("new")} className="mt-3" data-testid="add-session-button" />
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === "new" ? "Nuova sessione" : "Modifica sessione"} testid="session-sheet">
        <Field label="DATA (GG/MM/AAAA)">
          <input className="in" value={date} onChange={(e) => setDate(e.target.value)} placeholder="06/10/2026" data-testid="session-date-input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ORA INIZIO">
            <input className="in" value={start} onChange={(e) => setStart(e.target.value)} placeholder="08:00" data-testid="session-start-input" />
          </Field>
          <Field label="ORA FINE">
            <input className="in" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="12:30" data-testid="session-end-input" />
          </Field>
        </div>
        <span className="lbl">OPERATORE</span>
        <OperatorPicker testid="session-operator" value={operator} onChange={setOperator} />
        <Btn label="SALVA SESSIONE" icon={Save} onClick={save} loading={saving} data-testid="save-session-button" />
        {editing !== "new" && <Btn label="ELIMINA SESSIONE" icon={Trash2} variant="danger" onClick={remove} disabled={saving} data-testid="delete-session-button" />}
      </Modal>
    </section>
  );
};
