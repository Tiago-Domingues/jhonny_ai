"use client";

import { FormEvent, useEffect, useState } from "react";

type SessionUser = {
  id: string;
  email: string;
  username: string;
  fullName?: string;
} | null;

const customerTypes = [
  ["PROFESSIONAL", "Professional"],
  ["SURFER", "Surfer"],
  ["BODYBOARDER", "Bodyboarder"],
  ["LONGBOARDER", "Longboarder"],
  ["BEGINNER", "Beginner"],
  ["TOURIST", "Tourist"],
  ["ERASMUS_STUDENT", "Erasmus / estudante"],
  ["SURF_PARENT", "Surf parent"],
  ["LOCAL_CUSTOMER", "Local customer"],
  ["OTHER", "Other"],
];

const dialCodes = [
  ["+351", "PT +351"],
  ["+34", "ES +34"],
  ["+33", "FR +33"],
  ["+44", "UK +44"],
  ["+49", "DE +49"],
  ["+39", "IT +39"],
  ["+31", "NL +31"],
  ["+1", "US/CA +1"],
];

function EyeIcon({ open, className = "" }: { open: boolean; className?: string }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.58 10.58a2 2 0 002.83 2.83" strokeLinecap="round" />
        <path
          d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.66 11.66 0 01-2.16 3.19M6.61 6.61C4.62 7.9 3.06 9.71 2 12c1.73 3.89 6 7 10 7a10.5 10.5 0 004.39-.93"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordField({
  name = "password",
  placeholder = "Password",
  required = false,
  autoComplete,
}: {
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative min-w-0">
      <input
        name={name}
        required={required}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-2xl border border-line px-4 py-3 pr-12"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-ink"
      >
        <EyeIcon open={visible} className="h-5 w-5" />
      </button>
    </div>
  );
}

