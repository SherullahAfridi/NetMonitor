import { useEffect, useMemo, useState } from "react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface NetworkEvent {
  id: number;
  source_ip: string | null;
  destination_ip: string | null;
  source_port: number | null;
  destination_port: number | null;
  protocol: string | null;
  event_type: string;
  description: string | null;
  timestamp: string;
}

interface ChartPoint {
  time: string;
  traffic: number;
}

export default function NetworkChart() {
  const [events, setEvents] = useState<
    NetworkEvent[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(
          "http://127.0.0.1:8000/api/events/"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load network events"
          );
        }

        const data =
          await response.json();

        setEvents(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load network chart data:",
          err
        );

        setEvents([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const chartData = useMemo<ChartPoint[]>(
    () => {
      if (events.length === 0) {
        return [];
      }

      const buckets = new Map<
        number,
        number
      >();

      events.forEach((event) => {
        const timestamp =
          new Date(
            event.timestamp
          ).getTime();

        if (
          Number.isNaN(timestamp)
        ) {
          return;
        }

        // Round timestamp down to
        // the nearest 5-minute window.
        const fiveMinutes =
          5 * 60 * 1000;

        const bucket =
          Math.floor(
            timestamp /
              fiveMinutes
          ) * fiveMinutes;

        buckets.set(
          bucket,
          (buckets.get(bucket) ?? 0) + 1
        );
      });

      return Array.from(
        buckets.entries()
      )
        .sort(
          ([a], [b]) => a - b
        )
        // Keep the latest 12 windows
        // so the chart stays readable.
        .slice(-12)
        .map(
          ([timestamp, count]) => ({
            time: new Date(
              timestamp
            ).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
            traffic: count,
          })
        );
    },
    [events]
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Network Activity
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Latest observed network events over time
            </p>
          </div>

          {!loading &&
            !error && (
              <div className="text-xs text-slate-500">
                {events.length.toLocaleString()} events
              </div>
            )}
        </div>
      </div>

      {/* ================================================== */}
      {/* Chart */}
      {/* ================================================== */}

      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate-500">
              Loading network activity...
            </p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-red-400">
              Unable to load network activity.
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-slate-500">
              No network events available.
            </p>
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={12}
              />

              <YAxis
                stroke="#64748b"
                fontSize={12}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor:
                    "#0f172a",
                  border:
                    "1px solid #334155",
                  borderRadius:
                    "8px",
                  color: "#fff",
                }}
                formatter={(
                  value
                ) => [
                  `${value} events`,
                  "Network Activity",
                ]}
              />

              <Area
                type="monotone"
                dataKey="traffic"
                stroke="#38bdf8"
                fill="#38bdf8"
                fillOpacity={0.12}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}