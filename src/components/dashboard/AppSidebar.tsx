import {
  Activity,
  BookOpen,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Pill,
  ScrollText,
  Settings,
  Stethoscope,
  UserPlus,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Patient Intake", icon: UserPlus },
  { label: "AI Agents", icon: Workflow },
  { label: "Clinical Summary", icon: ClipboardList },
  { label: "Clinical Review", icon: Stethoscope },
  { label: "Guidelines", icon: BookOpen },
  { label: "Medications", icon: Pill },
  { label: "SOAP Note", icon: FileText },
  { label: "Care Plan", icon: HeartPulse },
  { label: "Reports", icon: Gauge },
  { label: "Audit Trail", icon: ScrollText },
  { label: "Settings", icon: Settings },
];

export function AppSidebar({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (label: string) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-navy px-3 py-4 text-navy-foreground lg:flex">
      <div className="mb-5 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-accent">
          <Activity className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold">AI HEALTH</p>
          <p className="text-[11px] font-medium text-navy-muted">SUPER AGENT</p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
              active === label
                ? "bg-navy-accent text-navy-foreground"
                : "text-navy-muted hover:bg-navy-accent/50 hover:text-navy-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
      <p className="mt-auto px-2 text-[10px] leading-relaxed text-navy-muted">
        Synthetic POC environment. Decision support only — every action requires clinician approval.
      </p>
    </aside>
  );
}