function PhoneFields({
  defaultCountryCode = "+351",
  defaultPhone = "",
}: {
  defaultCountryCode?: string;
  defaultPhone?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[6.75rem_minmax(0,1fr)] gap-2">
      <select
        name="phoneCountryCode"
        defaultValue={defaultCountryCode}
        aria-label="Country code"
        className="min-w-0 w-full truncate rounded-2xl border border-line px-2 py-3 text-sm"
      >
        {dialCodes.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <input
        name="phone"
        defaultValue={defaultPhone}
        placeholder="Mobile"
        className="min-w-0 w-full rounded-2xl border border-line px-4 py-3"
      />
    </div>
  );
}

export function AccountClient() {
  const [user, setUser] = useState<SessionUser>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, string | boolean | null> | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const loadedProfile = data?.user?.profile || null;
        setProfile(loadedProfile);
        setBillingSameAsShipping(loadedProfile?.billingSameAsShipping ?? true);
      })
      .catch(() => undefined);
  }, [user]);

  async function submit(path: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        marketingOptIn: form.get("marketingOptIn") === "on",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Não foi possível concluir o pedido.");
      return;
    }
    setUser(data.user);
    setMessage("Conta pronta.");
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        billingSameAsShipping,
        marketingOptIn: form.get("marketingOptIn") === "on",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Could not save your profile.");
      return;
    }
    setProfile(data.profile);
    setUser(user ? { ...user, fullName: data.profile.fullName } : user);
    setMessage("Profile saved.");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Active session</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold uppercase">Hi, {profile?.fullName || user.fullName || user.username}</h2>
          <p className="mt-2 text-muted">{user.email}</p>
          <div className="mt-6 grid gap-3">
            <a href="/checkout" className="rounded-2xl bg-ink px-5 py-4 text-center text-sm font-bold uppercase tracking-wide text-white">
              Go to checkout
            </a>
            <button onClick={logout} className="rounded-2xl border border-line px-5 py-4 text-sm font-bold uppercase tracking-wide">
              Sign out
            </button>
          </div>
          {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-muted">{message}</p>}
        </aside>

        <form key={String(profile?.id || "profile-loading")} onSubmit={saveProfile} className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Profile</p>
              <p className="mt-2 text-sm text-muted">Keep your details ready for faster checkouts.</p>
              <p className="mt-3 text-sm">
                <a href="/encomendas" className="font-semibold text-ink underline underline-offset-2">
                  Ver as minhas encomendas
                </a>
              </p>
            </div>
            <input name="fullName" required defaultValue={String(profile?.fullName || user.fullName || "")} placeholder="Full name" className="rounded-2xl border border-line px-4 py-3" />
            <input name="birthDate" type="date" defaultValue={profile?.birthDate ? String(profile.birthDate).slice(0, 10) : ""} className="rounded-2xl border border-line px-4 py-3" />
            <select name="gender" defaultValue={String(profile?.gender || "")} className="rounded-2xl border border-line px-4 py-3">
              <option value="">Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
            <select name="customerType" defaultValue={String(profile?.customerType || "SURFER")} className="rounded-2xl border border-line px-4 py-3">
              {customerTypes.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <PhoneFields
              defaultCountryCode={String(profile?.phoneCountryCode || "+351")}
              defaultPhone={String(profile?.phone || "")}
            />
            <select name="preferredLanguage" defaultValue={String(profile?.preferredLanguage || "en")} className="rounded-2xl border border-line px-4 py-3">
              <option value="en">English</option>
              <option value="pt">Português</option>
              <option value="zh">中文</option>
            </select>

            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Shipping address</p>
            </div>
            <input name="addressLine1" defaultValue={String(profile?.addressLine1 || "")} placeholder="Address" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
            <input name="addressLine2" defaultValue={String(profile?.addressLine2 || "")} placeholder="Apartment, floor, notes" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
            <input name="postalCode" defaultValue={String(profile?.postalCode || "")} placeholder="Postal code" className="rounded-2xl border border-line px-4 py-3" />
            <input name="city" defaultValue={String(profile?.city || "")} placeholder="City" className="rounded-2xl border border-line px-4 py-3" />
            <input name="country" maxLength={2} defaultValue={String(profile?.country || "PT")} placeholder="Country code" className="rounded-2xl border border-line px-4 py-3" />

            <label className="flex items-center gap-2 text-sm text-muted md:col-span-2">
              <input checked={billingSameAsShipping} onChange={(event) => setBillingSameAsShipping(event.currentTarget.checked)} type="checkbox" className="mt-1" />
              Billing address is the same as shipping address
            </label>

            {!billingSameAsShipping && (
              <>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Billing address</p>
                </div>
                <input name="billingAddressLine1" defaultValue={String(profile?.billingAddressLine1 || "")} placeholder="Billing address" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
                <input name="billingAddressLine2" defaultValue={String(profile?.billingAddressLine2 || "")} placeholder="Billing address details" className="rounded-2xl border border-line px-4 py-3 md:col-span-2" />
                <input name="billingPostalCode" defaultValue={String(profile?.billingPostalCode || "")} placeholder="Billing postal code" className="rounded-2xl border border-line px-4 py-3" />
                <input name="billingCity" defaultValue={String(profile?.billingCity || "")} placeholder="Billing city" className="rounded-2xl border border-line px-4 py-3" />
                <input name="billingCountry" maxLength={2} defaultValue={String(profile?.billingCountry || "PT")} placeholder="Billing country code" className="rounded-2xl border border-line px-4 py-3" />
              </>
            )}

            <label className="flex items-start gap-2 text-sm text-muted md:col-span-2">
              <input name="marketingOptIn" defaultChecked={Boolean(profile?.marketingOptIn)} type="checkbox" className="mt-1" />
              I want to receive Jhonny drops, campaigns, and cart reminders.
            </label>
            <button className="rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white md:col-span-2">Save profile</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Jhonny account</p>
        <h2 className="font-display mt-2 text-3xl font-extrabold uppercase">Join the family</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Create an account to save your profile, addresses, preferences, and order history. You can still shop as a guest at checkout.
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => setMode("login")} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "login" ? "bg-ink text-white" : "border border-line"}`}>
            Sign in
          </button>
          <button onClick={() => setMode("register")} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === "register" ? "bg-ink text-white" : "border border-line"}`}>
            Create account
          </button>
        </div>
        {message && <p className="mt-4 rounded-xl bg-cream p-3 text-sm text-muted">{message}</p>}
      </aside>

      {mode === "login" ? (
        <form onSubmit={(event) => submit("/api/auth/login", event)} className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <input name="emailOrUsername" required placeholder="Email or username" className="rounded-2xl border border-line px-4 py-3" />
            <PasswordField required autoComplete="current-password" />
            <button className="rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white">Sign in</button>
          </div>
        </form>
      ) : (
        <form onSubmit={(event) => submit("/api/auth/register", event)} className="min-w-0 overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="fullName" required placeholder="Full name" className="min-w-0 rounded-2xl border border-line px-4 py-3" />
            <input name="username" required placeholder="Username" className="min-w-0 rounded-2xl border border-line px-4 py-3" />
            <input name="email" required type="email" placeholder="Email" className="min-w-0 rounded-2xl border border-line px-4 py-3" />
            <PhoneFields />
            <PasswordField required autoComplete="new-password" />
            <select name="customerType" defaultValue="SURFER" className="min-w-0 rounded-2xl border border-line px-4 py-3">
              {customerTypes.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="flex items-start gap-2 text-sm text-muted md:col-span-2">
              <input name="marketingOptIn" type="checkbox" className="mt-1" />
              I want to receive Jhonny drops, cart reminders, and campaigns.
            </label>
            <button className="rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white md:col-span-2">Create account</button>
          </div>
        </form>
      )}
    </div>
  );
}
