// Lightweight, self-made payment badges (not official brand artwork).
// Each badge is a rounded card sized via the wrapper.

function Card({
  children,
  bg = "#ffffff",
  label,
}: {
  children: React.ReactNode;
  bg?: string;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex h-7 w-11 items-center justify-center rounded-md border border-white/15"
      style={{ background: bg }}
    >
      {children}
    </span>
  );
}

export function VisaBadge() {
  return (
    <Card label="Visa">
      <span className="font-display text-[0.62rem] font-extrabold italic tracking-tight text-[#1a1f71]">
        VISA
      </span>
    </Card>
  );
}

export function MastercardBadge() {
  return (
    <Card label="Mastercard">
      <span className="relative flex items-center">
        <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
        <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] opacity-90" />
      </span>
    </Card>
  );
}

export function AmexBadge() {
  return (
    <Card label="American Express" bg="#1f72cd">
      <span className="font-display text-[0.5rem] font-extrabold leading-none text-white">
        AMEX
      </span>
    </Card>
  );
}

export function PaypalBadge() {
  return (
    <Card label="PayPal">
      <span className="font-display text-[0.58rem] font-extrabold italic leading-none">
        <span className="text-[#003087]">Pay</span>
        <span className="text-[#009cde]">Pal</span>
      </span>
    </Card>
  );
}

export function KlarnaBadge() {
  return (
    <Card label="Klarna" bg="#ffb3c7">
      <span className="font-display text-[0.6rem] font-extrabold lowercase tracking-tight text-black">
        Klarna.
      </span>
    </Card>
  );
}

export function MultibancoBadge() {
  return (
    <Card label="Multibanco" bg="#003d7c">
      <span className="font-display text-[0.62rem] font-extrabold leading-none text-white">
        MB
      </span>
    </Card>
  );
}

export function MbWayBadge() {
  return (
    <Card label="MB WAY" bg="#cc0033">
      <span className="font-display text-[0.46rem] font-extrabold leading-none text-white">
        MB WAY
      </span>
    </Card>
  );
}

export function PaymentBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <VisaBadge />
      <MastercardBadge />
      <AmexBadge />
      <MultibancoBadge />
      <MbWayBadge />
      <PaypalBadge />
      <KlarnaBadge />
    </div>
  );
}
