import { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { FileSpreadsheet, QrCode, Warehouse, HardHat, LogOut, Wrench } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Btn, Modal } from "@/components/app/ui";

const NAV = [
  { to: "/", label: "Schede", icon: FileSpreadsheet, id: "nav-sheets", end: true },
  { to: "/scan", label: "Scansiona", icon: QrCode, id: "scan-button" },
  { to: "/scraps", label: "Sfridi", icon: Warehouse, id: "scraps-button" },
  { to: "/operators", label: "Operatori", icon: HardHat, id: "operators-button", admin: true },
];

export default function Shell() {
  const { user, logout } = useAuth();
  const [out, setOut] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-white">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="flex items-center gap-3" data-testid="brand-link">
            <span className="brand-box"><Wrench className="h-5 w-5" /></span>
            <span className="brand-name hidden sm:block">OFFICINA LAVORI</span>
          </NavLink>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.filter((n) => !n.admin || isAdmin).map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? "nav-on" : ""}`} data-testid={n.id}>
                <n.icon className="h-4 w-4" /> <span className="hidden md:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <div className="lbl text-[#8DB0C7]">{isAdmin ? "ADMIN" : "OPERATORE"}</div>
              <div className="text-sm font-semibold text-white" data-testid="current-user-name">{user.name}</div>
            </div>
            <button type="button" className="nav-link" onClick={() => setOut(true)} data-testid="logout-button" aria-label="Esci">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="container-app">
        <Outlet />
      </main>
      <Modal open={out} onClose={() => setOut(false)} title="Esci dall'account?" testid="logout-sheet">
        <Btn label="ESCI" icon={LogOut} variant="inverse" onClick={logout} data-testid="confirm-logout-button" />
      </Modal>
    </div>
  );
}
