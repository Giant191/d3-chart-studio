const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

// Health check endpoint - also used by Cloud Run for readiness
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "d3-chart-studio", time: new Date().toISOString() });
});

// A few ready-made sample configs so the demo works with zero typing
const SAMPLES = {
  bar: {
    type: "bar",
    title: "Quarterly Revenue",
    data: [
      { label: "Q1", value: 320 },
      { label: "Q2", value: 410 },
      { label: "Q3", value: 380 },
      { label: "Q4", value: 460 },
    ],
    color: "#3D5AFE",
  },
  pie: {
    type: "pie",
    title: "Traffic by Channel",
    data: [
      { label: "Direct", value: 45 },
      { label: "Search", value: 30 },
      { label: "Social", value: 15 },
      { label: "Referral", value: 10 },
    ],
  },
  bubble: {
    type: "bubble",
    title: "Product Size vs Sales",
    data: [
      { label: "A", x: 10, y: 30, r: 12 },
      { label: "B", x: 40, y: 55, r: 22 },
      { label: "C", x: 65, y: 20, r: 8 },
      { label: "D", x: 80, y: 70, r: 30 },
    ],
    color: "#00A896",
  },
  line: {
    type: "line",
    title: "Weekly Active Users",
    data: [
      { label: "W1", value: 120 },
      { label: "W2", value: 150 },
      { label: "W3", value: 130 },
      { label: "W4", value: 190 },
      { label: "W5", value: 210 },
    ],
    color: "#F96167",
  },
};

app.get("/api/charts/samples", (req, res) => {
  res.json(SAMPLES);
});

// Minimal schema validation - mirrors the JSON-driven config approach
// used by the original internal chart utility library.
function validateConfig(cfg) {
  const errors = [];
  const validTypes = ["bar", "pie", "bubble", "line"];

  if (!cfg || typeof cfg !== "object") {
    return ["config must be a JSON object"];
  }
  if (!validTypes.includes(cfg.type)) {
    errors.push(`type must be one of: ${validTypes.join(", ")}`);
  }
  if (!Array.isArray(cfg.data) || cfg.data.length === 0) {
    errors.push("data must be a non-empty array");
    return errors;
  }
  if (cfg.type === "bubble") {
    cfg.data.forEach((d, i) => {
      if (typeof d.x !== "number" || typeof d.y !== "number" || typeof d.r !== "number") {
        errors.push(`data[${i}] must have numeric x, y, r for bubble charts`);
      }
    });
  } else {
    cfg.data.forEach((d, i) => {
      if (typeof d.value !== "number") {
        errors.push(`data[${i}].value must be a number`);
      }
      if (typeof d.label !== "string") {
        errors.push(`data[${i}].label must be a string`);
      }
    });
  }
  return errors;
}

app.post("/api/charts/validate", (req, res) => {
  const errors = validateConfig(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ valid: false, errors });
  }
  res.json({ valid: true });
});

app.listen(PORT, () => {
  console.log(`d3-chart-studio listening on port ${PORT}`);
});
