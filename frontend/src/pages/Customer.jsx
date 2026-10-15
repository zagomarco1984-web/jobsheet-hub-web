import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatHours } from "@/lib/format";
import { ErrorBlock, Loading, PageHeader, ProgressBar } from "@/components/app/ui";
import { SheetCard, groupByCustomer } from "@/components/app/SheetCard";

export default function Customer() {
  const { name } = useParams();
  const [search, setSearch] = useState("");
  const q = useQuery({ queryKey: ["sheets"], queryFn: () => api("/sheets"), refetchInterval: 30000 });
  const group = groupByCustomer(q.data ?? []).find((g) => g.name === name);
  const term = search.trim().toLowerCase();
  const data = (group?.sheets ?? []).filter((x) => !term || [x.title, ...x.info.map((i) => i.value)].join(" ").toLowerCase().includes(term));

  return (
    <>
      <PageHeader title={name} subtitle="CARTELLA CLIENTE" back />
      {q.isLoading ? <Loading /> : q.isError ? <ErrorBlock message={q.error.message} onRetry={() => q.refetch()} /> : (
        <>
          <section className="summary rise" data-testid="customer-summary">
            <div className="flex items-end justify-between gap-4">
              <div className="big-pct">{Math.round(group?.percent ?? 0)}%</div>
              <div className="text-right lbl text-neutral-300 flex flex-col gap-1">
                <span>{group?.sheets.length ?? 0} SCHEDE</span>
                <span>{group?.done ?? 0}/{group?.total ?? 0} STEP</span>
                <span>{formatHours(group?.seconds ?? 0)} LAVORATE</span>
              </div>
            </div>
            <ProgressBar percent={group?.percent ?? 0} height={12} />
          </section>
          <div className="search my-6">
            <Search className="h-5 w-5 text-neutral-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca scheda, job, ordine…" data-testid="customer-search-input" />
            {search && <button type="button" onClick={() => setSearch("")} data-testid="customer-clear-search"><XCircle className="h-5 w-5 text-neutral-500" /></button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="customer-sheets-list">
            {data.map((s) => <SheetCard key={s.id} item={s} />)}
            {data.length === 0 && <p className="text-neutral-500">Nessuna scheda trovata.</p>}
          </div>
        </>
      )}
    </>
  );
}
