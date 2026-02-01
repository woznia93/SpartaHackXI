import React, { useRef, useEffect, useMemo } from "react";
import * as d3 from "d3";

export default function BubbleGraph({ ast, selectedId, onSelect, preserveStructure = true, strictMode = false, resetSignal = 0, fitSignal = 0 }) {
  const { nodes: initialNodes, links: initialLinks, width, height } = useMemo(() => layoutGraph(ast), [ast]);
  const svgRef = useRef();
  const innerGRef = useRef();
  const simulationRef = useRef();
  const zoomRef = useRef();
  const lastResetRef = useRef(resetSignal);
  const lastFitRef = useRef(fitSignal);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clone data so d3 may mutate x/y/fx/fy
    const nodes = initialNodes.map((n) => ({ ...n, id: n.id ?? n.key }));
    const links = initialLinks.map((l) => ({ source: l.from.id ?? l.from.key, target: l.to.id ?? l.to.key }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // clear previous

    // Setup zoom / pan
    const container = svg.append("g").attr("class", "container").attr("transform", "translate(0,0)");
    innerGRef.current = container.node();

    const zoom = d3.zoom().scaleExtent([0.25, 3]).on("zoom", (event) => {
      container.attr("transform", event.transform);
    });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Links
    const link = container.append("g").attr("class", "links").selectAll("line").data(links).join("line")
      .attr("stroke", "#2a2a2a")
      .attr("stroke-width", 1);

    // Nodes
    const node = container.append("g").attr("class", "nodes").selectAll("g").data(nodes, (d) => d.id).join((enter) => {
      const g = enter.append("g").attr("class", "node").style("cursor", "pointer");
      g.append("circle")
        .attr("r", (d) => d.r)
        .attr("fill", (d) => (d.id && d.id === selectedId ? "rgba(255,255,255,0.12)" : "#2a2a2a"))
        .attr("stroke", (d) => (d.id && d.id === selectedId ? "#ffffff" : "#2a2a2a"))
        .attr("stroke-width", (d) => (d.id && d.id === selectedId ? 2 : 1));
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", "#f5f5f5")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .attr("font-size", 11)
        .text((d) => d.label);

      return g;
    });

    node.on("click", (event, d) => {
      event.stopPropagation();
      onSelect && onSelect(d.raw);
    });

    // Drag behavior (handles strict vs soft preserve)
    const drag = d3.drag()
      .on("start", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
        if (strictMode) {
          // snap back to layout
          d.fx = d._layoutX;
          d.fy = d._layoutY;
          if (simulationRef.current) simulationRef.current.alpha(0.5).restart();
        } else {
          // persist at new position
          d.fx = d.x;
          d.fy = d.y;
        }
      });

    node.call(drag);

    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => 60 + 20 * Math.abs((d.source.depth || 0) - (d.target.depth || 0))).strength(1))
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => d.r + 4));

    // preserve structure softly with forceX/forceY
    if (preserveStructure && !strictMode) {
      sim.force("x", d3.forceX((d) => d._layoutX).strength(0.18));
      sim.force("y", d3.forceY((d) => d._layoutY).strength(0.9));
    }

    // if strict mode -> pin nodes to layout positions
    if (strictMode) {
      nodes.forEach((n) => {
        n.fx = n._layoutX;
        n.fy = n._layoutY;
      });
    }

    sim.on("tick", ticked);
    simulationRef.current = sim;

    // Initialize positions from layout when available and store layout targets
    nodes.forEach((n) => {
      n._layoutX = typeof n.x === "number" ? n.x : width / 2 + (Math.random() - 0.5) * 80;
      n._layoutY = typeof n.y === "number" ? n.y : height / 2 + (Math.random() - 0.5) * 80;
      // start near their layout positions
      n.x = n._layoutX + (Math.random() - 0.5) * 20;
      n.y = n._layoutY + (Math.random() - 0.5) * 20;
      // if strict mode -> lock to layout immediately
      if (strictMode) {
        n.fx = n._layoutX;
        n.fy = n._layoutY;
      }
    });

    function ticked() {
      link
        .attr("x1", (d) => (d.source.x))
        .attr("y1", (d) => (d.source.y))
        .attr("x2", (d) => (d.target.x))
        .attr("y2", (d) => (d.target.y));

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    // click background to clear selection
    svg.on("click", () => onSelect && onSelect(null));

    // cleanup
    return () => {
      sim.stop();
      svg.on("click", null);
      svg.call(d3.zoom().on("zoom", null));
    };
  }, [ast, initialNodes, initialLinks, width, height, onSelect, selectedId, preserveStructure, strictMode]);

  // update visual selection if selectedId changes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("g.node").selectAll("circle").attr("fill", (d) => (d.id && d.id === selectedId ? "rgba(7, 7, 7, 0.28)" : "#111111"))
      .attr("stroke", (d) => (d.id && d.id === selectedId ? "#ffffff" : "#969696"))
      .attr("stroke-width", (d) => (d.id && d.id === selectedId ? 2 : 1));
  }, [selectedId]);

  // react to reset & fit signals without re-creating full simulation when possible
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const sim = simulationRef.current;
    if (!svgRef.current || !sim) return;

    // reset
    if (resetSignal !== lastResetRef.current) {
      lastResetRef.current = resetSignal;
      const nodes = sim.nodes();
      nodes.forEach((n) => {
        n.x = n._layoutX;
        n.y = n._layoutY;
        if (strictMode) {
          n.fx = n._layoutX;
          n.fy = n._layoutY;
        } else if (preserveStructure) {
          // let forces pull it back (clear manual pins)
          n.fx = null;
          n.fy = null;
        } else {
          n.fx = null;
          n.fy = null;
        }
      });
      sim.alpha(1).restart();
    }

    // fit
    if (fitSignal !== lastFitRef.current) {
      lastFitRef.current = fitSignal;
      const nodes = sim.nodes();
      if (!nodes || nodes.length === 0) return;
      const xs = nodes.map((n) => n.x);
      const ys = nodes.map((n) => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const pad = 40;
      const boxW = Math.max(1, maxX - minX + pad * 2);
      const boxH = Math.max(1, maxY - minY + pad * 2);
      const scale = Math.max(0.25, Math.min(3, Math.min(width / boxW, height / boxH)));
      const tx = width / 2 - scale * (minX + maxX) / 2;
      const ty = height / 2 - scale * (minY + maxY) / 2;
      const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
      if (zoomRef.current) {
        svg.transition().duration(400).call(zoomRef.current.transform, t);
      }
    }
  }, [resetSignal, fitSignal, preserveStructure, strictMode, width, height]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", background: "transparent" }}
    />
  );
}

