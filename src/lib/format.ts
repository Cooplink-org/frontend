export function formatMoney(cents: number | null | undefined, currency = "USD"): string {
  if (cents === null || cents === undefined || Number.isNaN(cents)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

/**
 * Format a decimal string amount in UZS (Uzbekistani Som).
 * The API returns amounts as decimal strings like "180000.00".
 */
export function formatUZS(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Compact leaderboard-style UZS amounts, split for typographic treatment:
 * { value: "3.25", unit: "mln so'm" }.
 */
export function formatUZSParts(amount: string | number | null | undefined): {
  value: string;
  unit: string;
} {
  if (amount === null || amount === undefined) return { value: "—", unit: "" };
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return { value: "—", unit: "" };
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const s = m >= 100 ? Math.round(m).toString() : String(parseFloat(m.toFixed(2)));
    return { value: s, unit: "mln so'm" };
  }
  if (n >= 10_000) {
    const k = n / 1_000;
    const s = k >= 100 ? Math.round(k).toString() : String(parseFloat(k.toFixed(1)));
    return { value: s, unit: "ming so'm" };
  }
  return { value: String(Math.round(n)), unit: "so'm" };
}

/**
 * Compact leaderboard-style UZS amounts: "3.25 mln so'm", "148 ming so'm".
 */
export function formatUZSCompact(amount: string | number | null | undefined): string {
  const p = formatUZSParts(amount);
  return p.unit ? `${p.value} ${p.unit}` : p.value;
}

/**
 * Locale-aware thousands grouping ("12 482" in ru/uz locales, "12,482" otherwise).
 */
export function formatCount(n: number | null | undefined, lang = "en"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  const locale = lang.startsWith("uz") || lang.startsWith("ru") ? "ru-RU" : "en-US";
  return new Intl.NumberFormat(locale).format(n);
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}

export function formatDate(
  iso: string | null | undefined,
  style: "short" | "medium" = "medium",
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (style === "short") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diff = Date.now() - d;
  const min = 60_000,
    hr = 3_600_000,
    day = 86_400_000;
  if (diff < min) return "just now";
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return formatDate(iso, "short");
}
