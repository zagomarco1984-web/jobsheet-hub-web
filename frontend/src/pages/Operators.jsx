import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, HardHat, Trash2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Btn, Chip, ErrorBlock, Field, IconBtn, Loading, Modal, PageHeader } from "@/components/app/ui";
import { LogoSettings } from "@/components/app/LogoSettings";

export default function Operators() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const q = useQuery({ queryKey: ["users"], queryFn: () => api("/users"), enabled: isAdmin });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  if (!isAdmin) return <Navigate to="/" replace />;

  const create = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return toast.error("Compila tutti i campi (password min. 6 caratteri)");
    setSaving(true);
    try {
      await api("/users", { method: "POST", body: { name, email, password, role } });
      toast.success("Utente creato");
      setOpen(false);
      setName(""); setEmail(""); setPassword(""); setRole("operator");
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    try {
      await api(`/users/${toDelete.id}`, { method: "DELETE" });
      toast.success("Utente eliminato");
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <PageHeader title="Operatori" subtitle="GESTIONE ACCESSI" back right={<Btn label="NUOVO OPERATORE" icon={UserPlus} onClick={() => setOpen(true)} data-testid="add-user-button" />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {q.isLoading ? <Loading /> : q.isError ? <ErrorBlock message={q.error.message} onRetry={() => q.refetch()} /> : (
          <section className="panel p-0" data-testid="users-list">
            {q.data.map((u) => (
              <div key={u.id} className="scrap-row" data-testid={`user-row-${u.email}`}>
                <span className={`user-icon ${u.role === "admin" ? "user-admin" : ""}`}>{u.role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <HardHat className="h-5 w-5" />}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold">{u.name}</span>
                  <span className="block lbl truncate">{u.email} · {u.role === "admin" ? "ADMIN" : "OPERATORE"}</span>
                </span>
                {u.id !== user.id && <IconBtn icon={Trash2} title="Elimina" onClick={() => setToDelete(u)} data-testid={`delete-user-${u.email}`} />}
              </div>
            ))}
          </section>
        )}
        <LogoSettings />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo utente" testid="add-user-sheet">
        <Field label="NOME"><input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mario Rossi" data-testid="user-name-input" /></Field>
        <Field label="EMAIL"><input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mario@azienda.it" data-testid="user-email-input" /></Field>
        <Field label="PASSWORD"><input className="in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 caratteri" data-testid="user-password-input" /></Field>
        <span className="lbl">RUOLO</span>
        <div className="flex gap-2">
          {["operator", "admin"].map((r) => <Chip key={r} on={role === r} label={r === "admin" ? "AMMINISTRATORE" : "OPERATORE"} onClick={() => setRole(r)} data-testid={`role-${r}`} />)}
        </div>
        <Btn label="CREA UTENTE" icon={Check} onClick={create} loading={saving} data-testid="save-user-button" />
      </Modal>
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title={`Eliminare ${toDelete?.name ?? ""}?`} testid="delete-user-sheet">
        <Btn label="ELIMINA" icon={Trash2} variant="danger" onClick={remove} data-testid="confirm-delete-user-button" />
      </Modal>
    </>
  );
}
