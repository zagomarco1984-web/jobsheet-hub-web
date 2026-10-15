import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertOctagon, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const VARIANTS = {
  primary: "btn-primary",
  outline: "btn-outline",
  inverse: "btn-inverse",
  danger: "btn-danger",
  success: "btn-success",
};

export const Btn = ({ label, icon: Icon, variant = "primary", loading, disabled, onClick, className = "", size, ...rest }) => (
  <button
    type="button"
    className={`btn ${VARIANTS[variant]} ${size === "lg" ? "btn-lg" : ""} ${className}`}
    onClick={onClick}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : Icon ? <Icon className="h-5 w-5" strokeWidth={2.4} /> : null}
    <span>{label}</span>
  </button>
);

export const IconBtn = ({ icon: Icon, onClick, title, ...rest }) => (
  <button type="button" className="icon-btn" onClick={onClick} title={title} aria-label={title} {...rest}>
    <Icon className="h-5 w-5" strokeWidth={2.2} />
  </button>
);

export const ProgressBar = ({ percent, height = 10, ...rest }) => (
  <div className="progress-track" style={{ height }} {...rest}>
    <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
  </div>
);

const STATUS = {
  todo: ["DA FARE", "st-todo"],
  in_progress: ["IN CORSO", "st-progress"],
  paused: ["IN PAUSA", "st-paused"],
  done: ["FATTO", "st-done"],
};
export const StatusBadge = ({ status, ...rest }) => {
  const [label, cls] = STATUS[status] ?? STATUS.todo;
  return (
    <span className={`status ${cls}`} {...rest}>
      {label}
    </span>
  );
};

export const PageHeader = ({ title, subtitle, back, right }) => {
  const nav = useNavigate();
  return (
    <div className="page-header rise">
      <div className="flex items-start gap-4 min-w-0">
        {back && <IconBtn icon={ArrowLeft} onClick={() => nav(-1)} title="Indietro" data-testid="back-button" />}
        <div className="min-w-0">
          {subtitle && <div className="kicker truncate" data-testid="page-subtitle">{subtitle}</div>}
          <h1 className="page-title" data-testid="page-title">{title}</h1>
        </div>
      </div>
      {right && <div className="flex flex-wrap gap-2 shrink-0">{right}</div>}
    </div>
  );
};

export const Loading = ({ label = "CARICAMENTO..." }) => (
  <div className="flex items-center gap-3 p-10 lbl" data-testid="loading">
    <Loader2 className="h-5 w-5 animate-spin text-brand" /> {label}
  </div>
);

export const ErrorBlock = ({ message, onRetry }) => (
  <div className="error-box m-4" data-testid="error-block">
    <AlertOctagon className="h-5 w-5 shrink-0" />
    <span className="flex-1">{message}</span>
    {onRetry && <Btn label="RIPROVA" icon={RotateCw} variant="inverse" onClick={onRetry} data-testid="retry-button" />}
  </div>
);

export const Modal = ({ open, onClose, title, description, children, testid }) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="modal max-h-[90vh] overflow-y-auto" data-testid={testid}>
      <DialogHeader>
        <DialogTitle className="modal-title">{title}</DialogTitle>
        {description && <DialogDescription className="text-sm text-neutral-600">{description}</DialogDescription>}
      </DialogHeader>
      <div className="flex flex-col gap-3">{children}</div>
    </DialogContent>
  </Dialog>
);

export const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1.5">
    <span className="lbl">{label}</span>
    {children}
  </label>
);

export const Chip = ({ on, label, onClick, brand, ...rest }) => (
  <button type="button" onClick={onClick} className={`chip ${on ? (brand ? "chip-brand" : "chip-on") : ""}`} {...rest}>
    {label}
  </button>
);

export const Stat = ({ label, value, highlight, ...rest }) => (
  <div className={`stat ${highlight ? "stat-hl" : ""}`} {...rest}>
    <div className="lbl">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);
