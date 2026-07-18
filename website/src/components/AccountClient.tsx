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

        <form key={String(profile?.id || "profile-loading")} onSubmit={saveProfile} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Profile</p>
              <p className="mt-2 text-sm text-muted">Keep your details ready for faster checkouts and Odoo customer sync.</p>
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
            <div className="grid grid-cols-[minmax(96px,0.45fr)_1fr] gap-2">
              <select name="phoneCountryCode" defaultValue={String(profile?.phoneCountryCode || "+351")} className="rounded-2xl border border-line px-4 py-3">
                {dialCodes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input name="phone" defaultValue={String(profile?.phone || "")} placeholder="Mobile" className="rounded-2xl border border-line px-4 py-3" />
            </div>
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
        <form onSubmit={(event) => submit("/api/auth/login", event)} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <input name="emailOrUsername" required placeholder="Email or username" className="rounded-2xl border border-line px-4 py-3" />
            <input name="password" required type="password" placeholder="Password" className="rounded-2xl border border-line px-4 py-3" />
            <button className="rounded-full bg-ink px-5 py-3 font-bold uppercase tracking-wide text-white">Sign in</button>
          </div>
        </form>
      ) : (
        <form onSubmit={(event) => submit("/api/auth/register", event)} className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <input name="fullName" required placeholder="Full name" className="rounded-2xl border border-line px-4 py-3" />
            <input name="username" required placeholder="Username" className="rounded-2xl border border-line px-4 py-3" />
            <input name="email" required type="email" placeholder="Email" className="rounded-2xl border border-line px-4 py-3" />
            <div className="grid grid-cols-[minmax(96px,0.45fr)_1fr] gap-2">
              <select name="phoneCountryCode" defaultValue="+351" className="rounded-2xl border border-line px-4 py-3">
                {dialCodes.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input name="phone" placeholder="Mobile" className="rounded-2xl border border-line px-4 py-3" />
            </div>
            <input name="password" required type="password" placeholder="Password" className="rounded-2xl border border-line px-4 py-3" />
            <select name="customerType" defaultValue="SURFER" className="rounded-2xl border border-line px-4 py-3">
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
