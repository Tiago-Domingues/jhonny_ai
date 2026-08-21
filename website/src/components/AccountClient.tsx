"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { storefrontText } from "@/lib/storefrontCopy";

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
  const { locale } = useLanguage();
  const copy = storefrontText(locale).account;
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
      setMessage(data.message || copy.submitFailed);
      return;
    }
    setUser(data.user);
    setMessageTone("success");
    setMessage(copy.ready);
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
        setMessage(data.message || copy.saveFailed);
        return;
      }
      setProfile(data.profile);
      setUser(user ? { ...user, fullName: data.profile.fullName } : user);
      setSaveStatus("success");
      setMessageTone("success");
      setMessage(copy.saved);
    } catch {
      setSaveStatus("error");
      setMessageTone("error");
      setMessage(copy.saveFailed);
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.kicker}</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold uppercase leading-tight">
            {copy.hello}, {profile?.fullName || user.fullName || user.username}
          </h2>
          <p className="mt-2 break-all text-muted">{user.email}</p>
          <div className="mt-6 grid gap-3">
            <a
              href="/checkout"
              className="rounded-2xl bg-ink px-5 py-4 text-center text-sm font-bold uppercase tracking-wide text-white transition hover:bg-ink/90 active:scale-[0.98]"
            >
              {copy.shopNow}
            </a>
            <button
              onClick={logout}
              className="rounded-2xl border border-line px-5 py-4 text-sm font-bold uppercase tracking-wide transition hover:bg-cream active:scale-[0.98]"
            >
              {copy.signOut}
            </button>
          </div>
        </aside>

        <form
          key={String(profile?.id || (profileLoading ? "loading" : "empty"))}
          onSubmit={saveProfile}
          className="min-w-0 rounded-3xl border border-line bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.profileKicker}</p>
            <p className="mt-2 text-sm text-muted">{copy.profileIntro}</p>
          </div>

          {profileLoading ? (
            <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-cream md:col-span-1" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label={copy.fullName} htmlFor="fullName">
                <input
                  id="fullName"
                  name="fullName"
                  required
                  defaultValue={String(profile?.fullName || user.fullName || "")}
                  placeholder={copy.fullName}
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.birthDate} htmlFor="birthDate">
                <input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  defaultValue={profile?.birthDate ? String(profile.birthDate).slice(0, 10) : ""}
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.gender} htmlFor="gender">
                <select
                  id="gender"
                  name="gender"
                  defaultValue={String(profile?.gender || "")}
                  className={selectClass}
                  style={{ backgroundImage: selectChevron }}
                >
                  <option value="">{copy.preferNot}</option>
                  <option value="MALE">{copy.male}</option>
                  <option value="FEMALE">{copy.female}</option>
                  <option value="NON_BINARY">{copy.nonBinary}</option>
                  <option value="PREFER_NOT_TO_SAY">{copy.preferNot}</option>
                </select>
              </Field>
              <Field label={copy.customerType} htmlFor="customerType">
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

              <Field label={copy.mobile} className="md:col-span-2">
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
                    placeholder={copy.mobile}
                    inputMode="tel"
                    className={fieldClass}
                  />
                </div>
              </Field>

              <Field label={copy.preferredLanguage} htmlFor="preferredLanguage">
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
              <Field label={copy.country} htmlFor="country">
                <input
                  id="country"
                  name="country"
                  maxLength={2}
                  defaultValue={String(profile?.country || "PT")}
                  placeholder="PT"
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.nif} htmlFor="nif" className="md:col-span-2">
                <input
                  id="nif"
                  name="nif"
                  defaultValue={String(profile?.nif || "").replace(/^PT/, "")}
                  placeholder={copy.nif}
                  className={fieldClass}
                />
                <span className="mt-1 text-xs font-medium normal-case tracking-normal text-muted">{copy.nifHelp}</span>
              </Field>

              <div className="md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.shippingAddress}</p>
              </div>
              <Field label={copy.address} htmlFor="addressLine1" className="md:col-span-2">
                <input
                  id="addressLine1"
                  name="addressLine1"
                  defaultValue={String(profile?.addressLine1 || "")}
                  placeholder={copy.address}
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.addressDetails} htmlFor="addressLine2" className="md:col-span-2">
                <input
                  id="addressLine2"
                  name="addressLine2"
                  defaultValue={String(profile?.addressLine2 || "")}
                  placeholder={copy.addressDetails}
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.postalCode} htmlFor="postalCode">
                <input
                  id="postalCode"
                  name="postalCode"
                  defaultValue={String(profile?.postalCode || "")}
                  placeholder={copy.postalCode}
                  className={fieldClass}
                />
              </Field>
              <Field label={copy.city} htmlFor="city">
                <input
                  id="city"
                  name="city"
                  defaultValue={String(profile?.city || "")}
                  placeholder={copy.city}
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
                <span>{copy.billingSame}</span>
              </label>

              {!billingSameAsShipping && (
                <>
                  <div className="md:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.billingAddress}</p>
                  </div>
                  <Field label={copy.billingAddress} htmlFor="billingAddressLine1" className="md:col-span-2">
                    <input
                      id="billingAddressLine1"
                      name="billingAddressLine1"
                      defaultValue={String(profile?.billingAddressLine1 || "")}
                      placeholder={copy.billingAddress}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={copy.billingDetails} htmlFor="billingAddressLine2" className="md:col-span-2">
                    <input
                      id="billingAddressLine2"
                      name="billingAddressLine2"
                      defaultValue={String(profile?.billingAddressLine2 || "")}
                      placeholder={copy.billingDetails}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={copy.billingPostal} htmlFor="billingPostalCode">
                    <input
                      id="billingPostalCode"
                      name="billingPostalCode"
                      defaultValue={String(profile?.billingPostalCode || "")}
                      placeholder={copy.billingPostal}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={copy.billingCity} htmlFor="billingCity">
                    <input
                      id="billingCity"
                      name="billingCity"
                      defaultValue={String(profile?.billingCity || "")}
                      placeholder={copy.billingCity}
                      className={fieldClass}
                    />
                  </Field>
                  <Field label={copy.billingCountry} htmlFor="billingCountry" className="md:col-span-2">
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
                <span>{copy.marketing}</span>
              </label>

              <div className="grid gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-ink px-5 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? copy.saving : copy.save}
                </button>
                {(saveStatus === "success" || (message && messageTone === "success")) && (
                  <p
                    role="status"
                    className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink"
                  >
                    {copy.saved}
                  </p>
                )}
                {(saveStatus === "error" || (message && messageTone === "error")) && (
                  <p role="alert" className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-muted">
                    {message || copy.saveFailed}
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{copy.joinKicker}</p>
        <h2 className="font-display mt-2 text-3xl font-extrabold uppercase">{copy.joinTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{copy.joinIntro}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setMode("login")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "login" ? "bg-ink text-white" : "border border-line hover:bg-cream"}`}
          >
            {copy.signIn}
          </button>
          <button
            onClick={() => setMode("register")}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${mode === "register" ? "bg-ink text-white" : "border border-line hover:bg-cream"}`}
          >
            {copy.register}
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
              {copy.continueGoogle}
            </a>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">
              <span className="h-px flex-1 bg-line" />
              {copy.or}
              <span className="h-px flex-1 bg-line" />
            </div>
            <input name="emailOrUsername" required placeholder={copy.emailOrUsername} className={fieldClass} />
            <input name="password" required type="password" placeholder={copy.password} className={fieldClass} />
            <button className="rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md active:scale-[0.98]">
              {copy.signIn}
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
              {copy.createGoogle}
            </a>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-muted md:col-span-2">
              <span className="h-px flex-1 bg-line" />
              {copy.or}
              <span className="h-px flex-1 bg-line" />
            </div>
            <input name="fullName" required placeholder={copy.fullName} className={fieldClass} />
            <input name="username" required placeholder={copy.username} className={fieldClass} />
            <input name="email" required type="email" placeholder="Email" className={fieldClass} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(7.5rem,9rem)_minmax(0,1fr)]">
              <select name="phoneCountryCode" defaultValue="+351" className={selectClass} style={{ backgroundImage: selectChevron }}>
                {dialCodes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="phone" placeholder={copy.mobile} className={fieldClass} />
            </div>
            <input name="password" required type="password" placeholder={copy.password} className={fieldClass} />
            <select name="customerType" defaultValue="SURFER" className={selectClass} style={{ backgroundImage: selectChevron }}>
              {customerTypes.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-start gap-3 text-sm text-muted md:col-span-2">
              <input name="marketingOptIn" type="checkbox" className="mt-1 size-4 shrink-0 accent-ink" />
              <span>{copy.marketing}</span>
            </label>
            <button className="rounded-2xl bg-ink px-5 py-4 font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-ink/90 hover:shadow-md active:scale-[0.98] md:col-span-2">
              {copy.register}
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
