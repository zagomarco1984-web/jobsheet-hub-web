import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AlertOctagon, LogIn, Wrench, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Btn, Field } from "@/components/app/ui";

const HERO = "https://images.pexels.com/photos/12951636/pexels-photo-12951636.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1200";

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Inserisci email e password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      <div className="login-hero" style={{ backgroundImage: `linear-gradient(rgba(10,10,10,0.25), rgba(10,10,10,0.92)), url(${HERO})` }}>
        <div className="flex flex-col gap-3 rise">
          <span className="brand-box h-14 w-14"><Wrench className="h-7 w-7" /></span>
          <span className="kicker text-[#8DB0C7]">SCHEDE TECNICHE DI LAVORAZIONE</span>
          <h1 className="font-display text-white font-bold text-5xl lg:text-7xl leading-[0.95]">OFFICINA<br />LAVORI</h1>
          <span className="flex items-center gap-2 text-sm text-neutral-300 mt-2">
            <RefreshCw className="h-4 w-4" /> Versione web · dati sincronizzati con l'app mobile
          </span>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col justify-center gap-4 p-8 lg:p-16 max-w-xl w-full mx-auto rise" style={{ animationDelay: "120ms" }}>
        <h2 className="font-display text-3xl font-bold">Accedi</h2>
        <p className="text-sm text-neutral-600">Usa le stesse credenziali dell'app mobile.</p>
        <Field label="EMAIL">
          <input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@azienda.it" autoComplete="username" data-testid="login-email-input" />
        </Field>
        <Field label="PASSWORD">
          <input className="in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" data-testid="login-password-input" />
        </Field>
        {error && (
          <div className="error-box" data-testid="login-error">
            <AlertOctagon className="h-5 w-5" /> <span>{error}</span>
          </div>
        )}
        <Btn type="submit" label="ACCEDI" icon={LogIn} size="lg" loading={loading} onClick={undefined} data-testid="login-submit-button" className="mt-2" />
      </form>
    </div>
  );
}
