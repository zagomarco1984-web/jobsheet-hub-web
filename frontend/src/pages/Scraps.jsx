import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, QrCode, Trash2, Plus, Save, SlidersHorizontal, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { api, labelsUrl, openPdf } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { num } from "@/lib/format";
import { Btn, Chip, ErrorBlock, Field, IconBtn, Loading, Modal, PageHeader } from "@/components/app/ui";

const NO_CUSTOMER = "SENZA CLIENTE";
const FILTERS = [{ key: "available", label: "DISPONIBILI" }, { key: "used", label: "USATI" }, { key: "", label: "TUTTI" }];
const EMPTY = { material: "", diameter: "", thickness: "", length: "", qty: "1", customer: "" };
const byName = (a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b));
const n1 = (v) => num(v, 10);

const ScrapRow = ({ item, onDelete }) => (
  <div className="scrap-row" data-testid={`scrap-row-${item.id}`}>
    <Link to={`/scrap/${item.id}`} className="flex flex-1 items-center gap-4 min-w-0">
      <span className={`len-box ${item.status === "used" ? "len-used" : ""}`}>
        <span className="font-display font-bold text-lg">{n1(item.length)}</span><span className="text-[10px]">MM</span>
      </span>
      <span className="min-w-0">
        <span className="block font-semibold truncate">{item.material} · Ø {item.diameter} · sp {item.thickness}</span>
        <span className="block lbl truncate">{item.status === "used" ? `USATO IN ${item.used_in_title || "scheda"}` : `DA ${item.origin}`}</span>
      </span>
    </Link>
    <IconBtn icon={QrCode} title="Etichetta" onClick={() => openPdf(labelsUrl(`/scraps/labels.pdf?ids=${item.id}`))} data-testid={`print-scrap-${item.id}`} />
    {item.status === "available" && <IconBtn icon={Trash2} title="Elimina" onClick={() => onDelete(item)} data-testid={`delete-scrap-${item.id}`} />}
  </div>
);

