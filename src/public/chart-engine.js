/**
 * chart-engine.js
 *
 * A small, dependency-light wrapper around D3.js v7 that turns a plain
 * JSON config into a rendered chart (bar / pie / bubble / line), complete
 * with a shared tooltip and consistent margins/axes handling.
 *
 * This is an original, from-scratch implementation written for this
 * portfolio project. It is NOT copied from, and does not contain any code
 * from, any employer's internal codebase.
 *
 * Usage:
 *   renderChart("#chart", {
 *     type: "bar",
 *     title: "Quarterly Revenue",
 *     color: "#3D5AFE",
 *     data: [{ label: "Q1", value: 320 }, ...]
 *   });
 */

(function (global) {
  const MARGIN = { top: 40, right: 30, bottom: 40, left: 50 };

  function ensureTooltip() {
    let tooltip = d3.select("body").select(".cs-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "cs-tooltip")
        .style("opacity", 0);
    }
    return tooltip;
  }

  function showTooltip(tooltip, event, html) {
    tooltip
      .html(html)
      .style("left", event.pageX + 12 + "px")
      .style("top", event.pageY - 12 + "px")
      .transition()
      .duration(120)
      .style("opacity", 1);
  }

  function hideTooltip(tooltip) {
    tooltip.transition().duration(150).style("opacity", 0);
  }

  function baseSvg(container, width, height) {
    d3.select(container).select("svg").remove();
    return d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img");
  }

  function drawTitle(svg, title, width) {
    if (!title) return;
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 22)
      .attr("text-anchor", "middle")
      .attr("class", "cs-chart-title")
      .text(title);
  }

  function renderBar(container, config, width, height) {
    const svg = baseSvg(container, width, height);
    drawTitle(svg, config.title, width);
    const tooltip = ensureTooltip();

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleBand().domain(config.data.map((d) => d.label)).range([0, innerW]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(config.data, (d) => d.value) * 1.15]).range([innerH, 0]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x)).attr("class", "cs-axis");
    g.append("g").call(d3.axisLeft(y).ticks(5)).attr("class", "cs-axis");

    g.selectAll(".bar")
      .data(config.data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => innerH - y(d.value))
      .attr("fill", config.color || "#3D5AFE")
      .attr("rx", 3)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        showTooltip(tooltip, event, `<strong>${d.label}</strong><br/>${d.value}`);
      })
      .on("mousemove", (event) => showTooltip(tooltip, event, tooltip.html()))
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
        hideTooltip(tooltip);
      });
  }

  function renderLine(container, config, width, height) {
    const svg = baseSvg(container, width, height);
    drawTitle(svg, config.title, width);
    const tooltip = ensureTooltip();

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scalePoint().domain(config.data.map((d) => d.label)).range([0, innerW]).padding(0.5);
    const y = d3.scaleLinear().domain([0, d3.max(config.data, (d) => d.value) * 1.15]).range([innerH, 0]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x)).attr("class", "cs-axis");
    g.append("g").call(d3.axisLeft(y).ticks(5)).attr("class", "cs-axis");

    const line = d3.line().x((d) => x(d.label)).y((d) => y(d.value)).curve(d3.curveMonotoneX);

    g.append("path")
      .datum(config.data)
      .attr("fill", "none")
      .attr("stroke", config.color || "#F96167")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    g.selectAll(".dot")
      .data(config.data)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.label))
      .attr("cy", (d) => y(d.value))
      .attr("r", 5)
      .attr("fill", config.color || "#F96167")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 7);
        showTooltip(tooltip, event, `<strong>${d.label}</strong><br/>${d.value}`);
      })
      .on("mousemove", (event) => showTooltip(tooltip, event, tooltip.html()))
      .on("mouseleave", function () {
        d3.select(this).attr("r", 5);
        hideTooltip(tooltip);
      });
  }

  function renderPie(container, config, width, height) {
    const svg = baseSvg(container, width, height);
    drawTitle(svg, config.title, width);
    const tooltip = ensureTooltip();

    const radius = Math.min(width, height - MARGIN.top) / 2 - 20;
    const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2 + 10})`);

    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const pie = d3.pie().value((d) => d.value)(config.data);
    const arc = d3.arc().innerRadius(radius * 0.45).outerRadius(radius);

    g.selectAll("path")
      .data(pie)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 0.8);
        showTooltip(tooltip, event, `<strong>${d.data.label}</strong><br/>${d.data.value}`);
      })
      .on("mousemove", (event) => showTooltip(tooltip, event, tooltip.html()))
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 1);
        hideTooltip(tooltip);
      });

    // simple legend
    const legend = svg.append("g").attr("transform", `translate(${width - 120}, ${height - config.data.length * 20 - 10})`);
    config.data.forEach((d, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(i)).attr("rx", 2);
      row.append("text").attr("x", 18).attr("y", 10).attr("class", "cs-legend").text(d.label);
    });
  }

  function renderBubble(container, config, width, height) {
    const svg = baseSvg(container, width, height);
    drawTitle(svg, config.title, width);
    const tooltip = ensureTooltip();

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append("g").attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(config.data, (d) => d.x) * 1.15]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(config.data, (d) => d.y) * 1.15]).range([innerH, 0]);
    const r = d3.scaleSqrt().domain([0, d3.max(config.data, (d) => d.r)]).range([4, 38]);

    g.append("g").attr("transform", `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(5)).attr("class", "cs-axis");
    g.append("g").call(d3.axisLeft(y).ticks(5)).attr("class", "cs-axis");

    g.selectAll("circle")
      .data(config.data)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", (d) => r(d.r))
      .attr("fill", config.color || "#00A896")
      .attr("fill-opacity", 0.75)
      .attr("stroke", config.color || "#00A896")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("fill-opacity", 1);
        showTooltip(tooltip, event, `<strong>${d.label}</strong><br/>x:${d.x} y:${d.y} r:${d.r}`);
      })
      .on("mousemove", (event) => showTooltip(tooltip, event, tooltip.html()))
      .on("mouseleave", function () {
        d3.select(this).attr("fill-opacity", 0.75);
        hideTooltip(tooltip);
      });
  }

  const RENDERERS = { bar: renderBar, pie: renderPie, bubble: renderBubble, line: renderLine };

  function renderChart(container, config) {
    const el = document.querySelector(container);
    const width = el.clientWidth || 640;
    const height = 420;
    const renderer = RENDERERS[config.type];
    if (!renderer) throw new Error(`Unsupported chart type: ${config.type}`);
    renderer(container, config, width, height);
  }

  global.ChartEngine = { renderChart };
})(window);
