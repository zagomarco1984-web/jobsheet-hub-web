import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, XCircle, FileUp, FileSpreadsheet, FilePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDuration, formatHours } from "@/lib/format";
import { Btn, ErrorBlock, Field, Loading, Modal, PageHeader, ProgressBar, Stat } from "@/components/app/ui";
import { CustomerFolder, SheetCard, groupByCustomer } from "@/components/app/SheetCard";

const UploadModal = ({ open, onClose }) => {
  const qc = useQueryClient();
  const nav = useNavigate();
  const input = useRef(null);
  const [picked, setPicked] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const pick = (f) => {
    if (!f) return;
    setPicked(f);
    setTitle(f.name.replace(/\.(xlsx|xlsm)$/i, ""));
  };

  const upload = async () => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", picked, picked.name);
      form.append("title", title);
      const r = await api("/sheets/upload", { method: "POST", form });
      const n = r.created.length;
      const msg = n === 0
        ? `Nessuna nuova scheda: ${r.skipped} già presenti`
        : `${n} ${n === 1 ? "scheda creata" : "schede create"}${r.skipped ? ` · ${r.skipped} già presenti` : ""}`;
      n === 0 ? toast.error(msg) : toast.success(msg);
      setPicked(null);
      input.current.value = "";
      onClose();
      qc.invalidateQueries({ queryKey: ["sheets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (n === 1) nav(`/sheet/${r.created[0].id}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !uploading && onClose()}
      title="Carica scheda Excel"
      description="Ogni tabella di curvatura compilata diventa una scheda nella cartella del cliente. Se il cliente esiste già, vengono aggiunte solo le schede nuove: i dati già compilati non vengono toccati."
      testid="upload-sheet"
    >
      <input ref={input} type="file" accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={(e) => pick(e.target.files?.[0])} data-testid="excel-file-input" />
      <button
        type="button"
        className="drop"
        onClick={() => input.current.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        data-testid="pick-excel-button"
      >
        {picked ? <FileSpreadsheet className="h-9 w-9 text-[#00C853]" /> : <FilePlus className="h-9 w-9" />}
        <span className="font-bold tracking-wider text-sm break-all">{picked ? picked.name : "SELEZIONA O TRASCINA FILE .XLSX"}</span>
      </button>
      {picked && (
        <Field label="NOME SCHEDA">
          <input className="in" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es. Commessa 2026-014" data-testid="upload-title-input" />
        </Field>
      )}
      <Btn label="IMPORTA SCHEDA" icon={Upload} onClick={upload} loading={uploading} disabled={!picked} data-testid="confirm-upload-button" />
    </Modal>
  );
};

const ActiveNow = ({ active }) => (
  <section className="panel rise" style={{ animationDelay: "80ms" }}>
    <h2 className="section-title flex items-center gap-2 mb-3"><span className="live-dot" /> IN LAVORAZIONE ORA</h2>
    <div className="flex flex-col">
      {active.map((a) => (
        <Link key={a.id} to={`/step/${a.id}`} className="active-row" data-testid={`active-step-${a.id}`}>
          <span className="pos-box">{a.pos}</span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold truncate">{a.phase_name}</span>
            <span className="block lbl truncate">{a.sheet_title} · {a.operator || "—"}</span>
          </span>
          <span className="font-bold tabular-nums text-brand">{formatDuration(a.seconds)}</span>
        </Link>
      ))}
    </div>
  </section>
);

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const sheets = useQuery({ queryKey: ["sheets"], queryFn: () => api("/sheets"), refetchInterval: 30000 });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => api("/dashboard"), refetchInterval: 15000 });

  const term = search.trim().toLowerCase();
  const all = sheets.data ?? [];
  const filtered = term ? all.filter((x) => [x.title, x.customer, ...x.info.map((i) => i.value)].join(" ").toLowerCase().includes(term)) : [];
  const groups = groupByCustomer(all);
  const totals = dash.data?.totals;
  const active = dash.data?.active ?? [];

  return (
    <>
      <PageHeader
        title="Schede Lavoro"
        subtitle={isAdmin ? `ADMIN · ${user.name}` : `OPERATORE · ${user.name}`}
        right={isAdmin && <Btn label="CARICA EXCEL" icon={FileUp} onClick={() => setUploadOpen(true)} data-testid="upload-excel-button" />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6 min-w-0 order-2 lg:order-1">
          <div className="search">
            <Search className="h-5 w-5 text-neutral-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca per numero, job, ordine, cliente…" data-testid="sheets-search-input" />
            {search && <button type="button" onClick={() => setSearch("")} data-testid="clear-search-button"><XCircle className="h-5 w-5 text-neutral-500" /></button>}
          </div>
          <h2 className="section-title">{term ? `RISULTATI (${filtered.length})` : `CLIENTI (${groups.length})`}</h2>
          {sheets.isLoading ? <Loading /> : sheets.isError ? <ErrorBlock message={sheets.error.message} onRetry={() => sheets.refetch()} /> : (
            <div className="grid gap-4 md:grid-cols-2" data-testid="sheets-list">
              {term ? filtered.map((s) => <SheetCard key={s.id} item={s} />) : groups.map((g) => <CustomerFolder key={g.name} group={g} />)}
              {all.length === 0 && (
                <div className="empty md:col-span-2" data-testid="empty-sheets">
                  <FileSpreadsheet className="h-14 w-14 text-neutral-400" />
                  <div className="font-bold tracking-widest">NESSUNA SCHEDA ATTIVA</div>
                  <div className="text-sm text-neutral-600">{isAdmin ? "Carica il tuo primo file Excel per iniziare." : "L'amministratore non ha ancora caricato schede."}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-6 order-1 lg:order-2">
          <section className="panel rise" data-testid="dashboard-stats">
            <div className="grid grid-cols-2 stat-grid">
              <Stat label="AVANZAMENTO" value={`${totals?.percent ?? 0}%`} highlight data-testid="stat-percent" />
              <Stat label="ORE LAVORATE" value={formatHours(totals?.seconds ?? 0)} data-testid="stat-hours" />
              <Stat label="STEP FATTI" value={`${totals?.done ?? 0}/${totals?.total ?? 0}`} data-testid="stat-done" />
              <Stat label="IN CORSO" value={`${totals?.in_progress ?? 0}`} data-testid="stat-in-progress" />
            </div>
            <ProgressBar percent={totals?.percent ?? 0} height={14} data-testid="global-progress-bar" />
          </section>
          {active.length > 0 && <ActiveNow active={active} />}
        </aside>
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </>
  );
}
