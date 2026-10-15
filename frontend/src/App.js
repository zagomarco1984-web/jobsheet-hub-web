import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import Shell from "@/components/app/Shell";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Customer from "@/pages/Customer";
import Sheet from "@/pages/Sheet";
import Phase from "@/pages/Phase";
import Step from "@/pages/Step";
import Cutting from "@/pages/Cutting";
import Scraps from "@/pages/Scraps";
import Scrap from "@/pages/Scrap";
import Operators from "@/pages/Operators";
import Scan from "@/pages/Scan";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Home />} />
            <Route path="/customer/:name" element={<Customer />} />
            <Route path="/sheet/:id" element={<Sheet />} />
            <Route path="/phase/:sheetId/:phaseId" element={<Phase />} />
            <Route path="/step/:id" element={<Step />} />
            <Route path="/cutting/:id" element={<Cutting />} />
            <Route path="/scraps" element={<Scraps />} />
            <Route path="/scrap/:id" element={<Scrap />} />
            <Route path="/operators" element={<Operators />} />
            <Route path="/scan" element={<Scan />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" toastOptions={{ className: "toast" }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