function layoutGraph(ast) {
  const nodes = [];
  const links = [];
  const columnWidth = 200;
  const rowHeight = 90;
  const paddingX = 30;
  const paddingY = 30;

  const levels = [];

  function getChildren(n) {
    if (!n || typeof n !== "object") return [];
    if (Array.isArray(n.children)) return n.children;
    if (Array.isArray(n.body)) return n.body;
    if (n.left && n.right) return [n.left, n.right].filter(Boolean);
    return [];
  }

  function walk(node, depth) {
    if (!node) return;
    if (!levels[depth]) levels[depth] = [];
    const index = levels[depth].length;
    levels[depth].push(node);

    nodes.push({
      id: node.id,
      key: node.id ?? `${depth}-${index}`,
      raw: node,
      depth,
      index,
      label: node.type ?? "Node",
    });

    const kids = getChildren(node);
    kids.forEach((child) => {
      links.push({ from: node, to: child });
      walk(child, depth + 1);
    });
  }

  walk(ast, 0);

  nodes.forEach((n) => {
    n.x = paddingX + n.index * columnWidth;
    n.y = paddingY + n.depth * rowHeight;
    n.r = 18 + Math.min(22, Math.max(0, childCount(n.raw) * 2));
  });

  const maxCols = levels.reduce((m, level) => Math.max(m, level.length), 1);
  const width = Math.max(600, paddingX * 2 + (maxCols - 1) * columnWidth + 120);
  const height = Math.max(320, paddingY * 2 + (levels.length - 1) * rowHeight + 120);

  return { nodes, links, width, height };
}

function childCount(node) {
  const kids = getKids(node);
  let count = kids.length;
  for (const k of kids) count += childCount(k);
  return count;

  function getKids(n) {
    if (!n || typeof n !== "object") return [];
    if (Array.isArray(n.children)) return n.children;
    if (Array.isArray(n.body)) return n.body;
    if (n.left && n.right) return [n.left, n.right].filter(Boolean);
    return [];
  }
}
