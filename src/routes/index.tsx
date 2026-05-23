import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { Upload, FileX2, Search, RotateCcw, FileText, Sun, Moon } from "lucide-react";
import { parseReportXml, type TestStep } from "@/lib/parseReport";
import { ReportRow } from "@/components/ReportRow";
import { StatusBadge } from "@/components/StatusBadge";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Test Report Viewer — interactive XML viewer" },
      { name: "description", content: "Upload an XML file from the test machine and browse test steps in an interactive table with expandable details." },
    ],
  }),
});

type Filter = "all" | "Pass" | "Fail" | "Skipped" | "Unknown";

function Index() {
  const [steps, setSteps] = useState<TestStep[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseReportXml(text);
      setSteps(parsed);
      setFileName(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read the file");
      setSteps(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const summary = useMemo(() => {
    const s = { total: 0, Pass: 0, Fail: 0, Skipped: 0, Warning: 1, Unknown: 0, Running: 0 };
    steps?.forEach((x) => { s.total++; s[x.statusText]++; });
    return s;
  }, [steps]);

  const filtered = useMemo(() => {
    if (!steps) return [];
    const q = query.trim().toLowerCase();
    return steps.filter((s) => {
      if (filter !== "all" && s.statusText !== filter) return false;
      if (!q) return true;
      return (
        s.id.includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.serviceMethod.toLowerCase().includes(q) ||
        s.error.toLowerCase().includes(q) ||
        s.returnValue.toLowerCase().includes(q) ||
        s.expectedValue.toLowerCase().includes(q)
      );
    });
  }, [steps, query, filter]);

  const { theme, toggleTheme } = useTheme();

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary/80 mono">Test Report Viewer</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Interactive XML Report Viewer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a file from the test machine — each row can be expanded to see step details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
          {steps && (
            <button
              onClick={() => { setSteps(null); setFileName(""); setQuery(""); setFilter("all"); }}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Upload another file
            </button>
          )}
        </div>
      </header>

      {!steps && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className={`block cursor-pointer rounded-xl border-2 border-dashed p-16 text-center transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border bg-surface/40 hover:border-primary/60 hover:bg-surface"
          }`}
        >
          <input
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-7 w-7 text-primary" />
          </div>
          <div className="mt-4 text-lg font-medium">Drop an .xml file or click to select</div>
          <div className="mt-1 text-sm text-muted-foreground">
            File is processed locally in the browser — nothing is sent to the server.
          </div>
          {loading && <div className="mt-4 text-sm text-primary mono">Parsing…</div>}
          {error && (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <FileX2 className="h-4 w-4" /> {error}
            </div>
          )}
        </label>
      )}

      {steps && (
        <>
          <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <SummaryCard label="Total" value={summary.total} active={filter === "all"} onClick={() => setFilter("all")} />
            <SummaryCard label="Pass" value={summary.Pass} tone="success" active={filter === "Pass"} onClick={() => setFilter("Pass")} />
            <SummaryCard label="Fail" value={summary.Fail} tone="destructive" active={filter === "Fail"} onClick={() => setFilter("Fail")} />
            <SummaryCard label="Skipped" value={summary.Skipped} tone="warning" active={filter === "Skipped"} onClick={() => setFilter("Skipped")} />
            <SummaryCard label="Warning" value={summary.Warning} tone="warning" active={filter === "Warning"} onClick={() => setFilter("Warning")} />
            <SummaryCard label="Unknown" value={summary.Unknown} active={filter === "Unknown"} onClick={() => setFilter("Unknown")} />
            <SummaryCard label="Running" value={summary.Running} tone="running" active={filter === "Running"} onClick={() => setFilter("Running")} />
          </section>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="mono">{fileName}</span>
              <span>·</span>
              <span>{filtered.length} of {summary.total} steps</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, description, method, error…"
                className="w-80 rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface/60">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-20 bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground shadow-sm [&_th]:border-b [&_th]:border-border">
                <tr>
                  <th className="px-3 py-3" />
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Error?</th>
                  <th className="px-3 py-3">Return</th>
                  <th className="px-3 py-3">Expected</th>
                  <th className="px-3 py-3">Service Method</th>
                  <th className="px-3 py-3">Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => <ReportRow key={`${s.atsId}-${s.id}`} step={s} />)}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      No steps matching the filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Legend:
            <StatusBadge status="Pass" code="2" />
            <StatusBadge status="Fail" code="1" />
            <StatusBadge status="Skipped" code="3" />
            <StatusBadge status="Unknown" />
          </div>
        </>
      )}
    </main>
  );
}

function SummaryCard({
  label, value, tone, active, onClick,
}: { label: string; value: number; tone?: "success" | "destructive" | "warning"; active?: boolean; onClick?: () => void }) {
  const ring =
    tone === "success" ? "data-[active=true]:ring-success/60" :
    tone === "destructive" ? "data-[active=true]:ring-destructive/60" :
    tone === "warning" ? "data-[active=true]:ring-warning/60" :
    "data-[active=true]:ring-primary/60";
  const valueColor =
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    "text-foreground";
  return (
    <button
      data-active={active}
      onClick={onClick}
      className={`rounded-xl border border-border bg-surface px-4 py-3 text-left transition-all hover:bg-surface-2 data-[active=true]:ring-2 ${ring}`}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold mono ${valueColor}`}>{value}</div>
    </button>
  );
}
