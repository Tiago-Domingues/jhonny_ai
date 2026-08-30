"use client";

import { useRouter } from "next/navigation";

export type AdminTab = "clientes" | "encomendas" | "analytics";

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: "clientes", label: "Clientes" },
  { id: "encomendas", label: "Encomendas" },
  { id: "analytics", label: "Analytics" },
];

export function AdminNav({ tab }: { tab: AdminTab }) {
  const router = useRouter();
  return (
    <nav className="mt-8 flex flex-wrap gap-2">
      {tabs.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => router.replace(`/admin?tab=${item.id}`, { scroll: false })}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
              active ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-cream"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
