import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, logoUrl } from "@/lib/api";
import { Btn } from "@/components/app/ui";

export const LogoSettings = () => {
  const [version, setVersion] = useState(Date.now());
  const [hasLogo, setHasLogo] = useState(true);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file, file.name);
      await api("/settings/logo", { method: "POST", form });
      setHasLogo(true);
      setVersion(Date.now());
      toast.success("Logo aggiornato");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      input.current.value = "";
    }
  };

  const remove = async () => {
    try {
      await api("/settings/logo", { method: "DELETE" });
      setHasLogo(false);
      toast.success("Logo rimosso");
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <section className="panel" data-testid="logo-settings">
      <h2 className="section-title mb-3">LOGO AZIENDALE SULLE ETICHETTE</h2>
      <div className="logo-box">
        {hasLogo ? (
          <img src={logoUrl(version)} alt="Logo aziendale" className="h-full w-full object-contain" onError={() => setHasLogo(false)} data-testid="logo-preview" />
        ) : (
          <span className="lbl">Nessun logo caricato</span>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} data-testid="logo-file-input" />
      <div className="flex gap-3 mt-3">
        <Btn label={hasLogo ? "CAMBIA LOGO" : "CARICA LOGO"} icon={ImagePlus} onClick={() => input.current.click()} loading={busy} className="flex-1" data-testid="upload-logo-button" />
        {hasLogo && <Btn label="RIMUOVI" icon={Trash2} variant="outline" onClick={remove} className="flex-1" data-testid="remove-logo-button" />}
      </div>
    </section>
  );
};
