"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

/** Compact unlock form for the public coming-soon page (both .com and .pt). */
export function PreviewUnlockForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 text-xs font-medium text-muted underline-offset-4 transition hover:text-ink hover:underline"
      >
        Preview access
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 w-full max-w-xs space-y-3 text-left">
      <label className="block text-xs font-semibold text-muted">
        Preview password
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm font-normal text-ink"
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
  );
}
