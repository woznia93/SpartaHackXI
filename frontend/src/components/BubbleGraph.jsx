import React, { useRef, useEffect, useMemo, useCallback } from "react";
import * as d3 from "d3";

export default function BubbleGraph({
  ast,
  selectedId,
  onSelect,
  locked = false,
  resetSignal = 0,
}) {
  const { nodes: layoutNodes, links: layoutLinks, width, height } = useMemo(
    () => layoutGraph(ast),
    [ast]
  );

  // Mutable ref — holds current x/y for every node. Seeded from layout, mutated by drag.
  const positionsRef = useRef({});
  const svgRef = useRef();
  const nodesRef = useRef(null);     // live d3 selection of node <g>s
  const linksRef = useRef(null);     // live d3 selection of link <line>s
  const lastResetRef = useRef(resetSignal);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Seed positions from layout whenever the AST changes
  useEffect(() => {
    const map = {};
    layoutNodes.forEach((n) => {
      map[n.id] = { x: n.x, y: n.y };
    });
    positionsRef.current = map;
  }, [layoutNodes]);

  // Reset: snap every node back to its original layout position, leave the view alone
  useEffect(() => {
    if (resetSignal === lastResetRef.current) return;
    lastResetRef.current = resetSignal;

    // Overwrite every position with the original layout position
    layoutNodes.forEach((n) => {
      positionsRef.current[n.id] = { x: n.x, y: n.y };
    });

    // Move nodes in place
    if (nodesRef.current) {
      nodesRef.current.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    // Move links in place
    if (linksRef.current) {
      linksRef.current
        .attr("x1", (d) => d.from.x)
        .attr("y1", (d) => d.from.y)
        .attr("x2", (d) => d.to.x)
        .attr("y2", (d) => d.to.y);
    }
  }, [resetSignal, layoutNodes]);

  // Re-draw when anything visual changes
  useEffect(() => {
    draw();
  }, [layoutNodes, layoutLinks, width, height]);

  // Lock/unlock: just flip cursors in place, don't touch the rest of the SVG
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.style("cursor", locked ? "default" : "grab");
    }
  }, [locked]);

  // Selection: patch circle fill/stroke in place
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current
        .select("circle")
        .attr("fill", (d) => (d.id === selectedId ? "rgba(255,255,255,0.13)" : "#2a2a2a"))
        .attr("stroke", (d) => (d.id === selectedId ? "#fff" : "#3a3a3a"))
        .attr("stroke-width", (d) => (d.id === selectedId ? 2.5 : 1.2));
    }
  }, [selectedId]);

  const draw = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Zoom/pan container
    const container = svg.append("g");
    const zoom = d3.zoom().scaleExtent([0.25, 4]).on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
    svg.call(zoom);

    // Helper: current position for a node
    const pos = (n) => positionsRef.current[n.id] ?? { x: n.x, y: n.y };

    // --- Links ---
    const links = container
      .append("g")
      .selectAll("line")
      .data(layoutLinks)
      .join("line")
      .attr("x1", (d) => pos(d.from).x)
      .attr("y1", (d) => pos(d.from).y)
      .attr("x2", (d) => pos(d.to).x)
      .attr("y2", (d) => pos(d.to).y)
      .attr("stroke", "#3a3a3a")
      .attr("stroke-width", 1.5);
    linksRef.current = links;

    // --- Nodes ---
    const nodes = container
      .append("g")
      .selectAll("g")
      .data(layoutNodes)
      .join("g")
      .style("cursor", (d) => (lockedRef.current ? "default" : "grab"))
      .attr("transform", (d) => {
        const p = pos(d);
        return `translate(${p.x},${p.y})`;
      });
    nodesRef.current = nodes;

    nodes
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => (d.id === selectedIdRef.current ? "rgba(255,255,255,0.13)" : "#2a2a2a"))
      .attr("stroke", (d) => (d.id === selectedIdRef.current ? "#fff" : "#3a3a3a"))
      .attr("stroke-width", (d) => (d.id === selectedIdRef.current ? 2.5 : 1.2));

    nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#f0f0f0")
      .attr("font-size", 11)
      .style("pointer-events", "none")
      .style("user-select", "none")
      .text((d) => d.label);

    // --- Click ---
    nodes.on("click", (event, d) => {
      event.stopPropagation();
      onSelect && onSelect(d.raw);
    });
    svg.on("click", () => onSelect && onSelect(null));

    // --- Drag (delta-based to avoid coordinate-space mismatch on first move) ---
    let dragOrigin = { x: 0, y: 0 };   // pointer position at dragstart
    let nodeOrigin = { x: 0, y: 0 };   // node position at dragstart

    const drag = d3
      .drag()
      .on("start", function (event, d) {
        if (lockedRef.current) return;
        d3.select(this).style("cursor", "grabbing");
        // Snapshot where the pointer and the node actually are right now
        dragOrigin = { x: event.x, y: event.y };
        nodeOrigin = { ...positionsRef.current[d.id] };
      })
      .on("drag", function (event, d) {
        if (lockedRef.current) return;
        // Move = where the pointer has moved since dragstart
        const nx = nodeOrigin.x + (event.x - dragOrigin.x);
        const ny = nodeOrigin.y + (event.y - dragOrigin.y);
        positionsRef.current[d.id] = { x: nx, y: ny };

        d3.select(this).attr("transform", `translate(${nx},${ny})`);

        links
          .attr("x1", (l) => pos(l.from).x)
          .attr("y1", (l) => pos(l.from).y)
          .attr("x2", (l) => pos(l.to).x)
          .attr("y2", (l) => pos(l.to).y);
      })
      .on("end", function () {
        if (lockedRef.current) return;
        d3.select(this).style("cursor", "grab");
      });

    nodes.call(drag);
  }, [layoutNodes, layoutLinks, onSelect]);

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

