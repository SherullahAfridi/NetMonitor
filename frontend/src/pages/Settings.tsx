import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Wifi,
} from "lucide-react";

interface DetectionRule {
  id: number;
  rule_name: string;
  rule_type: string;
  description: string;
  enabled: boolean;
  threshold: number;
  window_seconds: number;
  severity: string;
  risk_score: number;
}

export default function Settings() {
  const [backendHealthy, setBackendHealthy] =
    useState<boolean | null>(null);

  const [collectorRunning, setCollectorRunning] =
    useState<boolean | null>(null);

  const [rules, setRules] =
    useState<DetectionRule[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingRule, setUpdatingRule] =
    useState<number | null>(null);

  const [collectorAction, setCollectorAction] =
    useState<"start" | "stop" | null>(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [
        healthResponse,
        collectorResponse,
        rulesResponse,
      ] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/health"),
        fetch("http://127.0.0.1:8000/api/collector/status"),
        fetch("http://127.0.0.1:8000/api/rules/"),
      ]);

      setBackendHealthy(healthResponse.ok);

      if (collectorResponse.ok) {
        const collectorData =
          await collectorResponse.json();

        setCollectorRunning(
          Boolean(collectorData.running)
        );
      } else {
        setCollectorRunning(false);
      }

      if (!rulesResponse.ok) {
        throw new Error(
          "Failed to load detection rules"
        );
      }

      const rulesData =
        await rulesResponse.json();

      setRules(
        Array.isArray(rulesData)
          ? rulesData
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load settings:",
        err
      );

      setBackendHealthy(false);
      setError(
        "Unable to load NetMonitor settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const toggleRule = async (
    ruleId: number
  ) => {
    try {
      setUpdatingRule(ruleId);
      setError("");
      setMessage("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/rules/${ruleId}/toggle`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update detection rule"
        );
      }

      await loadSettings();

      setMessage(
        "Detection rule updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to toggle detection rule:",
        err
      );

      setError(
        "Unable to update detection rule."
      );
    } finally {
      setUpdatingRule(null);
    }
  };

  const startCollector = async () => {
    try {
      setCollectorAction("start");
      setError("");
      setMessage("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/collector/start",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to start collector"
        );
      }

      const result =
        await response.json();

      setMessage(
        result.message ||
          "Network collector started."
      );

      await loadSettings();
    } catch (err) {
      console.error(
        "Failed to start collector:",
        err
      );

      setError(
        "Unable to start network collector."
      );
    } finally {
      setCollectorAction(null);
    }
  };

  const stopCollector = async () => {
    try {
      setCollectorAction("stop");
      setError("");
      setMessage("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/collector/stop",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to stop collector"
        );
      }

      const result =
        await response.json();

      setMessage(
        result.message ||
          "Network collector stop requested."
      );

      // The collector exits its current sniff cycle before
      // setting the running flag to false, so poll briefly.
      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      await loadSettings();
    } catch (err) {
      console.error(
        "Failed to stop collector:",
        err
      );

      setError(
        "Unable to stop network collector."
      );
    } finally {
      setCollectorAction(null);
    }
  };

  const enabledRules = rules.filter(
    (rule) => rule.enabled
  ).length;

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Settings
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            NetMonitor system status and security configuration
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm text-white transition"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ================================================== */}
      {/* Messages */}
      {/* ================================================== */}

      {message && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-xl p-4 text-sm text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* System Status */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatusCard
          title="Backend API"
          value={
            loading
              ? "—"
              : backendHealthy
                ? "HEALTHY"
                : "OFFLINE"
          }
          subtitle="FastAPI service"
          icon={Server}
          positive={backendHealthy === true}
          danger={backendHealthy === false}
        />

        <StatusCard
          title="Network Collector"
          value={
            loading
              ? "—"
              : collectorRunning
                ? "RUNNING"
                : "STOPPED"
          }
          subtitle="Packet monitoring service"
          icon={Activity}
          positive={collectorRunning === true}
          danger={collectorRunning === false}
        />

        <StatusCard
          title="Detection Engine"
          value={
            loading
              ? "—"
              : `${enabledRules}/${rules.length}`
          }
          subtitle="Detection rules enabled"
          icon={ShieldCheck}
          positive
        />

        <StatusCard
          title="Database"
          value={
            loading
              ? "—"
              : backendHealthy
                ? "CONNECTED"
                : "UNAVAILABLE"
          }
          subtitle="SQLite / SQLAlchemy"
          icon={Database}
          positive={backendHealthy === true}
          danger={backendHealthy === false}
        />

      </div>

      {/* ================================================== */}
      {/* Monitoring Configuration */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <div className="flex items-center gap-3">

            <div className="p-2 rounded-lg bg-blue-500/10">

              <Network
                size={18}
                className="text-blue-400"
              />

            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Monitoring Configuration
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Current authorized monitoring configuration
              </p>

            </div>

          </div>

        </div>

        <div className="p-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <ConfigItem
              label="Monitored Network"
              value="192.168.1.0/24"
            />

            <ConfigItem
              label="Discovery Engine"
              value="Nmap"
            />

            <ConfigItem
              label="Packet Collector"
              value="Scapy"
            />

            <ConfigItem
              label="Backend"
              value="FastAPI"
            />

          </div>

        </div>

      </div>

      {/* ================================================== */}
      {/* Collector Control */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            Network Collector
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Control the network packet collection service
          </p>

        </div>

        <div className="p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="p-2 rounded-lg bg-slate-950">

                <Wifi
                  size={19}
                  className={
                    collectorRunning
                      ? "text-emerald-400"
                      : "text-slate-500"
                  }
                />

              </div>

              <div>

                <p className="text-sm font-medium text-white">
                  Packet Monitoring
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {collectorRunning
                    ? "The network collector is currently running."
                    : "The network collector is currently stopped."}
                </p>

              </div>

            </div>

            {!collectorRunning && (
              <button
                onClick={startCollector}
                disabled={collectorAction !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm text-white transition"
              >
                <Activity
                  size={16}
                  className={
                    collectorAction === "start"
                      ? "animate-spin"
                      : ""
                  }
                />

                {collectorAction === "start"
                  ? "Starting..."
                  : "Start Collector"}
              </button>
            )}

            {collectorRunning && (
              <button
                onClick={stopCollector}
                disabled={collectorAction !== null}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm text-white transition"
              >
                <Activity
                  size={16}
                  className={
                    collectorAction === "stop"
                      ? "animate-spin"
                      : ""
                  }
                />

                {collectorAction === "stop"
                  ? "Stopping..."
                  : "Stop Collector"}
              </button>
            )}

          </div>

        </div>

      </div>

      {/* ================================================== */}
      {/* Detection Rules */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            Detection Rules
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Enable or disable NetMonitor threat detection rules
          </p>

        </div>

        {loading ? (

          <div className="p-6 text-sm text-slate-500">
            Loading detection rules...
          </div>

        ) : rules.length === 0 ? (

          <div className="p-6 text-sm text-slate-500">
            No detection rules available.
          </div>

        ) : (

          <div className="divide-y divide-slate-800">

            {rules.map((rule) => (

              <div
                key={rule.id}
                className="p-5 hover:bg-slate-950/40 transition"
              >

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-sm font-semibold text-white">
                        {rule.rule_name}
                      </h3>

                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded border ${
                          rule.severity === "HIGH"
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : rule.severity === "MEDIUM"
                              ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                              : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                        }`}
                      >
                        {rule.severity}
                      </span>

                    </div>

                    <p className="text-xs text-slate-500 mt-2 max-w-3xl">
                      {rule.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-5 mt-3 text-[11px]">

                      <span className="text-slate-600">
                        Threshold{" "}
                        <span className="text-slate-300">
                          {rule.threshold}
                        </span>
                      </span>

                      <span className="text-slate-600">
                        Window{" "}
                        <span className="text-slate-300">
                          {rule.window_seconds}s
                        </span>
                      </span>

                      <span className="text-slate-600">
                        Risk{" "}
                        <span className="text-slate-300">
                          {rule.risk_score}/100
                        </span>
                      </span>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      toggleRule(rule.id)
                    }
                    disabled={
                      updatingRule === rule.id
                    }
                    className="shrink-0 disabled:opacity-40"
                    title={
                      rule.enabled
                        ? "Disable rule"
                        : "Enable rule"
                    }
                  >

                    {rule.enabled ? (

                      <ToggleRight
                        size={32}
                        className="text-emerald-400"
                      />

                    ) : (

                      <ToggleLeft
                        size={32}
                        className="text-slate-600"
                      />

                    )}

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* ================================================== */}
      {/* System Information */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">

          <h2 className="text-lg font-semibold text-white">
            System Information
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            NetMonitor platform configuration
          </p>

        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

          <ConfigItem
            label="Platform"
            value="NetMonitor"
          />

          <ConfigItem
            label="Version"
            value="1.0.0"
          />

          <ConfigItem
            label="Frontend"
            value="React + TypeScript"
          />

          <ConfigItem
            label="Database"
            value="SQLite"
          />

        </div>

      </div>

    </div>
  );
}

/* ========================================================= */
/* Status Card */
/* ========================================================= */

function StatusCard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive = false,
  danger = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Server;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-slate-400">
          {title}
        </p>

        <Icon
          size={19}
          className={
            danger
              ? "text-red-400"
              : positive
                ? "text-emerald-400"
                : "text-blue-400"
          }
        />

      </div>

      <p
        className={`text-xl font-bold mt-4 ${
          danger
            ? "text-red-400"
            : positive
              ? "text-emerald-400"
              : "text-white"
        }`}
      >
        {value}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {subtitle}
      </p>

    </div>
  );
}

/* ========================================================= */
/* Config Item */
/* ========================================================= */

function ConfigItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-950 rounded-lg p-4">

      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="text-sm text-white mt-2">
        {value}
      </p>

    </div>
  );
}