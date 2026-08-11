"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";

type SessionUser = {
  id: string;
  email: string;
  username: string;
  fullName?: string;
} | null;

const customerTypes = [
  ["PROFESSIONAL", "Professional"],
  ["SURFER", "Surfer"],
  ["BEGINNER", "Beginner"],
  ["TOURIST", "Tourist"],
  ["ERASMUS_STUDENT", "Erasmus / estudante"],
  ["SURF_PARENT", "Surf parent"],
  ["LOCAL_CUSTOMER", "Local customer"],
  ["BODYBOARDER", "Bodyboarder"],
  ["LONGBOARDER", "Longboarder"],
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

const fieldClass =
  "w-full min-w-0 rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

const selectClass = `${fieldClass} appearance-none bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`;
const selectChevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

function Field({
  label,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={`grid gap-1.5 ${className}`}>
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function AccountClient() {
  const [user, setUser] = useState<SessionUser>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">("info");
  const [profile, setProfile] = useState<Record<string, string | boolean | null> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => undefined);

    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    const messages: Record<string, string> = {
      google_auth_failed: "Não foi possível entrar com Google. Tenta outra vez.",
      google_auth_denied: "Login com Google cancelado.",
      google_not_configured: "Google sign-in ainda não está configurado neste ambiente.",
    };
    setMessageTone("error");
    setMessage(messages[error] || "Não foi possível entrar com Google.");
    window.history.replaceState({}, "", "/conta");
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    fetch("/api/profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const loadedProfile = data?.user?.profile || null;
        setProfile(loadedProfile);
        setBillingSameAsShipping(loadedProfile?.billingSameAsShipping ?? true);
      })
      .catch(() => undefined)
      .finally(() => setProfileLoading(false));
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
      setMessageTone("error");
      setMessage(data.message || "Não foi possível concluir o pedido.");
      return;
    }
    setUser(data.user);
    setMessageTone("success");
    setMessage("Conta pronta.");
    window.dispatchEvent(new Event("jss-cart-updated"));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveStatus("idle");
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
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
        setSaveStatus("error");
        setMessageTone("error");
        setMessage(data.message || "Could not save your profile.");
        return;
      }
      setProfile(data.profile);
      setUser(user ? { ...user, fullName: data.profile.fullName } : user);
      setSaveStatus("success");
      setMessageTone("success");
      setMessage("Profile saved.");
    } catch {
      setSaveStatus("error");
      setMessageTone("error");
      setMessage("Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setProfile(null);
    setSaveStatus("idle");
    setMessage(null);
  }

  if (user) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.25fr)]">
        <aside className="h-fit rounded-3xl border border-line bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Active session</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold uppercase leading-tight">
            Hi, {profile?.fullName || user.fullName || user.username}
          </h2>
          <p className="mt-2 break-all text-muted">{user.email}</p>
          <div className="mt-6 grid gap-3">
            <a
              href="/checkout"
              className="rounded-2xl bg-ink px-5 py-4 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-ink/90 active:scale-[0.98]"
            >
              Go to checkout
            </a>
            <button
              onClick={logout}
              className="rounded-2xl border border-line px-5 py-4 text-sm font-bold uppercase tracking-wide transition hover:bg-cream active:scale-[0.98]"
            >
              Sign out
            </button>
          </div>
        </aside>

        <form
          key={String(profile?.id || (profileLoading ? "loading" : "empty"))}
          onSubmit={saveProfile}
          className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Profile</p>
            <p className="mt-2 text-sm text-muted">
              Keep your details ready for faster checkouts and Odoo customer sync.
            </p>
          </div>

          {profileLoading ? (
            <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-cream md:col-span-1" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={String(profile?.fullName || user.fullName || "")}
                  placeholder="Full name"
                  className={fieldClass}
                />
              </Field>
              <Field label="Birth date" htmlFor="birthDate">
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={profile?.birthDate ? String(profile.birthDate).slice(0, 10) : ""}
                  className={fieldClass}
                />
              </Field>
              <Field label="Gender" htmlFor="gender">
                <select
                  id="gender"
                  name="gender"
                  defaultValue={String(profile?.gender || "")}
                  className={selectClass}
                  style={{ backgroundImage: selectChevron }}
                >
                  <option value="">Prefer not to say</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="NON_BINARY">Non-binary</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Customer type" htmlFor="customerType">
                <select
                  id="customerType"
                  name="customerType"
                  defaultValue={String(profile?.customerType || "SURFER")}
                  className={selectClass}
                  style={{ backgroundImage: selectChevron }}
                >
                  {customerTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mobile" className="md:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)]">
                  <select
                    name="phoneCountryCode"
                    aria-label="Country code"
                    defaultValue={String(profile?.phoneCountryCode || "+351")}
                    className={selectClass}
                    style={{ backgroundImage: selectChevron }}
                  >
                    {dialCodes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    name="phone"
                    defaultValue={String(profile?.phone || "")}
                    placeholder="Mobile number"
                    inputMode="tel"
                    className={fieldClass}
                  />
                </div>
              </Field>

              <Field label="Preferred language" htmlFor="preferredLanguage">
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  defaultValue={String(profile?.preferredLanguage || "en")}
                  className={selectClass}
                  style={{ backgroundImage: selectChevron }}
                >
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="zh">中文</option>
                </select>
              </Field>
              <Field label="Country" htmlFor="country">
                <input
                  id="country"
                  name="country"
                  maxLength={2}
                  defaultValue={String(profile?.country || "PT")}
                  placeholder="PT"
                  className={fieldClass}
                />
              </Field>

              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Shipping address</p>
              </div>
              <Field label="Address" htmlFor="addressLine1" className="md:col-span-2">
                <input
                  id="addressLine1"
                  name="addressLine1"
                  defaultValue={String(profile?.addressLine1 || "")}
                  placeholder="Street and number"
                  className={fieldClass}
                />
              </Field>
              <Field label="Apartment, floor, notes" htmlFor="addressLine2" className="md:col-span-2">
                <input
                  id="addressLine2"
                  name="addressLine2"
                  defaultValue={String(profile?.addressLine2 || "")}
                  placeholder="Apartment, floor, notes"
                  className={fieldClass}
                />
              </Field>
              <Field label="Postal code" htmlFor="postalCode">
                <input
                  id="postalCode"
                  name="postalCode"
                  defaultValue={String(profile?.postalCode || "")}
                  placeholder="Postal code"
                  className={fieldClass}
                />
              </Field>
              <Field label="City" htmlFor="city">
                <input
                  id="city"
                  name="city"
                  defaultValue={String(profile?.city || "")}
                  placeholder="City"
                  className={fieldClass}
                />
              </Field>

              <label className="flex items-start gap-3 text-sm text-muted md:col-span-2">
                <input
                  checked={billingSameAsShipping}
                  onChange={(event) => setBillingSameAsShipping(event.currentTarget.checked)}
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-ink"
                />
                <span>Billing address is the same as shipping address</span>
              </label>

              {!billingSameAsShipping && (
                <>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Billing address</p>
                  </div>
                  <Field label="Billing address" htmlFor="billingAddressLine1" className="md:col-span-2">
                    <input
                      id="billingAddressLine1"
                      name="billingAddressLine1"
                      defaultValue={String(profile?.billingAddressLine1 || "")}
                      placeholder="Billing address"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Billing address details" htmlFor="billingAddressLine2" className="md:col-span-2">
                    <input
                      id="billingAddressLine2"
                      name="billingAddressLine2"
                      defaultValue={String(profile?.billingAddressLine2 || "")}
                      placeholder="Billing address details"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Billing postal code" htmlFor="billingPostalCode">
                    <input
                      id="billingPostalCode"
                      name="billingPostalCode"
                      defaultValue={String(profile?.billingPostalCode || "")}
                      placeholder="Billing postal code"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Billing city" htmlFor="billingCity">
                    <input
                      id="billingCity"
                      name="billingCity"
                      defaultValue={String(profile?.billingCity || "")}
                      placeholder="Billing city"
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Billing country" htmlFor="billingCountry" className="md:col-span-2">
                    <input
                      id="billingCountry"
                      name="billingCountry"
                      maxLength={2}
                      defaultValue={String(profile?.billingCountry || "PT")}
                      placeholder="PT"
                      className={fieldClass}
                    />
                  </Field>
                </>
              )}

              <label className="flex items-start gap-3 text-sm text-muted md:col-span-2">
                <input
                  name="marketingOptIn"
                  defaultChecked={Boolean(profile?.marketingOptIn)}
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-ink"
                />
                <span>I want to receive Jhonny drops, campaigns, and cart reminders.</span>
              </label>

              <div className="grid gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-ink px-5 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving profile…" : "Save profile"}
                </button>
                {(saveStatus === "success" || (message && messageTone === "success")) && (
                  <p
                    role="status"
                    className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink"
                  >
                    Profile saved. Your details are ready for checkout.
                  </p>
                )}
                {(saveStatus === "error" || (message && messageTone === "error")) && (
                  <p role="alert" className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-muted">
                    {message || "Could not save your profile."}
                  </p>
                )}
              </div>
            </div>
          )}
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
          <button
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "login" ? "bg-ink text-white" : "border border-line hover:bg-cream"}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "register" ? "bg-ink text-white" : "border border-line hover:bg-cream"}`}
          >
            Create account
          </button>
        </div>
        {message && (
          <p
            className={`mt-4 rounded-xl p-3 text-sm ${messageTone === "error" ? "bg-cream text-muted" : "bg-cream font-semibold text-ink"}`}
          >
            {message}
          </p>
        )}
      </aside>

      {mode === "login" ? (
        <form onSubmit={(event) => submit("/api/auth/login", event)} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-bold tracking-wide text-ink transition hover:bg-cream"
            >
              <GoogleMark />
              Continuar com Google
            </a>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
              <span className="h-px flex-1 bg-line" />
              ou
              <span className="h-px flex-1 bg-line" />
            </div>
            <input name="emailOrUsername" required placeholder="Email or username" className={fieldClass} />
            <input name="password" required type="password" placeholder="Password" className={fieldClass} />
            <button className="rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md active:scale-[0.98]">
              Sign in
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={(event) => submit("/api/auth/register", event)} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <a
              href="/api/auth/google"
              className="flex items-center justify-center gap-3 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-bold tracking-wide text-ink transition hover:bg-cream md:col-span-2"
            >
              <GoogleMark />
              Criar conta com Google
            </a>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted md:col-span-2">
              <span className="h-px flex-1 bg-line" />
              ou
              <span className="h-px flex-1 bg-line" />
            </div>
            <input name="fullName" required placeholder="Full name" className={fieldClass} />
            <input name="username" required placeholder="Username" className={fieldClass} />
            <input name="email" required type="email" placeholder="Email" className={fieldClass} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)]">
              <select name="phoneCountryCode" defaultValue="+351" className={selectClass} style={{ backgroundImage: selectChevron }}>
                {dialCodes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="phone" placeholder="Mobile" className={fieldClass} />
            </div>
            <input name="password" required type="password" placeholder="Password" className={fieldClass} />
            <select name="customerType" defaultValue="SURFER" className={selectClass} style={{ backgroundImage: selectChevron }}>
              {customerTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-start gap-3 text-sm text-muted md:col-span-2">
              <input name="marketingOptIn" type="checkbox" className="mt-1 size-4 shrink-0 accent-ink" />
              <span>I want to receive Jhonny drops, cart reminders, and campaigns.</span>
            </label>
            <button className="rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md active:scale-[0.98] md:col-span-2">
              Create account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.1 7.1l.1.1 6.2 5.2C37.3 38.9 44 34 44 24c0-1.3-.1-2.5-.4-3.5z" />
    </svg>
  );
}
