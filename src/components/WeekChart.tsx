"use client";

import { useEffect, useRef, useState } from "react";
import { taka } from "@/lib/data";

/** Last 7 days of sales as thin bars, with a hover tooltip. Single series, so no legend. */
export default function WeekChart({ values, now }: { values: number[]; now: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(560);
  // Draw at the real pixel width so text stays readable on phones.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 210;
  const pad = { l: 44, r: 8, t: 16, b: 26 };
  const top = Math.ceil(Math.max(...values) / 5000) * 5000;
  const ticks = [0, top / 2, top];
  const cw = (W - pad.l - pad.r) / values.length;
  const bw = Math.min(28, cw * 0.45);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / top);
  const day = (i: number) =>
    i === values.length - 1 ? "Today" : new Date(now - (values.length - 1 - i) * 86_400_000).toLocaleDateString("en-GB", { weekday: "short" });

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Sales in the last 7 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e7e5e4" strokeWidth="1" strokeDasharray={t === 0 ? undefined : "3 4"} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-stone-400 text-[11px] tabular-nums">
              {t === 0 ? "0" : `${t / 1000}k`}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const cx = pad.l + cw * i + cw / 2;
          const isToday = i === values.length - 1;
          const h = H - pad.b - y(v);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* Hit area bigger than the bar */}
              <rect x={pad.l + cw * i} y={pad.t} width={cw} height={H - pad.t - pad.b} fill="transparent" />
              <path
                d={`M${cx - bw / 2},${H - pad.b} v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z`}
                fill={isToday ? "#4338ca" : "#a5b4fc"}
                opacity={hover === null || hover === i ? 1 : 0.55}
                className="transition-opacity"
              />
              {isToday && (
                <text x={cx} y={y(v) - 6} textAnchor="middle" className="fill-stone-700 text-[11px] font-semibold tabular-nums">
                  {taka(v)}
                </text>
              )}
              <text x={cx} y={H - 8} textAnchor="middle" className={`text-[11px] ${isToday ? "fill-stone-800 font-semibold" : "fill-stone-400"}`}>
                {day(i)}
              </text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${((pad.l + cw * hover + cw / 2) / W) * 100}%`, top: 0 }}
        >
          <span className="text-stone-400">{day(hover)}</span> · <b className="tabular-nums">{taka(values[hover])}</b>
        </div>
      )}
    </div>
  );
}
