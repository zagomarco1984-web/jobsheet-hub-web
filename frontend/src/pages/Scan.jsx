import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Camera, ChevronRight, QrCode } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatHours } from "@/lib/format";
import { Btn, Modal, PageHeader, StatusBadge } from "@/components/app/ui";

// QR first line: OFFLAV|POS|<sheetId>|<pos>  or  OFFLAV|SFRIDO|<scrapId>
export function parseCode(raw) {
  const p = raw.trim().split(/\r?\n/)[0].trim().split("|");
  if (p[1] === "POS" && p[2] && p[3]) return { kind: "pos", sheetId: p[2], pos: p[3] };
  if (p[1] === "SFRIDO" && p[2]) return { kind: "scrap", id: p[2] };
  return null;
}

const Camera_ = ({ onCode, paused }) => {
  const video = useRef(null);
  useEffect(() => {
    let stream, timer, stopped = false;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((s) => {
      if (stopped) return s.getTracks().forEach((t) => t.stop());
      stream = s;
      video.current.srcObject = s;
      video.current.play();
      timer = setInterval(async () => {
        if (paused.current || !video.current?.videoWidth) return;
        const codes = await detector.detect(video.current).catch(() => []);
        if (codes[0]) onCode(codes[0].rawValue);
      }, 400);
    }).catch(() => toast.error("Fotocamera non disponibile"));
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onCode, paused]);
  return <video ref={video} className="w-full h-full object-cover" muted playsInline data-testid="scanner-video" />;
};

export default function Scan() {
  const nav = useNavigate();
  const [position, setPosition] = useState(null);
  const [manual, setManual] = useState("");
  const [cam, setCam] = useState(false);
  const busy = useRef(false);
  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices;

  const handle = useRef(null);
  handle.current = async (raw) => {
    if (busy.current) return;
    const code = parseCode(raw);
    busy.current = true;
    if (!code) {
      toast.error("QR non riconosciuto: usa le etichette dell'app");
      setTimeout(() => { busy.current = false; }, 2000);
      return;
    }
    try {
      if (code.kind === "scrap") nav(`/scrap/${code.id}`);
      else setPosition(await api(`/positions/${code.sheetId}/${encodeURIComponent(code.pos)}`));
    } catch (e) {
      toast.error(e.message);
      setTimeout(() => { busy.current = false; }, 1500);
    }
  };
  const onCode = useRef((raw) => handle.current(raw)).current;

  const submitManual = (e) => {
    e.preventDefault();
    const v = manual.trim();
    if (!v) return;
    handle.current(v.startsWith("OFFLAV") ? v : /^[a-f0-9]{24}$/i.test(v) ? `OFFLAV|SFRIDO|${v}` : v);
  };
  const close = () => { setPosition(null); setTimeout(() => { busy.current = false; }, 800); };

  return (
    <>
      <PageHeader title="Scansiona etichetta" subtitle="POSIZIONI E SFRIDI" back />
      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <section className="scanner" data-testid="scanner-area">
          {cam ? <Camera_ onCode={onCode} paused={busy} /> : (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8 h-full" data-testid="camera-permission-box">
              <QrCode className="h-14 w-14 text-[#8DB0C7]" />
              <div className="font-bold tracking-widest text-white">INQUADRA IL QR DELL'ETICHETTA</div>
              <p className="text-sm text-neutral-400">{canScan ? "Serve la fotocamera per leggere le etichette di posizioni e sfridi." : "Questo browser non legge i QR dalla fotocamera: inserisci il codice qui accanto."}</p>
              {canScan && <Btn label="ATTIVA FOTOCAMERA" icon={Camera} onClick={() => setCam(true)} data-testid="camera-allow-button" />}
            </div>
          )}
        </section>
        <form onSubmit={submitManual} className="panel h-fit flex flex-col gap-3">
          <h2 className="section-title">OPPURE INSERISCI IL CODICE</h2>
          <input className="in" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="OFFLAV|POS|… oppure codice sfrido" autoCapitalize="none" data-testid="manual-code-input" />
          <Btn type="submit" label="APRI" icon={ArrowRight} variant="inverse" onClick={undefined} data-testid="manual-code-submit" />
        </form>
      </div>
      <Modal open={!!position} onClose={close} title={position ? `POS ${position.pos} · ${position.sheet_title}` : ""} testid="position-sheet">
        {position && (
          <>
            <p className="text-sm text-neutral-600">
              {position.customer}{position.ref["Bending radius"] ? ` · R ${position.ref["Bending radius"]}` : ""}{position.ref["N° Tot."] ? ` · ${position.ref["N° Tot."]} pz` : ""}
            </p>
            <span className="lbl">SCEGLI LA FASE</span>
            {position.steps.map((st) => (
              <button key={st.id} type="button" className={`session-row ${st.required ? "" : "opacity-50"}`} onClick={() => { busy.current = false; nav(`/step/${st.id}`); }} data-testid={`scan-phase-${st.id}`}>
                <span className="flex-1 text-left flex flex-col gap-1">
                  <span className="font-semibold">{st.phase_name}</span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={st.status} />
                    {!st.required && <span className="lbl">NON PREVISTA</span>}
                    {st.seconds > 0 && <span className="lbl">{formatHours(st.seconds)}</span>}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ))}
          </>
        )}
      </Modal>
    </>
  );
}
