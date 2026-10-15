import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { api } from "@/lib/api";
import { formatDuration, toTimeInput } from "@/lib/format";
import { Chip, ErrorBlock, Loading, PageHeader, ProgressBar, StatusBadge } from "@/components/app/ui";
import { PhaseParams } from "@/components/app/PhaseParams";

const FILTERS = [
  { key: "all", label: "TUTTI" },
  { key: "todo", label: "DA FARE" },
  { key: "in_progress", label: "IN CORSO" },
  { key: "paused", label: "IN PAUSA" },
  { key: "done", label: "FATTI" },
];

const timeLine = (item) => {
  if (!item.start_at) return "Non avviato";
  if ((item.sessions?.length ?? 0) > 1) return `${item.sessions.length} sessioni · da ${toTimeInput(item.start_at)}`;
  return `${toTimeInput(item.start_at)} → ${item.end_at ? toTimeInput(item.end_at) : item.status === "paused" ? "pausa" : "..."}`;
};

const StepRow = ({ item }) => {
  const r = item.ref ?? {};
  const radius = r["Bending radius"] ?? r["Raggio"];
  return (
    <Link to={`/step/${item.id}`} className="step-row" data-testid={`step-row-${item.pos}`}>
      <span className={`pos-tile pos-${item.status}`}>
        <span className="text-[10px] tracking-widest">POS</span>
        <span className="font-display font-bold text-xl">{item.pos}</span>
      </span>
      <span className="flex-1 min-w-0 flex flex-col gap-1">
        <StatusBadge status={item.status} />
        {radius && (
          <span className="text-sm font-semibold truncate">
            R {radius}{r["N° Tot."] ? ` · ${r["N° Tot."]} PZ` : ""}{r["Cut lenght"] ? ` · TAGLIO ${r["Cut lenght"]}` : ""}
          </span>
        )}
        <span className="lbl truncate">{timeLine(item)}{item.operator ? ` · ${item.operator}` : ""}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        {item.seconds > 0 && <span className="font-bold tabular-nums">{formatDuration(item.seconds)}</span>}
        {item.photos.length > 0 && <span className="lbl flex items-center gap-1"><Camera className="h-3.5 w-3.5" /> {item.photos.length}</span>}
      </span>
    </Link>
  );
};

export default function Phase() {
  const { sheetId, phaseId } = useParams();
  const [filter, setFilter] = useState("all");
  const sheet = useQuery({ queryKey: ["sheet", sheetId], queryFn: () => api(`/sheets/${sheetId}`) });
  const steps = useQuery({ queryKey: ["steps", sheetId, phaseId], queryFn: () => api(`/sheets/${sheetId}/phases/${phaseId}/steps`), refetchInterval: 15000 });
  const phase = sheet.data?.phases.find((p) => p.id === phaseId);
  const data = useMemo(() => (steps.data ?? []).filter((x) => filter === "all" || x.status === filter), [steps.data, filter]);
  const counts = useMemo(() => {
    const c = { all: 0, todo: 0, in_progress: 0, paused: 0, done: 0 };
    (steps.data ?? []).forEach((x) => { c.all++; c[x.status]++; });
    return c;
  }, [steps.data]);
  const pct = counts.all ? (counts.done * 100) / counts.all : 0;

  return (
    <>
      <PageHeader title={phase?.name ?? "Fase"} subtitle={sheet.data?.title} back />
      <section className="panel mb-6">
        <div className="lbl mb-2" data-testid="phase-progress-text">{counts.done}/{counts.all} COMPLETATI · {Math.round(pct)}%</div>
        <ProgressBar percent={pct} />
      </section>
      {phase?.params?.length > 0 && (
        <div className="mb-6"><PhaseParams key={JSON.stringify(phase.params)} sheetId={sheetId} phaseId={phaseId} params={phase.params} /></div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <Chip key={f.key} on={filter === f.key} label={`${f.label} ${counts[f.key]}`} onClick={() => setFilter(f.key)} data-testid={`filter-chip-${f.key}`} />
        ))}
      </div>
      {steps.isLoading ? <Loading /> : steps.isError ? <ErrorBlock message={steps.error.message} onRetry={() => steps.refetch()} /> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="steps-list">
          {data.map((s) => <StepRow key={s.id} item={s} />)}
          {data.length === 0 && <p className="text-neutral-500">Nessuno step in questo filtro.</p>}
        </div>
      )}
    </>
  );
}
