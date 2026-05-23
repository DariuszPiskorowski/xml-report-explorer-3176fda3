import { useState } from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { TestStep } from "@/lib/parseReport";
import { StatusBadge } from "./StatusBadge";

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm break-words whitespace-pre-wrap text-foreground/90 ${mono ? "mono" : ""}`}>
        {value || <span className="text-muted-foreground italic">—</span>}
      </div>
    </div>
  );
}

export function ReportRow({ step }: { step: TestStep }) {
  const [open, setOpen] = useState(false);
  const rowBg = step.statusText === "Fail" ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-surface-2/60";

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className={`cursor-pointer border-t border-border transition-colors ${rowBg}`}
      >
        <Cell className="w-10">
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
          />
        </Cell>
        <Cell className="mono w-20 text-primary font-medium">{step.id}</Cell>
        <Cell className="w-32">
          <StatusBadge status={step.statusText} code={step.statusCode} />
        </Cell>
        <Cell className="max-w-[260px]">
          <div className="text-sm truncate" title={step.name}>
            {step.name || <span className="text-muted-foreground">—</span>}
          </div>
        </Cell>
        <Cell className="w-20 text-center">
          {step.hasError ? (
            <AlertTriangle className="inline h-4 w-4 text-destructive" />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </Cell>
        <Cell className="mono w-40 text-sm truncate max-w-[160px]" >
          <span title={step.returnValue}>{step.returnValue || "—"}</span>
        </Cell>
        <Cell className="mono w-40 text-sm truncate max-w-[160px]">
          <span title={step.expectedValue}>{step.expectedValue || "—"}</span>
        </Cell>
        <Cell className="mono text-xs max-w-[320px]">
          <div className="truncate" title={step.serviceMethod}>{step.serviceMethod || "—"}</div>
        </Cell>
        <Cell className="mono text-xs max-w-[220px]">
          <div className="truncate text-destructive" title={step.error}>
            {step.error || <span className="text-muted-foreground">—</span>}
          </div>
        </Cell>
      </tr>
      {open && (
        <tr className="border-t border-border bg-surface/60">
          <td colSpan={9} className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              <Field label="Description" value={step.description} />
              <Field label="ATS_Id" value={step.atsId} mono />
              <Field label="TST_Id" value={step.tstId} mono />
              <Field label="TimeStamp" value={step.timeStamp} mono />
              <Field label="TimePoint" value={step.timePoint} mono />
              <Field label="ElapsedTime" value={step.elapsedTime} mono />
              <Field label="EvaluationMethod" value={step.evaluationMethod} mono />
              <Field label="ClientMethod" value={step.clientMethod} mono />
              <Field label="ExpectedValueVar" value={step.expectedValueVar} mono />
              <div className="md:col-span-2 lg:col-span-3">
                <Field label="ServiceMethod (full)" value={step.serviceMethod} mono />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Field label="ServiceMethodVar" value={step.serviceMethodVar} mono />
              </div>
              {step.error && (
                <div className="md:col-span-2 lg:col-span-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  <Field label="Error" value={step.error} mono />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