export default function Scraps() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState("available");
  const [customer, setCustomer] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [minOpen, setMinOpen] = useState(false);
  const [minVal, setMinVal] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const q = useQuery({ queryKey: ["scraps", filter], queryFn: () => api(`/scraps${filter ? `?status=${filter}` : ""}`) });
  const customers = useQuery({ queryKey: ["scrap-customers"], queryFn: () => api("/scraps/customers") });
  const settings = useQuery({ queryKey: ["scrap-settings"], queryFn: () => api("/settings/scraps") });

  const visible = (q.data ?? []).filter((x) => customer === null || (x.customer || "") === customer);
  const sections = Object.entries(visible.reduce((acc, x) => { (acc[x.customer || ""] ??= []).push(x); return acc; }, {}))
    .sort(([a], [b]) => byName(a, b))
    .map(([title, data]) => ({ title, data, meters: data.reduce((a, x) => a + x.length, 0) / 1000 }));
  const chips = Array.from(new Set([...(customers.data ?? []), ...(q.data ?? []).map((x) => x.customer || "")])).sort(byName);
  const totalM = visible.reduce((a, x) => a + x.length, 0) / 1000;
  const refresh = () => qc.invalidateQueries({ queryKey: ["scraps"] });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const add = async () => {
    const length = parseFloat(form.length.replace(",", "."));
    const qty = parseInt(form.qty, 10);
    if (!form.customer) return toast.error("Scegli il cliente");
    if (!form.material.trim() || !form.diameter.trim() || !form.thickness.trim() || isNaN(length) || length <= 0 || isNaN(qty) || qty < 1)
      return toast.error("Compila materiale, diametro, spessore, lunghezza e quantità");
    setSaving(true);
    try {
      await api("/scraps", { method: "POST", body: { ...form, length, qty } });
      toast.success(`${qty} ${qty === 1 ? "sfrido aggiunto" : "sfridi aggiunti"}`);
      setOpen(false);
      setForm(EMPTY);
      refresh();
      qc.invalidateQueries({ queryKey: ["scrap-customers"] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const saveMin = async () => {
    const v = parseFloat(minVal.replace(",", "."));
    if (isNaN(v) || v < 0) return toast.error("Valore non valido");
    try {
      await api("/settings/scraps", { method: "PUT", body: { min_length: v } });
      qc.invalidateQueries({ queryKey: ["scrap-settings"] });
      toast.success("Lunghezza minima salvata");
      setMinOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };
  const remove = async () => {
    try {
      await api(`/scraps/${toDelete.id}`, { method: "DELETE" });
      toast.success("Sfrido eliminato");
      setToDelete(null);
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const field = (key, label, ph, numeric) => (
    <Field label={label}>
      <input className="in uppercase" inputMode={numeric ? "decimal" : "text"} value={form[key]} onChange={set(key)} placeholder={ph} data-testid={`scrap-${key}-input`} />
    </Field>
  );

  return (
    <>
      <PageHeader
        title="Magazzino sfridi"
        subtitle={`MIN. RIUTILIZZABILE ${n1(settings.data?.min_length ?? 500)} MM`}
        back
        right={
          <>
            {user?.role === "admin" && <IconBtn icon={SlidersHorizontal} title="Lunghezza minima" onClick={() => { setMinVal(String(settings.data?.min_length ?? 500)); setMinOpen(true); }} data-testid="scrap-settings-button" />}
            <Btn label="ETICHETTE QR" icon={QrCode} variant="outline" disabled={!visible.length} onClick={() => openPdf(labelsUrl(`/scraps/labels.pdf?status=${filter}${customer !== null ? `&customer=${encodeURIComponent(customer)}` : ""}`))} data-testid="print-scrap-labels-button" />
            <Btn label="AGGIUNGI" icon={Plus} onClick={() => { setForm((f) => ({ ...f, customer: customer || "" })); setOpen(true); }} data-testid="add-scrap-button" />
          </>
        }
      />
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTERS.map((f) => <Chip key={f.key || "all"} on={filter === f.key} label={f.label} onClick={() => setFilter(f.key)} data-testid={`scrap-filter-${f.key || "all"}`} />)}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {[null, ...chips].map((c, i) => <Chip key={c ?? "__all"} brand on={customer === c} label={c === null ? "TUTTI I CLIENTI" : c || NO_CUSTOMER} onClick={() => setCustomer(c)} data-testid={`scrap-customer-filter-${i}`} />)}
        </div>
      )}
      {q.isLoading ? <Loading /> : q.isError ? <ErrorBlock message={q.error.message} onRetry={() => q.refetch()} /> : (
        <div data-testid="scraps-list">
          <div className="lbl mb-3" data-testid="scraps-count">{visible.length} SFRIDI · {n1(totalM)} M</div>
          {sections.length === 0 && (
            <div className="empty"><Warehouse className="h-12 w-12 text-neutral-400" /><p className="text-sm text-neutral-600">Nessuno sfrido. Gli scarti riutilizzabili vengono aggiunti quando segni una barra come tagliata.</p></div>
          )}
          <div className="grid gap-6 xl:grid-cols-2">
            {sections.map((s) => (
              <section key={s.title || "none"} className="panel p-0" data-testid={`scrap-section-${s.title || "none"}`}>
                <div className="scrap-head"><FolderOpen className="h-4 w-4 text-[#8DB0C7]" /><span className="flex-1 truncate">{s.title || NO_CUSTOMER}</span><span>{s.data.length} · {n1(s.meters)} M</span></div>
                {s.data.map((x) => <ScrapRow key={x.id} item={x} onDelete={setToDelete} />)}
              </section>
            ))}
          </div>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo sfrido" description="Cliente, materiale, diametro e spessore devono coincidere con i dati scheda per essere proposti nei tagli." testid="add-scrap-sheet">
        <span className="lbl">CLIENTE</span>
        <div className="flex flex-wrap gap-2">
          {(customers.data ?? []).map((c, i) => <Chip key={c} brand on={form.customer === c} label={c} onClick={() => setForm((f) => ({ ...f, customer: c }))} data-testid={`scrap-customer-option-${i}`} />)}
          {!customers.data?.length && <span className="text-sm text-neutral-500">Nessun cliente: importa prima una scheda.</span>}
        </div>
        {field("material", "MATERIALE", "SA179")}
        <div className="grid grid-cols-2 gap-3">{field("diameter", "DIAMETRO TUBO", "31.75", true)}{field("thickness", "SPESSORE", "2.11", true)}</div>
        <div className="grid grid-cols-2 gap-3">{field("length", "LUNGHEZZA (MM)", "3500", true)}{field("qty", "QUANTITÀ", "1", true)}</div>
        <Btn label="SALVA" icon={Save} onClick={add} loading={saving} data-testid="save-scrap-button" />
      </Modal>
      <Modal open={minOpen} onClose={() => setMinOpen(false)} title="Lunghezza minima sfrido" description="Gli scarti più corti non vengono messi a magazzino." testid="scrap-min-sheet">
        <input className="in" inputMode="decimal" value={minVal} onChange={(e) => setMinVal(e.target.value)} data-testid="scrap-min-input" />
        <Btn label="SALVA" icon={Save} onClick={saveMin} data-testid="save-scrap-min-button" />
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Eliminare lo sfrido?" testid="delete-scrap-sheet">
        <Btn label="ELIMINA" icon={Trash2} variant="danger" onClick={remove} data-testid="confirm-delete-scrap-button" />
      </Modal>
    </>
  );
}
