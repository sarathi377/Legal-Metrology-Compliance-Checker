# Legal Metrology Compliance Checker — Frontend

A standalone static frontend for the AI-based Legal Metrology Packaged
Commodity Compliance Checker. It works on its own (no server required —
just open `index.html`), and is structured so it can be dropped straight
into a Spring Boot project's `src/main/resources/static/` folder later.

## Pages

| File            | Purpose                                                             |
|------------------|----------------------------------------------------------------------|
| `index.html`     | Landing page: hero + the 10-stage workflow pipeline                 |
| `upload.html`    | Drag-and-drop label upload → simulated OCR → live compliance check  |
| `dashboard.html` | Inspection totals, violation frequency chart, recent inspections log |
| `report.html`    | Printable single-inspection compliance report                       |

## Structure

```
frontend/
├── index.html
├── upload.html
├── dashboard.html
├── report.html
├── assets/
│   ├── css/style.css      # shared design tokens + components
│   └── js/main.js         # nav injection, mock data store, rule engine
└── README.md
```

## How the demo works right now

The UI is wired to `lmc-backend` (`POST /api/scan`, `/api/compliance`, `/api/inspections`).
Tesseract.js reads the label in the browser; Java extracts Legal Metrology fields and stores inspections.

Open this folder only after `mvn spring-boot:run` in `lmc-backend` (port **8090**).
Standalone `file://` / port 8765 still talks to `http://127.0.0.1:8090/api`.

Previously the demo used `localStorage` only:

- `LMC.simulateOCR(file)` stands in for **OCRService** (Tesseract + OpenCV).
- `LMC.checkCompliance(fields)` stands in for **ComplianceRules.java** —
  the same six checks (product name, manufacturer, net quantity, MRP,
  packing date, consumer care).
- `LMC.getInspections()` / `LMC.addInspection()` stand in for the
  **`products` / `violations` / `inspections`** MySQL tables.

This means you can click through the full flow — upload a label,
see it scanned, see the verdict stamped, save it, and see it appear on
the dashboard and in a printable report — without any backend running.

## Wiring up the real Java backend

When the Spring Boot API exists, replace the calls above with `fetch()`:

```js
// upload.html — instead of LMC.simulateOCR(file):
const form = new FormData();
form.append("file", file);
const res = await fetch("/api/scan", { method: "POST", body: form });
const fields = await res.json();

// dashboard.html — instead of LMC.getInspections():
const inspections = await fetch("/api/inspections").then(r => r.json());
```

Everything else (rendering, the checklist, the stamp, the report layout)
can stay as-is — only the data source changes from `localStorage` to the
real `ProductController` / `ScanController` / `ReportController` endpoints.

## Design language

Styled as a physical inspection case file: aged paper background, a
stamped compliant/non-compliant seal, a typewriter-style monospace for
data fields, and a slab serif for headings. Colors and type are all
defined as CSS variables at the top of `assets/css/style.css` if you
want to re-theme it.
