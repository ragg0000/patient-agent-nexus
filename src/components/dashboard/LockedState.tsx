import { Hourglass } from "lucide-react";

export function LockedState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center">
      <Hourglass className="h-5 w-5 text-muted-foreground" />
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
