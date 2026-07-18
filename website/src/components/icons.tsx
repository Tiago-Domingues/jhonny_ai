import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function WaveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 16c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
      <path d="M2 10c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" />
    </svg>
  );
}

export function SurfboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 18.5C3 16 3 8 8 4s12.5-1.5 11.5 4S8 21 5.5 18.5Z" />
      <path d="M9 15l4-4" />
    </svg>
  );
}

export function WetsuitIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3h6l1 4-1 2 1 9-3 1V14h-2v6l-3-1 1-9-1-2 1-4Z" />
    </svg>
  );
}

export function BodyboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="6" />
      <path d="M8 6v9" />
    </svg>
  );
}

export function SkateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10c4-2 14-2 18 0" />
      <circle cx="8" cy="15" r="1.6" />
      <circle cx="16" cy="15" r="1.6" />
    </svg>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3 5 5 3 9l3 1v10h12V10l3-1-2-4-4-2-3 2-3-2Z" />
    </svg>
  );
}

export function AccessoryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

export function AdviceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M9 10h6M9 13h4" />
    </svg>
  );
}

export function RepairIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14 7 3-3 3 3-3 3M14 7l-9 9-2 5 5-2 9-9M14 7l3 3" />
    </svg>
  );
}

export function BuybackIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8a9 9 0 0 1 15-3l3 3M21 16a9 9 0 0 1-15 3l-3-3" />
      <path d="M21 5v3h-3M3 19v-3h3" />
    </svg>
  );
}

export function RentalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h18M3 12a9 9 0 0 1 18 0M12 12V3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function TravelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 16 22 6l-3 8-9 2-3 4-1-5-4-3Z" />
    </svg>
  );
}

export function StudentIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 2 9l10 5 10-5-10-5Z" />
      <path d="M6 11v4c0 1 2.7 3 6 3s6-2 6-3v-4" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3h3l2 5-2 2a12 12 0 0 0 5 5l2-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function WhatsappIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.039zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.2l2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export function FlagPT(props: IconProps) {
  return (
    <svg viewBox="0 0 24 16" {...props}>
      <rect width="24" height="16" rx="2" fill="#ff0000" />
      <path d="M0 2a2 2 0 0 1 2-2h7v16H2a2 2 0 0 1-2-2Z" fill="#006600" />
      <circle cx="9" cy="8" r="3.2" fill="none" stroke="#ffcc00" strokeWidth="1.1" />
      <circle cx="9" cy="8" r="1.4" fill="#ffffff" stroke="#ff0000" strokeWidth="0.6" />
    </svg>
  );
}

export function FlagEN(props: IconProps) {
  return (
    <svg viewBox="0 0 24 16" {...props}>
      <rect width="24" height="16" rx="2" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#ffffff" strokeWidth="3" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#c8102e" strokeWidth="1.6" />
      <path d="M12 0v16M0 8h24" stroke="#ffffff" strokeWidth="4" />
      <path d="M12 0v16M0 8h24" stroke="#c8102e" strokeWidth="2.2" />
    </svg>
  );
}

export function FlagZH(props: IconProps) {
  return (
    <svg viewBox="0 0 24 16" {...props}>
      <rect width="24" height="16" rx="2" fill="#de2910" />
      <path
        fill="#ffde00"
        d="M5.2 3.2 5.9 5.3H8l-1.7 1.2.7 2.1-1.8-1.3-1.8 1.3.7-2.1L2.4 5.3h2.1Z"
      />
      <circle cx="9.2" cy="3.6" r="0.55" fill="#ffde00" />
      <circle cx="10.6" cy="5" r="0.55" fill="#ffde00" />
      <circle cx="10.6" cy="7" r="0.55" fill="#ffde00" />
      <circle cx="9.2" cy="8.4" r="0.55" fill="#ffde00" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z" />
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
