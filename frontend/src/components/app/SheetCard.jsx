import { Link } from "react-router-dom";
import { Check, Play, Clock, FolderOpen, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/app/ui";
import { formatHours } from "@/lib/format";

export function groupByCustomer(sheets) {
  const map = new Map();
  sheets.forEach((sh) => {
    const name = sh.customer || "SENZA CLIENTE";
    const g = map.get(name) ?? { name, sheets: [], total: 0, done: 0, in_progress: 0, seconds: 0 };
    g.sheets.push(sh);
    g.total += sh.progress.total;
    g.done += sh.progress.done;
    g.in_progress += sh.progress.in_progress;
    g.seconds += sh.progress.seconds;
    map.set(name, g);
  });
  return [...map.values()]
    .map((g) => ({ ...g, percent: g.total ? (g.done * 100) / g.total : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const SheetCard = ({ item }) => (
  <Link to={`/sheet/${item.id}`} className="card card-hover rise" data-testid={`sheet-card-${item.id}`}>
    <div className="flex justify-between gap-3">
      <div className="min-w-0">
        <div className="card-title line-clamp-2">{item.title}</div>
        <div className="lbl mt-1">
          {item.phases.filter((p) => p.required).length} FASI · {item.progress.total} STEP
        </div>
      </div>
      <div className="pct">{Math.round(item.progress.percent)}%</div>
    </div>
    <ProgressBar percent={item.progress.percent} />
    <div className="flex flex-wrap gap-4 lbl">
      <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {item.progress.done} FATTI</span>
      <span className="flex items-center gap-1 text-brand"><Play className="h-3.5 w-3.5" /> {item.progress.in_progress} IN CORSO</span>
      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatHours(item.progress.seconds)}</span>
    </div>
  </Link>
);

export const CustomerFolder = ({ group }) => (
  <Link to={`/customer/${encodeURIComponent(group.name)}`} className="card card-hover folder rise" data-testid={`customer-folder-${group.name}`}>
    <div className="folder-icon"><FolderOpen className="h-7 w-7" /></div>
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <div className="flex justify-between gap-2">
        <div className="card-title line-clamp-2">{group.name}</div>
        <div className="pct">{Math.round(group.percent)}%</div>
      </div>
      <ProgressBar percent={group.percent} height={8} />
      <div className="lbl">
        {group.sheets.length} SCHEDE · {formatHours(group.seconds)}
        {group.in_progress > 0 ? ` · ${group.in_progress} IN CORSO` : ""}
      </div>
    </div>
    <ChevronRight className="h-6 w-6 shrink-0" />
  </Link>
);
