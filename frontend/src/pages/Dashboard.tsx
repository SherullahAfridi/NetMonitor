import { useEffect, useState } from "react";
import {
  Server,
  ShieldAlert,
  Activity,
  Wifi,
  AlertTriangle,
} from "lucide-react";

import StatCard from "../components/StatCard";
import NetworkChart from "../components/NetworkChart";

interface Asset {
  id: number;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  status: string;
}

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  risk_score: number;
  source_ip: string | null;
  destination_ip: string | null;
  protocol: string | null;
  description: string;
  status: string;
  detected_at: string;
  resolved_at: string | null;
}

interface Statistics {
  total_events: number;
  total_alerts: number;

  alerts: {
    new: number;
    investigating: number;
    resolved: number;
    false_positive: number;
  };

  severity: {
    high: number;
    medium: number;
    low: number;
  };

  alerts_by_type: Record<string, number>;

  events_by_type: Record<string, number>;

  average_risk_score: number;
}

export default function Dashboard() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        assetsResponse,
        alertsResponse,
        statisticsResponse,
      ] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/assets/"),
        fetch("http://127.0.0.1:8000/api/alerts/"),
        fetch("http://127.0.0.1:8000/api/statistics/"),
      ]);

      if (
        !assetsResponse.ok ||
        !alertsResponse.ok ||
        !statisticsResponse.ok
      ) {
        throw new Error(
          "Failed to load dashboard data"
        );
      }

      const assetsData = await assetsResponse.json();
      const alertsData = await alertsResponse.json();
      const statisticsData =
        await statisticsResponse.json();

      setAssets(
        Array.isArray(assetsData)
          ? assetsData
          : []
      );

      setAlerts(
        Array.isArray(alertsData)
          ? alertsData
          : []
      );

      setStatistics(
        statisticsData
      );
    } catch (error) {
      console.error(
        "Failed to load dashboard data:",
        error
      );

      setAssets([]);
      setAlerts([]);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onlineAssets = assets.filter(
    (asset) => asset.status === "online"
  );

  const recentAlerts = alerts.slice(0, 4);

  const topHosts = [...assets]
    .sort((a, b) => {
      if (
        a.status === "online" &&
        b.status !== "online"
      ) {
        return -1;
      }

      if (
        a.status !== "online" &&
        b.status === "online"
      ) {
        return 1;
      }

      return a.ip.localeCompare(b.ip);
    })
    .slice(0, 4);

  const alertsByType =
    statistics?.alerts_by_type ?? {};

  const portScans =
    alertsByType["POSSIBLE_PORT_SCAN"] ?? 0;

  const hostSweeps =
    alertsByType["POSSIBLE_HOST_SWEEP"] ?? 0;

  const unknownDevices =
    alertsByType["UNKNOWN_DEVICE"] ?? 0;

  const suspiciousTraffic =
    (alertsByType[
      "REPEATED_CONNECTION_ATTEMPTS"
    ] ?? 0) +
    (alertsByType[
      "HIGH_CONNECTION_RATE"
    ] ?? 0);

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* Page Header */}
      {/* ================================================== */}

      <div>
        <h1 className="text-2xl font-bold text-white">
          Security Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Real-time overview of network security activity
        </p>
      </div>

      {/* ================================================== */}
      {/* Statistics */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Assets"
          value={
            loading
              ? "—"
              : String(
                  onlineAssets.length
                )
          }
          change={
            loading
              ? "Loading network assets"
              : `${assets.length} discovered`
          }
          icon={Server}
        />

        <StatCard
          title="Security Alerts"
          value={
            loading
              ? "—"
              : String(
                  statistics?.total_alerts ?? 0
                )
          }
          change={
            loading
              ? "Loading detections"
              : `${statistics?.severity.high ?? 0} high severity`
          }
          icon={ShieldAlert}
          danger={
            (statistics?.total_alerts ?? 0) > 0
          }
        />

        <StatCard
          title="Network Events"
          value={
            loading
              ? "—"
              : (
                  statistics?.total_events ?? 0
                ).toLocaleString()
          }
          change={
            loading
              ? "Loading activity"
              : "Recorded network activity"
          }
          icon={Activity}
        />

        <StatCard
          title="Average Risk"
          value={
            loading
              ? "—"
              : `${statistics?.average_risk_score ?? 0}/100`
          }
          change={
            loading
              ? "Calculating risk"
              : "Across generated alerts"
          }
          icon={Wifi}
        />
      </div>

      {/* ================================================== */}
      {/* Main Analytics */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <NetworkChart />
        </div>

        {/* ================================================== */}
        {/* Recent Alerts */}
        {/* ================================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Alerts
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Latest security detections
              </p>
            </div>

            <AlertTriangle
              size={20}
              className="text-yellow-400"
            />
          </div>

          <div className="space-y-4">
            {recentAlerts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-400">
                  No security alerts
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  Detection engine has not generated
                  alerts yet.
                </p>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  severity={alert.severity}
                  title={alert.alert_type}
                  source={
                    alert.source_ip ||
                    "Unknown source"
                  }
                  time={new Date(
                    alert.detected_at
                  ).toLocaleString()}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* Bottom Section */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================================================== */}
        {/* Top Network Hosts */}
        {/* ================================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white">
            Top Network Hosts
          </h2>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">
                Loading hosts...
              </p>
            ) : topHosts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No network hosts discovered.
              </p>
            ) : (
              topHosts.map((asset) => (
                <HostRow
                  key={asset.id}
                  ip={asset.ip}
                  events="—"
                  status={
                    asset.status === "online"
                      ? "Online"
                      : "Offline"
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* ================================================== */}
        {/* Detection Summary */}
        {/* ================================================== */}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Detection Summary
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Live statistics from the detection engine
              </p>
            </div>

            <ShieldAlert
              size={20}
              className="text-red-400"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <DetectionBox
              label="Port Scans"
              value={String(portScans)}
            />

            <DetectionBox
              label="Host Sweeps"
              value={String(hostSweeps)}
            />

            <DetectionBox
              label="Unknown Devices"
              value={String(unknownDevices)}
            />

            <DetectionBox
              label="Suspicious Traffic"
              value={String(
                suspiciousTraffic
              )}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                New Alerts
              </span>

              <span className="text-white font-medium">
                {statistics?.alerts.new ?? 0}
              </span>
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span className="text-slate-500">
                Investigating
              </span>

              <span className="text-white font-medium">
                {statistics?.alerts.investigating ?? 0}
              </span>
            </div>

            <div className="flex justify-between text-xs mt-2">
              <span className="text-slate-500">
                Resolved
              </span>

              <span className="text-white font-medium">
                {statistics?.alerts.resolved ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* Alert Item */
/* ========================================================= */

function AlertItem({
  severity,
  title,
  source,
  time,
}: {
  severity: string;
  title: string;
  source: string;
  time: string;
}) {
  const normalizedSeverity =
    severity.toUpperCase();

  const severityClass =
    normalizedSeverity === "HIGH" ||
    normalizedSeverity === "CRITICAL"
      ? "text-red-400"
      : normalizedSeverity === "MEDIUM"
        ? "text-yellow-400"
        : "text-blue-400";

  return (
    <div className="border-b border-slate-800 pb-3">
      <div className="flex justify-between gap-3">
        <p className="text-sm text-white">
          {title}
        </p>

        <span
          className={`text-[10px] font-bold ${severityClass}`}
        >
          {normalizedSeverity}
        </span>
      </div>

      <div className="flex justify-between mt-1 gap-3">
        <span className="text-xs text-slate-500">
          {source}
        </span>

        <span className="text-xs text-slate-600">
          {time}
        </span>
      </div>
    </div>
  );
}

/* ========================================================= */
/* Host Row */
/* ========================================================= */

function HostRow({
  ip,
  events,
  status,
}: {
  ip: string;
  events: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-950 rounded-lg p-3">
      <div>
        <p className="text-sm text-white">
          {ip}
        </p>

        <p className="text-xs text-slate-500">
          {events === "—"
            ? "Network activity"
            : `${events} events`}
        </p>
      </div>

      <span className="text-xs text-emerald-400">
        {status}
      </span>
    </div>
  );
}

/* ========================================================= */
/* Detection Box */
/* ========================================================= */

function DetectionBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950 rounded-lg p-4">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="text-xl font-bold text-white mt-1">
        {value}
      </p>
    </div>
  );
}