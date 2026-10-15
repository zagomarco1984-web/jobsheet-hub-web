import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";

export const OperatorPicker = ({ value, onChange, testid }) => {
  const [text, setText] = useState("");
  const names = useQuery({ queryKey: ["operator-names"], queryFn: () => api("/operator-names") });
  const has = (n) => value.some((x) => x.toLowerCase() === n.toLowerCase());
  const add = (n) => {
    const name = n.trim();
    if (name && !has(name)) onChange([...value, name]);
    setText("");
  };
  const suggestions = (names.data ?? []).filter((n) => !has(n) && n.toLowerCase().includes(text.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-2" data-testid={testid}>
      <div className="flex flex-wrap gap-2">
        {value.length === 0 && <span className="text-sm text-neutral-500">Nessun operatore</span>}
        {value.map((n, i) => (
          <button key={n} type="button" className="op-chip" onClick={() => onChange(value.filter((x) => x !== n))} data-testid={`${testid}-chip-${i}`}>
            {n} <X className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="in flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(text))}
          placeholder="Aggiungi operatore..."
          data-testid={`${testid}-input`}
        />
        <button type="button" className="icon-btn icon-btn-lg" disabled={!text.trim()} onClick={() => add(text)} data-testid={`${testid}-add`}>
          <Plus className="h-6 w-6 text-brand" />
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((n, i) => (
            <button key={n} type="button" className="sugg" onClick={() => add(n)} data-testid={`${testid}-suggestion-${i}`}>
              <Plus className="h-3.5 w-3.5" /> {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
