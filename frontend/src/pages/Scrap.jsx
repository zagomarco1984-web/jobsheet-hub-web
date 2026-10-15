import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, QrCode, Warehouse } from "lucide-react";
import { api, labelsUrl, openPdf } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Btn, ErrorBlock, Loading, PageHeader } from "@/components/app/ui";

export default function Scrap() {
  const { id } = useParams();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ["scrap", id], queryFn: () => api(`/scraps/${id}`) });
  if (q.isLoading) return <Loading />;
  const d = q.data;
  if (q.isError || !d) return (<><PageHeader title="Sfrido" back /><ErrorBlock message={q.error?.message ?? "Errore"} onRetry={() => q.refetch()} /></>);
  const rows = [
    ["CLIENTE", d.customer], ["MATERIALE", d.material], ["DIAMETRO", d.diameter], ["SPESSORE", d.thickness],
    ["PROVENIENZA", d.origin], ["USATO IN", d.used_in_title || "—"], ["INSERITO", `${formatDateTime(d.created_at)} · ${d.created_by}`],
  ];

  return (
    <>
      <PageHeader title="Sfrido" subtitle={`ID ${d.id.slice(-6).toUpperCase()}`} back />
      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <section className={`summary ${d.status === "used" ? "opacity-70" : ""}`} data-testid="scrap-detail-hero">
          <div className="lbl text-[#8DB0C7]">{d.status === "used" ? "GIÀ USATO" : "DISPONIBILE"}</div>
          <div className="timer" data-testid="scrap-detail-length">{String(d.length).replace(".", ",")} MM</div>
        </section>
        <section className="panel">
          {rows.map(([k, v]) => <div key={k} className="kv"><span className="lbl">{k}</span><span className="kv-val">{v || "—"}</span></div>)}
        </section>
        <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
          {d.source_sheet && <Btn label="APRI SCHEDA DI PROVENIENZA" icon={FileText} variant="outline" onClick={() => nav(`/sheet/${d.source_sheet}`)} data-testid="scrap-open-source" />}
          <Btn label="RISTAMPA ETICHETTA" icon={QrCode} variant="inverse" onClick={() => openPdf(labelsUrl(`/scraps/labels.pdf?ids=${d.id}`))} data-testid="scrap-print-label" />
          <Btn label="MAGAZZINO SFRIDI" icon={Warehouse} variant="outline" onClick={() => nav("/scraps")} data-testid="scrap-open-warehouse" />
        </div>
      </div>
    </>
  );
}
