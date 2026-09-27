import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
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
  created_at: string;
  updated_at: string;
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

export default function ThreatDetection() {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [loading, setLoading] = useState(true);
  const [updatingRule, setUpdatingRule] =
    useState<number | null>(null);
  const [error, setError] = useState("");

  const loadThreatData = async () => {
    try {
      setLoading(true);
      setError("");

      const [rulesResponse, statisticsResponse] =
        await Promise.all([
          fetch("http://127.0.0.1:8000/api/rules/"),
          fetch("http://127.0.0.1:8000/api/statistics/"),
        ]);

      if (
        !rulesResponse.ok ||
        !statisticsResponse.ok
      ) {
        throw new Error(
          "Failed to load threat detection data"
        );
      }

      const rulesData =
        await rulesResponse.json();

      const statisticsData =
        await statisticsResponse.json();

      setRules(
        Array.isArray(rulesData)
          ? rulesData
          : []
      );

      setStatistics(statisticsData);
    } catch (err) {
      console.error(
        "Failed to load threat data:",
        err
      );

      setError(
        "Unable to load threat detection data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreatData();
  }, []);

  const toggleRule = async (ruleId: number) => {
    try {
      setUpdatingRule(ruleId);
      setError("");

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

      await loadThreatData();
    } catch (err) {
      console.error(
        "Failed to toggle rule:",
        err
      );

      setError(
        "Unable to update detection rule."
      );
    } finally {
      setUpdatingRule(null);
    }
  };

  const enabledRules = rules.filter(
    (rule) => rule.enabled
  ).length;

  const highAlerts =
    statistics?.severity.high ?? 0;

  const mediumAlerts =
    statistics?.severity.medium ?? 0;

  const lowAlerts =
    statistics?.severity.low ?? 0;

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Threat Detection
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Detection engine status, security rules,
            and threat statistics
          </p>
        </div>

        <button
          onClick={loadThreatData}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* ================================================== */}
      {/* Error */}
      {/* ================================================== */}

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* Engine Overview */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <OverviewCard
          title="Detection Engine"
          value={loading ? "—" : "ACTIVE"}
          subtitle="Monitoring enabled"
          icon={ShieldCheck}
          positive
        />

        <OverviewCard
          title="Active Rules"
          value={
            loading
              ? "—"
              : `${enabledRules}/${rules.length}`
          }
          subtitle="Detection rules enabled"
          icon={Activity}
        />

        <OverviewCard
          title="High Severity"
          value={
            loading
              ? "—"
              : String(highAlerts)
          }
          subtitle="Generated alerts"
          icon={ShieldAlert}
          danger={highAlerts > 0}
        />

        <OverviewCard
          title="Average Risk"
          value={
            loading
              ? "—"
              : `${statistics?.average_risk_score ?? 0}/100`
          }
          subtitle="Across all alerts"
          icon={Activity}
        />
      </div>

      {/* ================================================== */}
      {/* Severity Overview */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">
            Severity Overview
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Current distribution of generated security alerts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SeverityBox
            label="High"
            value={highAlerts}
            description="High-risk detections"
            className="text-red-400"
            barClass="bg-red-500"
          />

          <SeverityBox
            label="Medium"
            value={mediumAlerts}
            description="Moderate-risk detections"
            className="text-yellow-400"
            barClass="bg-yellow-500"
          />

          <SeverityBox
            label="Low"
            value={lowAlerts}
            description="Low-risk detections"
            className="text-blue-400"
            barClass="bg-blue-500"
          />
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
            Configure and control network threat detection rules
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
              <RuleRow
                key={rule.id}
                rule={rule}
                updating={updatingRule === rule.id}
                onToggle={() =>
                  toggleRule(rule.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* ========================================================= */
/* Overview Card */
/* ========================================================= */

function OverviewCard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive,
  danger,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof ShieldCheck;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <div
          className={`p-2 rounded-lg ${
            danger
              ? "bg-red-950/50"
              : positive
                ? "bg-emerald-950/50"
                : "bg-slate-800"
          }`}
        >
          <Icon
            size={18}
            className={
              danger
                ? "text-red-400"
                : positive
                  ? "text-emerald-400"
                  : "text-blue-400"
            }
          />
        </div>
      </div>

      <p
        className={`text-2xl font-bold mt-4 ${
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
/* Severity Box */
/* ========================================================= */

function SeverityBox({
  label,
  value,
  description,
  className,
  barClass,
}: {
  label: string;
  value: number;
  description: string;
  className: string;
  barClass: string;
}) {
  return (
    <div className="bg-slate-950 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${className}`}>
          {label}
        </span>

        <span className="text-xl font-bold text-white">
          {value}
        </span>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        {description}
      </p>

      <div className="h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
        <div
          className={`h-full ${barClass}`}
          style={{
            width: `${Math.min(value * 10, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}


/* ========================================================= */
/* Detection Rule Row */
/* ========================================================= */

function RuleRow({
  rule,
  updating,
  onToggle,
}: {
  rule: DetectionRule;
  updating: boolean;
  onToggle: () => void;
}) {
  const severityClass =
    rule.severity === "HIGH"
      ? "text-red-400 bg-red-950/40 border-red-900/50"
      : rule.severity === "MEDIUM"
        ? "text-yellow-400 bg-yellow-950/40 border-yellow-900/50"
        : "text-blue-400 bg-blue-950/40 border-blue-900/50";

  return (
    <div className="p-5 hover:bg-slate-950/50 transition">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        {/* Rule Information */}

        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-white">
              {rule.rule_name}
            </h3>

            <span
              className={`text-[10px] font-bold px-2 py-1 rounded border ${severityClass}`}
            >
              {rule.severity}
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-1 rounded border ${
                rule.enabled
                  ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/50"
                  : "text-slate-500 bg-slate-900 border-slate-700"
              }`}
            >
              {rule.enabled
                ? "ENABLED"
                : "DISABLED"}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2 max-w-3xl">
            {rule.description}
          </p>
        </div>

        {/* Rule Details */}

        <div className="flex items-center gap-6 text-xs shrink-0">
          <div>
            <p className="text-slate-600">
              Threshold
            </p>

            <p className="text-slate-300 mt-1">
              {rule.threshold}
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Window
            </p>

            <p className="text-slate-300 mt-1">
              {rule.window_seconds}s
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Risk
            </p>

            <p className="text-slate-300 mt-1">
              {rule.risk_score}/100
            </p>
          </div>

          {/* Toggle */}

          <button
            onClick={onToggle}
            disabled={updating}
            className="text-slate-400 hover:text-white transition disabled:opacity-40"
            title={
              rule.enabled
                ? "Disable rule"
                : "Enable rule"
            }
          >
            {rule.enabled ? (
              <ToggleRight
                size={28}
                className="text-emerald-400"
              />
            ) : (
              <ToggleLeft size={28} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}