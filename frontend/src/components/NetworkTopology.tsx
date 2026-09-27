import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

interface Asset {
  id: number;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  status: string;
}

export default function NetworkTopology() {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/assets/")
      .then((response) => response.json())
      .then((data) => {
        setAssets(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((error) =>
        console.error(
          "Failed to load topology assets:",
          error
        )
      );
  }, []);

  const gateway = assets.find(
    (asset) =>
      asset.ip === "192.168.1.1"
  );

  const otherAssets = assets.filter(
    (asset) =>
      asset.ip !== "192.168.1.1"
  );

  /* ====================================================== */
  /* Create Nodes */
  /* ====================================================== */

  const nodes = useMemo<Node[]>(() => {
    if (assets.length === 0) {
      return [];
    }

    const centerX = 500;
    const centerY = 190;

    const radiusX = 340;
    const radiusY = 140;

    const result: Node[] = [];

    /* ==================================================== */
    /* Gateway */
    /* ==================================================== */

    if (gateway) {
      result.push({
        id: `asset-${gateway.id}`,

        position: {
          x: centerX,
          y: centerY,
        },

        data: {
          label: `Gateway • ${gateway.ip}`,
        },

        style: {
          background:
            "#0f172a",

          color:
            "#38bdf8",

          border:
            "2px solid #38bdf8",

          borderRadius:
            "10px",

          padding:
            "12px 18px",

          width:
            190,

          textAlign:
            "center",

          fontWeight:
            600,

          boxShadow:
            "0 0 18px rgba(56, 189, 248, 0.18)",
        },
      });
    }

    /* ==================================================== */
    /* Other Hosts */
    /* ==================================================== */

    otherAssets.forEach(
      (asset, index) => {
        const angle =
          (index /
            Math.max(
              otherAssets.length,
              1
            )) *
          Math.PI *
          2;

        /*
         * If hostname is the same as IP,
         * show only the IP.
         *
         * Example:
         * hostname = 192.168.1.7
         * IP       = 192.168.1.7
         *
         * Result:
         * 192.168.1.7
         */

        const displayLabel =
          asset.hostname &&
          asset.hostname !== asset.ip
            ? `${asset.hostname} • ${asset.ip}`
            : asset.ip;

        const isOnline =
          asset.status ===
          "online";

        result.push({
          id: `asset-${asset.id}`,

          position: {
            x:
              centerX +
              Math.cos(angle) *
                radiusX,

            y:
              centerY +
              Math.sin(angle) *
                radiusY,
          },

          data: {
            label:
              displayLabel,
          },

          style: {
            background:
              "#111827",

            color:
              "#e2e8f0",

            border:
              isOnline
                ? "1px solid #334155"
                : "1px solid #7f1d1d",

            borderRadius:
              "10px",

            padding:
              "10px 14px",

            width:
              180,

            textAlign:
              "center",

            fontSize:
              12,

            fontWeight:
              500,

            boxShadow:
              isOnline
                ? "0 4px 15px rgba(0, 0, 0, 0.25)"
                : "0 0 12px rgba(127, 29, 29, 0.25)",
          },
        });
      }
    );

    return result;
  }, [
    assets,
    gateway,
    otherAssets,
  ]);

  /* ====================================================== */
  /* Create Edges */
  /* ====================================================== */

  const edges = useMemo<Edge[]>(
    () => {
      if (!gateway) {
        return [];
      }

      return otherAssets.map(
        (asset) => ({
          id: `edge-${gateway.id}-${asset.id}`,

          source: `asset-${gateway.id}`,

          target: `asset-${asset.id}`,

          animated: true,

          style: {
            stroke:
              "#2563eb",

            strokeWidth:
              1.5,
          },
        })
      );
    },
    [
      gateway,
      otherAssets,
    ]
  );

  /* ====================================================== */
  /* Render */
  /* ====================================================== */

  return (
    <div className="w-full h-[420px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{
          padding: 0.25,
          maxZoom: 1.2,
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{
          hideAttribution: true,
        }}
      >
        {/* Background Grid */}

        <Background
          color="#1e293b"
          gap={20}
          size={1}
        />

        {/* Mini Map */}

        <MiniMap
          nodeColor={(node) =>
            node.id ===
            (gateway
              ? `asset-${gateway.id}`
              : "")
              ? "#38bdf8"
              : "#2563eb"
          }
          maskColor="rgba(2, 6, 23, 0.75)"
          style={{
            background:
              "#0f172a",

            border:
              "1px solid #334155",

            borderRadius:
              "6px",
          }}
        />
      </ReactFlow>
    </div>
  );
}