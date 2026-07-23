"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Client unlock form — page is noindex via coming-soon-era robots defaults on sibling routes. */
export default function PreviewAccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/preview-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError(
          response.status === 503
            ? "Preview password is not configured yet."
            : "Wrong password."
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not unlock the site. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 py-16 text-ink">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Preview access</h1>
        <p className="mt-2 text-sm text-muted">
          The public site shows “under construction”. Enter the preview password to review the full
          website on this domain.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-left text-sm font-semibold">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-base font-normal"
              required
            />
          </label>

          {error ? <p className="text-sm text-[#8a2b12]">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-cream disabled:opacity-60"
          >
            {pending ? "Unlocking…" : "Unlock site"}
          </button>
        </form>
      </div>
    </main>
  );
}
