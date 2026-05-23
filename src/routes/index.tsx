import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileX2, Search, RotateCcw, FileText, Sun, Moon, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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

type Filter = "all" | "Pass" | "Fail" | "Skipped" | "Warning" | "Unknown" | "Running";
type SortKey = "status" | "error" | null;
type SortDir = "asc" | "desc";

const STATUS_RANK: Record<TestStep["statusText"], number> = {
  Fail: 0, Warning: 1, Running: 2, Unknown: 3, Skipped: 4, Pass: 5,
};

type ColKey = "expander" | "id" | "status" | "name" | "errorFlag" | "return" | "expected" | "serviceMethod" | "error";

const COLUMNS: { key: ColKey; label: string; initial: number; min: number; sortable?: SortKey }[] = [
  { key: "expander", label: "", initial: 40, min: 32 },
  { key: "id", label: "ID", initial: 80, min: 60 },
  { key: "status", label: "Status", initial: 130, min: 100, sortable: "status" },
  { key: "name", label: "Name", initial: 260, min: 120 },
  { key: "errorFlag", label: "Error?", initial: 80, min: 60 },
  { key: "return", label: "Return", initial: 170, min: 100 },
  { key: "expected", label: "Expected", initial: 170, min: 100 },
  { key: "serviceMethod", label: "Service Method", initial: 320, min: 140 },
  { key: "error", label: "Error", initial: 240, min: 100, sortable: "error" },
];

function Index() {
  const [steps, setSteps] = useState<TestStep[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dragOver, setDragOver] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [widths, setWidths] = useState<Record<ColKey, number>>(
    () => Object.fromEntries(COLUMNS.map((c) => [c.key, c.initial])) as Record<ColKey, number>,
  );

  const resizingRef = useRef<{ key: ColKey; startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      const col = COLUMNS.find((c) => c.key === r.key)!;
      const next = Math.max(col.min, r.startW + (e.clientX - r.startX));
      setWidths((w) => ({ ...w, [r.key]: next }));
    };
    const onUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = (key: ColKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { key, startX: e.clientX, startW: widths[key] };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const toggleSort = (key: SortKey) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
    const list = steps.filter((s) => {
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
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      list.sort((a, b) => {
        if (sortKey === "status") {
          return (STATUS_RANK[a.statusText] - STATUS_RANK[b.statusText]) * dir;
        }
        // error: empty values sort to the end regardless of dir
        const ae = a.error || "";
        const be = b.error || "";
        if (!ae && !be) return 0;
        if (!ae) return 1;
        if (!be) return -1;
        return ae.localeCompare(be) * dir;
      });
    }
    return list;
  }, [steps, query, filter, sortKey, sortDir]);

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

          <div className="rounded-xl border border-border bg-surface/60 overflow-x-auto">
            <table className="text-left text-sm" style={{ tableLayout: "fixed", width: Object.values(widths).reduce((a, b) => a + b, 0) }}>
              <colgroup>
                {COLUMNS.map((c) => (
                  <col key={c.key} style={{ width: widths[c.key] }} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-20 bg-surface-2 text-xs uppercase tracking-wider text-muted-foreground shadow-sm [&_th]:border-b [&_th]:border-border">
                <tr>
                  {COLUMNS.map((c) => {
                    const isSorted = c.sortable && sortKey === c.sortable;
                    const Icon = isSorted ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                    return (
                      <th
                        key={c.key}
                        className={`relative px-3 py-3 select-none ${c.sortable ? "cursor-pointer hover:text-foreground" : ""}`}
                        onClick={c.sortable ? () => toggleSort(c.sortable!) : undefined}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {c.label}
                          {c.sortable && (
                            <Icon className={`h-3 w-3 ${isSorted ? "text-primary" : "opacity-40"}`} />
                          )}
                        </span>
                        <span
                          onMouseDown={(e) => startResize(c.key, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize hover:bg-primary/40 active:bg-primary/60"
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => <ReportRow key={`${s.atsId}-${s.id}`} step={s} />)}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-6 py-12 text-center text-muted-foreground">
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
}: { label: string; value: number; tone?: "success" | "destructive" | "warning" | "running"; active?: boolean; onClick?: () => void }) {
  const ring =
    tone === "success" ? "data-[active=true]:ring-success/60" :
    tone === "destructive" ? "data-[active=true]:ring-destructive/60" :
    tone === "warning" ? "data-[active=true]:ring-warning/60" :
    tone === "running" ? "data-[active=true]:ring-blue-400/60" :
    "data-[active=true]:ring-primary/60";
  const valueColor =
    tone === "success" ? "text-success" :
    tone === "destructive" ? "text-destructive" :
    tone === "warning" ? "text-warning" :
    tone === "running" ? "text-blue-400" :
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
