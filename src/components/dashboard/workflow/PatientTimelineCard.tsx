import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Activity, Filter, MousePointerClick } from "lucide-react";
import type { Analytics, BackendPatient, TimeRange, TimelineVisit, VisitComparison } from "@/lib/backend";
import { RANGES } from "@/lib/backend";
import { fallbackComparison } from "@/data/fallback";
import { Chip, Panel, SectionCard } from "../SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataOriginBadge, ErrorPanel, LoadingPanel } from "./StatusPanels";
import { cn } from "@/lib/utils";

const SEVERITY_META: { value: VisitSeverity; y: number; label: string; color: string }[] = [
  { value: "routine", y: 1, label: "Routine", color: "#3b5bdb" },
  { value: "improved", y: 2, label: "Improved", color: "#2f9e6e" },
  { value: "warning", y: 3, label: "Warning / worsening", color: "#d99a2b" },
  { value: "urgent", y: 4, label: "Urgent", color: "#d64545" },
  { value: "treatment-change", y: 5, label: "Treatment change", color: "#8b5cf6" },
];

function severityOf(v: TimelineVisit) {
  return SEVERITY_META.find((s) => s.value === v.severity) ?? SEVERITY_META[0]!;
}

export function PatientTimelineCard({
  patientId,
  visits,
  analytics,
  range,
  onRangeChange,
  loading,
  error,
  onRetry,
  offline,
}: {
  patientId: string;
  visits: TimelineVisit[] | null;
  analytics: Analytics | null;
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  loading: boolean;
  error: { title: string; detail: string } | null;
  onRetry: () => void;
  offline: boolean;
}) {
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openVisit, setOpenVisit] = useState<TimelineVisit | null>(null);
  const [visitDetail, setVisitDetail] = useState<TimelineVisit | null>(null);
  const [comparison, setComparison] = useState<VisitComparison | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitError, setVisitError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = visits ?? [];
    if (typeFilter.trim()) {
      const q = typeFilter.toLowerCase();
      list = list.filter((v) => (v.encounterType ?? "").toLowerCase().includes(q));
    }
    if (departmentFilter.trim()) {
      const q = departmentFilter.toLowerCase();
      list = list.filter((v) => (v.department ?? "").toLowerCase().includes(q));
    }
    if (conditionFilter.trim()) {
      const q = conditionFilter.toLowerCase();
      list = list.filter((v) =>
        [v.visitReason ?? "", v.carePlan ?? "", v.outcome ?? ""].join(" ").toLowerCase().includes(q),
      );
    }
    if (dateFrom) list = list.filter((v) => v.date >= dateFrom);
    if (dateTo) list = list.filter((v) => v.date <= dateTo);
    return list;
  }, [visits, typeFilter, departmentFilter, conditionFilter, dateFrom, dateTo]);

  const scatterData = useMemo(
    () =>
      filtered.map((v) => ({
        ...v,
        y: severityOf(v).y,
        color: severityOf(v).color,
      })),
    [filtered],
  );

  async function openVisitDrawer(visit: TimelineVisit) {
    setOpenVisit(visit);
    setVisitDetail(visit);
    setComparison(null);
    setVisitError(null);
    setVisitLoading(true);
    try {
      if (offline) {
        setVisitDetail(visit);
        setComparison(fallbackComparison(patientId, visit.encounterId));
      } else {
        const { backendApi } = await import("@/lib/backend");
        const detailList = await backendApi.visit(patientId, visit.encounterId);
        if (detailList[0]) setVisitDetail(detailList[0]);
        setComparison(await backendApi.visitComparison(patientId, visit.encounterId));
      }
    } catch (e) {
      setVisitError(e instanceof Error ? e.message : "Visit detail could not be loaded.");
      setComparison(fallbackComparison(patientId, visit.encounterId));
    } finally {
      setVisitLoading(false);
    }
  }

  return (
    <SectionCard
      id="step-timeline"
      index={3}
      title="Timeline & Statistical Trends"
      subtitle="Click any visit marker for visit detail and comparison · charts hidden when no data"
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => onRangeChange(r.value)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium",
              range === r.value
                ? "bg-navy text-navy-foreground"
                : "border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
          <Filter className="h-3 w-3" /> Filters
        </span>
        <Input
          placeholder="Encounter type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-7 w-32 bg-card text-[11px]"
        />
        <Input
          placeholder="Department"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="h-7 w-28 bg-card text-[11px]"
        />
        <Input
          placeholder="Condition / keyword"
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="h-7 w-36 bg-card text-[11px]"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-7 w-32 bg-card text-[11px]"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-7 w-32 bg-card text-[11px]"
        />
      </div>

      {loading ? <LoadingPanel label="Loading timeline and analytics…" /> : null}
      {!loading && error ? <ErrorPanel title={error.title} detail={error.detail} onRetry={onRetry} /> : null}
      {!loading && !error && visits ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {SEVERITY_META.map((s) => (
              <span
                key={s.value}
                className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} /> {s.label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
              <MousePointerClick className="h-3 w-3" /> {filtered.length} visits shown
            </span>
          </div>

          <Panel title="Visit graph — encounter date vs severity/category">
            {scatterData.length ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[0, 5]}
                      tickCount={6}
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v: number) => SEVERITY_META.find((s) => s.y === v)?.label ?? ""}
                      width={90}
                    />
                    <ZAxis range={[60, 60]} />
                    <Tooltip
                      contentStyle={{ fontSize: 11 }}
                      formatter={(value, _name, entry) => {
                        const payload = entry?.payload as (TimelineVisit & { y: number }) | undefined;
                        return payload ? [payload.encounterType ?? "Visit", payload.date] : value;
                      }}
                    />
                    <Scatter
                      data={scatterData}
                      onClick={(entry) => {
                        const payload = (entry as unknown as { payload?: TimelineVisit })?.payload;
                        if (payload?.encounterId) void openVisitDrawer(payload);
                      }}
                      cursor="pointer"
                      shape={(props: { cx?: number; cy?: number; payload?: TimelineVisit }) => {
                        const color = severityOf(props.payload!).color;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={7}
                            fill={color}
                            fillOpacity={0.85}
                            stroke="var(--card)"
                          />
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No visits match the current filters.</p>
            )}
          </Panel>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {(analytics?.trends ?? []).map((trend) => (
              <Panel key={trend.key} title={`${trend.label}${trend.unit ? ` (${trend.unit})` : ""}`}>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b5bdb"
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            ))}
          </div>
          {analytics && analytics.trends.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No numeric trend series were returned — trend charts are hidden.
            </p>
          ) : null}
        </div>
      ) : null}

      <Sheet open={!!openVisit} onOpenChange={(o) => !o && setOpenVisit(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-info" /> Visit detail
            </SheetTitle>
            <SheetDescription>
              {openVisit?.date} · {openVisit?.encounterId}
            </SheetDescription>
          </SheetHeader>
          {visitLoading ? <LoadingPanel label="Loading visit detail…" /> : null}
          {visitError ? <ErrorPanel title="Visit detail unavailable" detail={visitError} /> : null}
          {visitDetail ? (
            <div className="mt-3 space-y-2.5 text-xs">
              <Panel title="Overview">
                <dl className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Visit date</dt>
                    <dd>{visitDetail.date}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Department</dt>
                    <dd>{visitDetail.department ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Encounter type</dt>
                    <dd>{visitDetail.encounterType ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Visit reason</dt>
                    <dd className="text-right">{visitDetail.visitReason ?? "—"}</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  <DataOriginBadge origin={visitDetail.dataOrigin} />
                </div>
              </Panel>
              <Panel title="Vitals">
                <dl className="space-y-1 text-[11px]">
                  {Object.entries(visitDetail.vitals ?? {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
              <Panel title="Labs">
                {Object.keys(visitDetail.labs ?? {}).length ? (
                  <dl className="space-y-1 text-[11px]">
                    {Object.entries(visitDetail.labs ?? {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-[11px] text-muted-foreground">None recorded</p>
                )}
              </Panel>
              <Panel title="Care plan & outcome">
                <p className="text-[11px] text-muted-foreground">{visitDetail.carePlan ?? "—"}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Outcome: {visitDetail.outcome ?? "—"}</p>
              </Panel>
              <Panel title="Comparison vs previous visit">
                {comparison?.comparisons.length ? (
                  <ul className="space-y-1 text-[11px]">
                    {comparison.comparisons.map((c, i) => (
                      <li key={`${c.field}-${i}`} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{c.field}</span>
                        <span className="flex items-center gap-1.5">
                          <span>{c.previous ?? "—"}</span> → <span className="font-medium">{c.current ?? "—"}</span>
                          {c.change ? (
                            <Chip
                              tone={
                                /increas/i.test(c.change)
                                  ? "urgent"
                                  : /decreas/i.test(c.change)
                                    ? "info"
                                    : "ok"
                              }
                            >
                              {c.change}
                            </Chip>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No comparison data returned.</p>
                )}
              </Panel>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}
