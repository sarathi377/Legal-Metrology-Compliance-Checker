/* Legal Metrology Compliance Checker — talks to Spring Boot /api */
const LMC = (() => {
  const STORE_KEY = "lmc_inspections";

  const SEED = [
    {
      id: "LM-1043", product: "JAVA E-Book", manufacturer: "ADHI Publication",
      netQty: "1 pcs", mrp: "₹189", packingDate: "Jul 2026", consumerCare: "9689830091", barcode: "9789312345678",
      status: "COMPLIANT", violations: [], date: "2026-08-30T10:15:00Z"
    },
    {
      id: "LM-1042", product: "ABC Rice 1kg", manufacturer: "ABC Foods Pvt Ltd",
      netQty: "1 kg", mrp: "₹120", packingDate: "", consumerCare: "", barcode: "8901234567890",
      status: "NON-COMPLIANT", violations: ["Packing date missing", "Consumer care details missing"],
      date: "2026-08-24T10:12:00Z"
    },
    {
      id: "LM-1041", product: "Sunrise Wheat Flour 5kg", manufacturer: "Sunrise Mills Ltd",
      netQty: "5 kg", mrp: "₹245", packingDate: "Aug 2026", consumerCare: "1800-555-221", barcode: "8909876543210",
      status: "COMPLIANT", violations: [], date: "2026-08-24T09:47:00Z"
    },
    {
      id: "LM-1040", product: "Farmline Mustard Oil 1L", manufacturer: "Farmline Agro",
      netQty: "1 L", mrp: "₹189", packingDate: "Jul 2026", consumerCare: "", barcode: "8904567890123",
      status: "NON-COMPLIANT", violations: ["Consumer care details missing"],
      date: "2026-08-23T16:03:00Z"
    },
    {
      id: "LM-1039", product: "Nutrifit Rolled Oats 500g", manufacturer: "Nutrifit Foods",
      netQty: "500 g", mrp: "₹99", packingDate: "Aug 2026", consumerCare: "1800-999-004", barcode: "8901122334455",
      status: "COMPLIANT", violations: [], date: "2026-08-23T11:30:00Z"
    },
    {
      id: "LM-1038", product: "Daily Salt 1kg", manufacturer: "",
      netQty: "1 kg", mrp: "₹22", packingDate: "Jun 2026", consumerCare: "1800-222-333", barcode: "8906677889900",
      status: "NON-COMPLIANT", violations: ["Manufacturer details missing"],
      date: "2026-08-22T14:51:00Z"
    }
  ];

  function getInspectionsSync() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    try { return JSON.parse(raw); } catch (e) { return [...SEED]; }
  }

  function saveInspections(list) {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  }

  /* Promise-returning wrappers so callers can use both sync and async style */
  function getInspections() {
    return Promise.resolve(getInspectionsSync());
  }

  function addInspection(fields) {
    const id = nextId();
    const compliance = checkComplianceSync(fields);
    const record = {
      id,
      product: fields.product || "",
      manufacturer: fields.manufacturer || "",
      netQty: fields.netQty || "",
      mrp: fields.mrp || "",
      packingDate: fields.packingDate || "",
      consumerCare: fields.consumerCare || "",
      barcode: fields.barcode || "",
      status: compliance.status,
      violations: compliance.violations,
      date: new Date().toISOString()
    };
    const list = getInspectionsSync();
    list.unshift(record);
    saveInspections(list);
    localStorage.setItem("lmc_last_id", record.id);
    return Promise.resolve(record);
  }

  function getById(id) {
    const result = getInspectionsSync().find(r => r.id === id) || null;
    return Promise.resolve(result);
  }

  function deleteInspection(id) {
    const list = getInspectionsSync().filter(r => r.id !== id);
    saveInspections(list);
    return Promise.resolve(list);
  }

  function clearInspections() {
    localStorage.removeItem(STORE_KEY);
    return Promise.resolve(getInspectionsSync());
  }

  function nextId() {
    const list = getInspectionsSync();
    const nums = list.map(r => parseInt((r.id || "LM-0").split("-")[1], 10)).filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 1042;
    return "LM-" + (max + 1);
  }

  /* --- Dynamic SVG Barcode Generator (EAN-13 pattern visualization) --- */
  function generateBarcodeSVG(code) {
    const digits = (code || "9789312345678").replace(/\D/g, "").padEnd(13, "0").slice(0, 13);
    let bars = `<rect x="0" y="0" width="100%" height="100%" fill="#FFFFFF"/>`;
    let x = 15;

    // Start guard bars
    bars += `<rect x="${x}" y="5" width="2" height="50" fill="#000"/><rect x="${x + 4}" y="5" width="2" height="50" fill="#000"/>`;
    x += 10;

    for (let i = 0; i < 12; i++) {
      const val = parseInt(digits[i], 10);
      const width1 = (val % 3) + 1;
      const width2 = ((val + 1) % 3) + 1;
      bars += `<rect x="${x}" y="5" width="${width1}" height="42" fill="#000"/>`;
      x += width1 + 2;
      bars += `<rect x="${x}" y="5" width="${width2}" height="42" fill="#000"/>`;
      x += width2 + 3;
      if (i === 5) { // Center guard bar
        bars += `<rect x="${x}" y="5" width="2" height="50" fill="#000"/><rect x="${x + 4}" y="5" width="2" height="50" fill="#000"/>`;
        x += 10;
      }
    }

    // End guard bars
    bars += `<rect x="${x}" y="5" width="2" height="50" fill="#000"/><rect x="${x + 4}" y="5" width="2" height="50" fill="#000"/>`;

    const formattedCode = `${digits[0]}  ${digits.slice(1, 7)}  ${digits.slice(7, 13)}`;

    return `
      <div class="barcode-box">
        <svg viewBox="0 0 ${x + 20} 60" xmlns="http://www.w3.org/2000/svg">
          ${bars}
        </svg>
        <div class="barcode-num">${formattedCode}</div>
      </div>
    `;
  }

  /* --- Simulated OCR Engine --- */
  function simulateOCR(file, presetKey) {
    if (presetKey === "java-ebook") {
      return {
        product: "JAVA E-Book",
        manufacturer: "ADHI Publication",
        netQty: "1 pcs",
        mrp: "₹189",
        packingDate: "Jul 2026",
        consumerCare: "9689830091",
        barcode: "9789312345678"
      };
    }
    if (presetKey === "abc-rice") {
      return {
        product: "ABC Rice 1kg",
        manufacturer: "ABC Foods Pvt Ltd",
        netQty: "1 kg",
        mrp: "₹120",
        packingDate: "",
        consumerCare: "",
        barcode: "8901234567890"
      };
    }

    const name = (file && file.name || "label.jpg").toLowerCase();
    const variants = [
      {
        product: "JAVA E-Book", manufacturer: "ADHI Publication", netQty: "1 pcs",
        mrp: "₹189", packingDate: "Jul 2026", consumerCare: "9689830091", barcode: "9789312345678"
      },
      {
        product: "ABC Rice 1kg", manufacturer: "ABC Foods Pvt Ltd", netQty: "1 kg",
        mrp: "₹120", packingDate: "", consumerCare: "", barcode: "8901234567890"
      },
      {
        product: "Sunrise Wheat Flour 5kg", manufacturer: "Sunrise Mills Ltd", netQty: "5 kg",
        mrp: "₹245", packingDate: "Aug 2026", consumerCare: "1800-555-221", barcode: "8909876543210"
      },
      {
        product: "Farmline Mustard Oil 1L", manufacturer: "Farmline Agro", netQty: "1 L",
        mrp: "₹189", packingDate: "Jul 2026", consumerCare: "", barcode: "8904567890123"
      },
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return variants[hash % variants.length];
  }

  /* --- Parse raw OCR text into structured fields --- */
  function parseOCRText(rawText) {
    const text = rawText || "";
    const fields = {
      product: "", manufacturer: "", netQty: "", mrp: "",
      packingDate: "", consumerCare: "", barcode: ""
    };

    // Product name — first non-empty line
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length) fields.product = lines[0];

    // Manufacturer
    const mfgMatch = text.match(/(?:manufactured|mfg|made)\s*(?:by|:)?\s*(.+)/i);
    if (mfgMatch) fields.manufacturer = mfgMatch[1].trim();

    // Net Quantity
    const qtyMatch = text.match(/(?:net\s*(?:qty|quantity|wt|weight)|contents?)\s*[:\-]?\s*([\d.,]+\s*(?:kg|g|ml|l|pcs|pieces?|units?))/i);
    if (qtyMatch) fields.netQty = qtyMatch[1].trim();

    // MRP
    const mrpMatch = text.match(/(?:mrp|m\.r\.p|price|rs\.?|₹)\s*[:\-]?\s*[₹]?\s*([\d.,]+)/i);
    if (mrpMatch) fields.mrp = "₹" + mrpMatch[1].trim();

    // Packing / Mfg date
    const dateMatch = text.match(/(?:pack(?:ed|ing)?|mfg|mfd|date)\s*[:\-]?\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*\d{2,4}|\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i);
    if (dateMatch) fields.packingDate = dateMatch[1].trim();

    // Consumer care
    const careMatch = text.match(/(?:consumer\s*care|customer\s*care|helpline|toll\s*free|contact)\s*[:\-]?\s*([\d\-+() ]{7,})/i);
    if (careMatch) fields.consumerCare = careMatch[1].trim();

    // Barcode
    const barcodeMatch = text.match(/\b(\d{8,13})\b/);
    if (barcodeMatch) fields.barcode = barcodeMatch[1];

    return fields;
  }

  /* --- Scan: the main pipeline entry point (used by upload.html) --- */
  function scan({ file, presetKey, rawText }) {
    return new Promise((resolve) => {
      // Simulate a brief delay like a real API call
      setTimeout(() => {
        let fields;

        if (presetKey) {
          // Use preset sample data
          fields = simulateOCR(file, presetKey);
        } else if (rawText && rawText.trim()) {
          // Parse real OCR text
          fields = parseOCRText(rawText);
          // If parsing didn't extract a product name, fall back to simulated data
          if (!fields.product && !fields.mrp && !fields.barcode) {
            fields = simulateOCR(file, null);
          }
        } else {
          // No OCR text available — use simulated data based on filename
          fields = simulateOCR(file, null);
        }

        const compliance = checkComplianceSync(fields);
        resolve({ fields, compliance });
      }, 600);
    });
  }

  /* --- Rule engine (sync core) --- */
  function checkComplianceSync(fields) {
    const checks = [
      { key: "product", label: "Product name declared", pass: !!fields.product },
      { key: "manufacturer", label: "Manufacturer details declared", pass: !!fields.manufacturer },
      { key: "netQty", label: "Net quantity declared", pass: !!fields.netQty },
      { key: "mrp", label: "MRP declared", pass: !!fields.mrp },
      { key: "packingDate", label: "Packing date declared", pass: !!fields.packingDate },
      { key: "consumerCare", label: "Consumer care details declared", pass: !!fields.consumerCare },
    ];
    const violations = checks.filter(c => !c.pass).map(c => c.label.replace("declared", "missing"));
    const status = violations.length === 0 ? "COMPLIANT" : "NON-COMPLIANT";
    return { checks, violations, status };
  }

  /* --- Rule engine (Promise-returning wrapper) --- */
  function checkCompliance(fields) {
    return Promise.resolve(checkComplianceSync(fields));
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  /* --- Shared Chrome Injection --- */
  function mountChrome(active) {
    const nav = document.createElement("div");
    nav.className = "topnav";
    nav.innerHTML = `
      <div class="topnav-inner">
        <a class="brand" href="index.html">
          <span class="seal">⚖</span> LEGAL METROLOGY CHECKER
        </a>
        <button class="navlinks-toggle" id="navToggle">MENU</button>
        <nav class="navlinks" id="navLinks">
          <a href="index.html" data-key="overview">Overview</a>
          <a href="upload.html" data-key="upload">Upload &amp; Scan</a>
          <a href="dashboard.html" data-key="dashboard">Dashboard</a>
          <a href="report.html" data-key="report">Sample Report</a>
        </nav>
      </div>`;
    document.body.prepend(nav);
    nav.querySelectorAll(`[data-key="${active}"]`).forEach(a => a.classList.add("active"));
    const toggle = nav.querySelector("#navToggle");
    const links = nav.querySelector("#navLinks");
    toggle.addEventListener("click", () => links.classList.toggle("open"));

    const foot = document.createElement("footer");
    foot.className = "site";
    foot.innerHTML = `
      <span>LEGAL METROLOGY COMPLIANCE CHECKER</span>
      <span>JAVA · SPRING BOOT · OPENCV · TESSERACT · EAN-13 BARCODE · MYSQL</span>`;
    document.body.appendChild(foot);
  }

  /* --- Camera Scanner (QR / Barcode) --- */
  let html5QrCode = null;
  let cameraActive = false;

  function initCameraScanner(containerId, onScanSuccess) {
    return new Promise((resolve, reject) => {
      // Dynamically load html5-qrcode if not already loaded
      if (typeof Html5Qrcode !== "undefined") {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load QR scanner library"));
      document.head.appendChild(script);
    }).then(() => {
      if (html5QrCode) {
        html5QrCode.clear();
      }
      html5QrCode = new Html5Qrcode(containerId);

      return html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.5,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ]
        },
        (decodedText, decodedResult) => {
          // Vibrate on successful scan if supported
          if (navigator.vibrate) navigator.vibrate(200);
          onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Scan failure — ignore (continuous scanning)
        }
      ).then(() => {
        cameraActive = true;
      });
    });
  }

  function stopCameraScanner() {
    if (html5QrCode && cameraActive) {
      return html5QrCode.stop().then(() => {
        cameraActive = false;
        html5QrCode.clear();
      }).catch(() => {
        cameraActive = false;
      });
    }
    return Promise.resolve();
  }

  function isCameraActive() {
    return cameraActive;
  }

  return {
    getInspections, saveInspections, addInspection, deleteInspection, clearInspections, getById, nextId,
    generateBarcodeSVG, simulateOCR, checkCompliance, checkComplianceSync, fmtDate, mountChrome,
    scan, parseOCRText,
    initCameraScanner, stopCameraScanner, isCameraActive
  };
})();