/* ─── Layout ─── */
function layoutGraph(ast) {
  const nodes = [];
  const links = [];
  const columnWidth = 140;
  const rowHeight = 90;
  const paddingX = 60;
  const paddingY = 30;

  // First pass: walk the tree, collect nodes + links, count leaves to assign x slots
  let leafCounter = 0;

  function getChildren(n) {
    if (!n || typeof n !== "object") return [];
    if (Array.isArray(n.children)) return n.children;
    if (Array.isArray(n.body)) return n.body;
    if (n.left && n.right) return [n.left, n.right].filter(Boolean);
    return [];
  }

  // Returns the x position assigned to this node (used to center parents)
  function walk(node, depth) {
    if (!node) return 0;

    const id = node.id ?? `node-${nodes.length}`;
    const kids = getChildren(node);

    // Push node placeholder — x will be filled in below
    const entry = { id, raw: node, depth, label: node.type ?? "Node", x: 0 };
    nodes.push(entry);

    if (kids.length === 0) {
      // Leaf: claim the next slot
      entry.x = leafCounter;
      leafCounter++;
    } else {
      // Branch: recurse children, then center over their x range
      let minX = Infinity;
      let maxX = -Infinity;
      kids.forEach((child) => {
        links.push({ from: node, to: child });
        const childX = walk(child, depth + 1);
        minX = Math.min(minX, childX);
        maxX = Math.max(maxX, childX);
      });
      entry.x = (minX + maxX) / 2;
    }

    return entry.x;
  }

  walk(ast, 0);

  // Second pass: convert slot indices to pixel positions, compute radii
  nodes.forEach((n) => {
    n.x = paddingX + n.x * columnWidth;
    n.y = paddingY + n.depth * rowHeight;
    n.r = 18 + Math.min(22, Math.max(0, childCount(n.raw) * 2));
  });

  // Resolve link references from raw AST nodes → our node objects
  const rawToNode = new Map(nodes.map((n) => [n.raw, n]));
  links.forEach((l) => {
    l.from = rawToNode.get(l.from) ?? l.from;
    l.to = rawToNode.get(l.to) ?? l.to;
  });

  const maxX = nodes.reduce((m, n) => Math.max(m, n.x), 0);
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  const width = Math.max(600, maxX + paddingX * 2);
  const height = Math.max(320, paddingY * 2 + maxDepth * rowHeight + 120);

  return { nodes, links, width, height };
}

function childCount(node) {
  function getKids(n) {
    if (!n || typeof n !== "object") return [];
    if (Array.isArray(n.children)) return n.children;
    if (Array.isArray(n.body)) return n.body;
    if (n.left && n.right) return [n.left, n.right].filter(Boolean);
    return [];
  }
  const kids = getKids(node);
  let count = kids.length;
  for (const k of kids) count += childCount(k);
  return count;
}