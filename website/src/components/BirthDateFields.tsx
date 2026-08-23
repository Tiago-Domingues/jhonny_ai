"use client";

import { useMemo, useState } from "react";
import { birthYearRange, daysInMonth, splitIsoDate } from "@/lib/ecommerce/birthDate";

const MONTHS = [
  { value: "01", pt: "Janeiro", en: "January", zh: "1月" },
  { value: "02", pt: "Fevereiro", en: "February", zh: "2月" },
  { value: "03", pt: "Março", en: "March", zh: "3月" },
  { value: "04", pt: "Abril", en: "April", zh: "4月" },
  { value: "05", pt: "Maio", en: "May", zh: "5月" },
  { value: "06", pt: "Junho", en: "June", zh: "6月" },
  { value: "07", pt: "Julho", en: "July", zh: "7月" },
  { value: "08", pt: "Agosto", en: "August", zh: "8月" },
  { value: "09", pt: "Setembro", en: "September", zh: "9月" },
  { value: "10", pt: "Outubro", en: "October", zh: "10月" },
  { value: "11", pt: "Novembro", en: "November", zh: "11月" },
  { value: "12", pt: "Dezembro", en: "December", zh: "12月" },
];

type Props = {
  name?: string;
  required?: boolean;
  defaultValue?: string;
  locale?: "pt" | "en" | "zh";
  labels?: { year: string; month: string; day: string };
  className?: string;
};

export function BirthDateFields({
  name = "birthDate",
  required = false,
  defaultValue = "",
  locale = "pt",
  labels = { year: "Ano", month: "Mês", day: "Dia" },
  className = "",
}: Props) {
  const initial = splitIsoDate(defaultValue);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const { earliest, latest } = birthYearRange();
  const years = useMemo(
    () => Array.from({ length: latest - earliest + 1 }, (_, index) => String(latest - index)),
    [earliest, latest]
  );
  const maxDay = year && month ? daysInMonth(Number(year), Number(month)) : 31;
  const safeDay = day && Number(day) > maxDay ? "" : day;
  const iso = year && month && safeDay ? `${year}-${month}-${safeDay.padStart(2, "0")}` : "";
  const selectClass =
    "w-full min-w-0 rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

  return (
    <div className={`grid gap-2 ${className}`}>
      <input type="hidden" name={name} value={iso} required={required} />
      <label className="grid gap-1.5">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{labels.year}</span>
        <select
          value={year}
          required={required}
          onChange={(event) => setYear(event.target.value)}
          className={selectClass}
        >
          <option value="">{labels.year}</option>
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{labels.month}</span>
          <select
            value={month}
            required={required}
            onChange={(event) => setMonth(event.target.value)}
            className={selectClass}
          >
            <option value="">{labels.month}</option>
            {MONTHS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry[locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{labels.day}</span>
          <select
            value={safeDay}
            required={required}
            onChange={(event) => setDay(event.target.value)}
            className={selectClass}
          >
            <option value="">{labels.day}</option>
            {Array.from({ length: maxDay }, (_, index) => {
              const value = String(index + 1).padStart(2, "0");
              return (
                <option key={value} value={value}>
                  {index + 1}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    </div>
  );
}
