import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/data-state/QueryBoundary";
import { formatMoney } from "@/lib/format";

interface EarningsChartProps {
  data: { date: string; amountCents: number }[];
  currency?: string;
  emptyLabel?: string;
}

/**
 * Explicitly handles 0 / 1 / many data points.
 * 0 → empty state (no broken axes)
 * 1 → single dot + flat baseline (never a "collapsed area" glitch)
 * ≥2 → area chart
 */
export function EarningsChart({ data, currency = "USD", emptyLabel = "No earnings yet" }: EarningsChartProps) {
  const points = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => ({ date: p.date, amount: p.amountCents / 100 })),
    [data],
  );

  if (points.length === 0) {
    return (
      <EmptyState
        title={emptyLabel}
        description="Once your projects start selling, revenue trends will appear here."
      />
    );
  }

  // Single point: render a small stat block, not a broken chart.
  if (points.length === 1) {
    const p = points[0];
    return (
      <div className="surface-1 flex items-end justify-between rounded-md p-6">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{p.date}</div>
          <div className="mt-2 font-mono text-3xl tracking-tight text-foreground">
            {formatMoney(p.amount * 100, currency)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            First data point — chart appears once a second day of activity is recorded.
          </div>
        </div>
        <div className="h-2 w-2 rounded-full bg-accent" aria-hidden />
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cl-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-lime)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent-lime)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--ink-4)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink-4)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--border-strong)", strokeDasharray: "2 2" }}
            contentStyle={{
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--ink-3)" }}
            formatter={(v: number) => [formatMoney(v * 100, currency), "revenue"]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="var(--accent-lime)"
            strokeWidth={1.5}
            fill="url(#cl-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
