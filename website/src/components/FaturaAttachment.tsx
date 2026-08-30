export function FaturaAttachment({
  orderId,
  orderNumber,
  hasFaturaRecibo,
  downloadHref,
  label,
  downloadLabel,
  unavailableLabel,
}: {
  orderId: string;
  orderNumber: string;
  hasFaturaRecibo: boolean;
  downloadHref: string;
  label: string;
  downloadLabel: string;
  unavailableLabel: string;
}) {
  const filename = `fatura-recibo-${orderNumber}.pdf`;
  return (
    <div
      data-order-id={orderId}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-cream/60 px-4 py-3"
    >
      <div>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="mt-1 text-sm font-semibold text-ink">{filename}</p>
        {!hasFaturaRecibo && <p className="mt-1 text-xs text-muted">{unavailableLabel}</p>}
      </div>
      {hasFaturaRecibo ? (
        <a
          href={downloadHref}
          className="rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
        >
          {downloadLabel}
        </a>
      ) : (
        <span className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted">
          {downloadLabel}
        </span>
      )}
    </div>
  );
}
