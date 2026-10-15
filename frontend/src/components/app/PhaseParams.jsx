import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Btn, Field, Modal } from "@/components/app/ui";

export const PhaseParams = ({ sheetId, phaseId, params }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(params);
  const [saving, setSaving] = useState(false);
  const groups = [...new Set(params.map((p) => p.group))];

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api(`/sheets/${sheetId}/phases/${phaseId}`, { method: "PATCH", body: { params: draft } });
      qc.setQueryData(["sheet", sheetId], updated);
      toast.success("Parametri salvati");
      setOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel" data-testid="phase-params">
      <div className="section-head">
        <h2 className="section-title">PARAMETRI</h2>
        <button type="button" className="link-btn" onClick={() => { setDraft(params); setOpen(true); }} data-testid="edit-params-button">
          <Pencil className="h-4 w-4" /> MODIFICA
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g}>
            <div className="lbl text-brand mb-1">{g}</div>
            {params.filter((p) => p.group === g).map((p, i) => (
              <div key={`${g}-${p.label}`} className="kv">
                <span className="lbl">{p.label.toUpperCase()}</span>
                <span className="kv-val" data-testid={`param-value-${g}-${i}`}>{p.value || "—"}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Parametri" testid="params-sheet">
        {groups.map((g) => (
          <div key={g} className="flex flex-col gap-2">
            <div className="lbl text-brand">{g}</div>
            {draft.map((p, idx) =>
              p.group === g ? (
                <Field key={`${g}-${p.label}`} label={p.label.toUpperCase()}>
                  <input
                    className="in"
                    value={p.value}
                    placeholder="—"
                    onChange={(e) => setDraft((arr) => arr.map((x, j) => (j === idx ? { ...x, value: e.target.value } : x)))}
                    data-testid={`param-input-${idx}`}
                  />
                </Field>
              ) : null
            )}
          </div>
        ))}
        <Btn label="SALVA PARAMETRI" icon={Save} onClick={save} loading={saving} data-testid="save-params-button" />
      </Modal>
    </section>
  );
};
