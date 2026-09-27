import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ShieldAlert,
  Search,
  XCircle,
  Network,
  Activity,
  ShieldCheck,
} from "lucide-react";

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

interface CorrelationData {
  source_ip: string;
  alert_count: number;
  correlated_risk: number;
  severity: string;
  alert_types: string[];
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  // Investigation state
  const [selectedAlertId, setSelectedAlertId] =
    useState<number | null>(null);

  const [investigationEvents, setInvestigationEvents] =
    useState<NetworkEvent[]>([]);

  const [correlation, setCorrelation] =
    useState<CorrelationData | null>(null);

  const [investigationLoading, setInvestigationLoading] =
    useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/alerts/"
      );

      if (!response.ok) {
        throw new Error("Failed to load alerts");
      }

      const data = await response.json();

      setAlerts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load alerts:",
        err
      );

      setError(
        "Unable to load security alerts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const updateAlertStatus = async (
    alertId: number,
    status: string
  ) => {
    try {
      setUpdatingId(alertId);
      setError("");

      const response = await fetch(
        `http://127.0.0.1:8000/api/alerts/${alertId}/status?status=${status}`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          data?.detail ||
            "Failed to update alert status"
        );
      }

      await loadAlerts();
    } catch (err) {
      console.error(
        "Failed to update alert:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update alert status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openInvestigation = async (
    alert: Alert
  ) => {
    try {
      setSelectedAlertId(alert.id);
      setInvestigationLoading(true);
      setError("");

      // A NEW alert moves into investigation
      // when the analyst opens it.
      if (
        alert.status.toUpperCase() === "NEW"
      ) {
        await updateAlertStatus(
          alert.id,
          "INVESTIGATING"
        );
      }

      const eventsResponse = await fetch(
        "http://127.0.0.1:8000/api/events/"
      );

      if (!eventsResponse.ok) {
        throw new Error(
          "Failed to load related events"
        );
      }

      const eventsData =
        await eventsResponse.json();

      const allEvents: NetworkEvent[] =
        Array.isArray(eventsData)
          ? eventsData
          : [];

      const relatedEvents = allEvents
        .filter(
          (event) =>
            alert.source_ip &&
            event.source_ip ===
              alert.source_ip
        )
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
        .slice(0, 10);

      setInvestigationEvents(
        relatedEvents
      );

      // Load correlated alerts
      if (alert.source_ip) {
        const correlationResponse =
          await fetch(
            `http://127.0.0.1:8000/api/alerts/correlation/${encodeURIComponent(
              alert.source_ip
            )}`
          );

        if (correlationResponse.ok) {
          const correlationData =
            await correlationResponse.json();

          setCorrelation(
            correlationData
          );
        } else {
          setCorrelation(null);
        }
      } else {
        setCorrelation(null);
      }
    } catch (err) {
      console.error(
        "Failed to load investigation data:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load investigation data."
      );
    } finally {
      setInvestigationLoading(false);
    }
  };

  const closeInvestigation = () => {
    setSelectedAlertId(null);
    setInvestigationEvents([]);
    setCorrelation(null);
  };

  const highAlerts = alerts.filter(
    (alert) =>
      alert.severity.toUpperCase() ===
        "HIGH" ||
      alert.severity.toUpperCase() ===
        "CRITICAL"
  );

  const newAlerts = alerts.filter(
    (alert) =>
      alert.status === "NEW"
  );

  const investigatingAlerts =
    alerts.filter(
      (alert) =>
        alert.status ===
        "INVESTIGATING"
    );

  const resolvedAlerts = alerts.filter(
    (alert) =>
      alert.status ===
        "RESOLVED" ||
      alert.status ===
        "FALSE_POSITIVE"
  );

  return (
    <div className="space-y-6">
      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Security Alerts
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Detected security events requiring investigation
          </p>
        </div>

        <button
          onClick={loadAlerts}
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
      {/* Statistics */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <AlertStat
          title="Total Alerts"
          value={
            loading
              ? "—"
              : String(alerts.length)
          }
          icon={ShieldAlert}
        />

        <AlertStat
          title="High Severity"
          value={
            loading
              ? "—"
              : String(
                  highAlerts.length
                )
          }
          icon={AlertTriangle}
        />

        <AlertStat
          title="New Alerts"
          value={
            loading
              ? "—"
              : String(
                  newAlerts.length
                )
          }
          icon={Clock}
        />

        <AlertStat
          title="Investigating"
          value={
            loading
              ? "—"
              : String(
                  investigatingAlerts.length
                )
          }
          icon={Search}
        />
      </div>

      {/* ================================================== */}
      {/* Error */}
      {/* ================================================== */}

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* Investigation Panel */}
      {/* ================================================== */}

      {selectedAlertId !== null && (
        <InvestigationPanel
          alert={
            alerts.find(
              (item) =>
                item.id ===
                selectedAlertId
            ) || null
          }
          events={
            investigationEvents
          }
          correlation={
            correlation
          }
          loading={
            investigationLoading
          }
          onClose={
            closeInvestigation
          }
        />
      )}

      {/* ================================================== */}
      {/* Alert Table */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Detected Alerts
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {resolvedAlerts.length} resolved or dismissed alert
              {resolvedAlerts.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading security alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle
              size={32}
              className="mx-auto text-emerald-400 mb-3"
            />

            <p className="text-white font-medium">
              No security alerts
            </p>

            <p className="text-sm text-slate-500 mt-1">
              No suspicious activity has been detected.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {alerts.map(
              (alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  updating={
                    updatingId ===
                    alert.id
                  }
                  investigating={
                    selectedAlertId ===
                    alert.id
                  }
                  onInvestigate={
                    openInvestigation
                  }
                  onUpdateStatus={
                    updateAlertStatus
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* ========================================================= */
/* Alert Statistics Card */
/* ========================================================= */

function AlertStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof ShieldAlert;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <Icon
        size={22}
        className="text-blue-400 mb-4"
      />

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="text-2xl font-bold text-white mt-1">
        {value}
      </p>
    </div>
  );
}


/* ========================================================= */
/* Alert Row */
/* ========================================================= */

function AlertRow({
  alert,
  updating,
  investigating,
  onInvestigate,
  onUpdateStatus,
}: {
  alert: Alert;
  updating: boolean;
  investigating: boolean;
  onInvestigate: (
    alert: Alert
  ) => void;
  onUpdateStatus: (
    alertId: number,
    status: string
  ) => void;
}) {
  const severity =
    alert.severity.toUpperCase();

  const status =
    alert.status.toUpperCase();

  const severityClass =
    severity === "CRITICAL" ||
    severity === "HIGH"
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : severity === "MEDIUM"
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        : "text-blue-400 bg-blue-500/10 border-blue-500/20";

  const statusClass =
    status === "NEW"
      ? "text-blue-400"
      : status === "INVESTIGATING"
        ? "text-yellow-400"
        : status === "RESOLVED"
          ? "text-emerald-400"
          : status ===
              "FALSE_POSITIVE"
            ? "text-slate-400"
            : "text-slate-400";

  const riskScore =
    Number(alert.risk_score ?? 0);

  const riskInfo =
    riskScore >= 80
      ? {
          label: "Critical Risk",
          className:
            "text-red-400 bg-red-500/10 border-red-500/20",
        }
      : riskScore >= 60
        ? {
            label: "High Risk",
            className:
              "text-orange-400 bg-orange-500/10 border-orange-500/20",
          }
        : riskScore >= 40
          ? {
              label: "Medium Risk",
              className:
                "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
            }
          : {
              label: "Low Risk",
              className:
                "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            };

  return (
    <div className="px-5 py-5 hover:bg-slate-800/30 transition">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">

        {/* ================================================== */}
        {/* Alert Identity */}
        {/* ================================================== */}

        <div className="flex items-start gap-4 min-w-0">
          <div className="mt-1">
            <AlertTriangle
              size={20}
              className={
                severity === "HIGH" ||
                severity === "CRITICAL"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-sm font-semibold text-white">
                {formatAlertType(
                  alert.alert_type
                )}
              </h3>

              <span
                className={`text-[10px] font-bold px-2 py-1 rounded border ${severityClass}`}
              >
                {severity}
              </span>

              <span
                className={`text-[10px] font-bold px-2 py-1 rounded border ${riskInfo.className}`}
              >
                Risk {riskScore}
              </span>
            </div>

            <p className="text-sm text-slate-400 mt-2">
              {alert.description}
            </p>
          </div>
        </div>

        {/* ================================================== */}
        {/* Metadata */}
        {/* ================================================== */}

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 text-xs min-w-[620px]">

          <div>
            <p className="text-slate-600">
              Risk Score
            </p>

            <p className="text-white mt-1 font-semibold">
              {riskScore}/100
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Source
            </p>

            <p className="text-slate-300 mt-1">
              {alert.source_ip ||
                "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Destination
            </p>

            <p className="text-slate-300 mt-1">
              {alert.destination_ip ||
                "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Protocol
            </p>

            <p className="text-slate-300 mt-1">
              {alert.protocol ||
                "Unknown"}
            </p>
          </div>

          <div>
            <p className="text-slate-600">
              Status
            </p>

            <p
              className={`mt-1 font-medium ${statusClass}`}
            >
              {status.replace(
                "_",
                " "
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* Timestamp */}
      {/* ================================================== */}

      <div className="flex items-center gap-2 mt-4 ml-9 text-xs text-slate-600">
        <Clock size={13} />

        Detected{" "}
        {new Date(
          alert.detected_at
        ).toLocaleString()}
      </div>

      {/* ================================================== */}
      {/* Actions */}
      {/* ================================================== */}

      <div className="flex flex-wrap items-center gap-2 mt-4 ml-9">

        {/* Investigation */}

        <button
          onClick={() =>
            onInvestigate(alert)
          }
          disabled={updating}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition disabled:opacity-50 ${
            investigating
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Search size={14} />

          {investigating
            ? "Investigation Open"
            : "Investigate"}
        </button>

        {/* Resolve */}

        {(status === "NEW" ||
          status ===
            "INVESTIGATING") && (
          <button
            onClick={() =>
              onUpdateStatus(
                alert.id,
                "RESOLVED"
              )
            }
            disabled={updating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 text-xs font-medium transition"
          >
            <CheckCircle size={14} />
            Resolve
          </button>
        )}

        {/* False Positive */}

        {(status === "NEW" ||
          status ===
            "INVESTIGATING") && (
          <button
            onClick={() =>
              onUpdateStatus(
                alert.id,
                "FALSE_POSITIVE"
              )
            }
            disabled={updating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium transition"
          >
            <XCircle size={14} />
            False Positive
          </button>
        )}

        {updating && (
          <span className="text-xs text-slate-500 ml-2">
            Updating...
          </span>
        )}
      </div>

      {investigating && (
        <div className="mt-5 ml-9 h-px bg-slate-800" />
      )}
    </div>
  );
}


/* ========================================================= */
/* Investigation Panel */
/* ========================================================= */

function InvestigationPanel({
  alert,
  events,
  correlation,
  loading,
  onClose,
}: {
  alert: Alert | null;
  events: NetworkEvent[];
  correlation: CorrelationData | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!alert) {
    return null;
  }

  const riskScore =
    Number(alert.risk_score ?? 0);

  const severity =
    alert.severity.toUpperCase();

  const riskBarWidth = Math.min(
    riskScore,
    100
  );

  return (
    <div className="bg-slate-900 border border-blue-500/20 rounded-xl overflow-hidden">

      {/* ================================================== */}
      {/* Investigation Header */}
      {/* ================================================== */}

      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ShieldCheck
              size={20}
              className="text-blue-400"
            />

            <h2 className="text-lg font-semibold text-white">
              Alert Investigation
            </h2>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Investigating{" "}
            {formatAlertType(
              alert.alert_type
            )}{" "}
            from{" "}
            {alert.source_ip ||
              "unknown source"}
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <RefreshCw
            size={22}
            className="mx-auto text-blue-400 animate-spin"
          />

          <p className="text-sm text-slate-500 mt-3">
            Loading investigation data...
          </p>
        </div>
      ) : (
        <div className="p-5 space-y-5">

          {/* ================================================== */}
          {/* Alert Overview */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            <InvestigationCard
              title="Risk Score"
              value={`${riskScore}/100`}
              subtitle="Alert risk assessment"
              icon={ShieldAlert}
              valueClass={
                riskScore >= 80
                  ? "text-red-400"
                  : riskScore >= 60
                    ? "text-orange-400"
                    : "text-yellow-400"
              }
            />

            <InvestigationCard
              title="Severity"
              value={severity}
              subtitle="Detection severity"
              icon={AlertTriangle}
              valueClass={
                severity === "HIGH" ||
                severity === "CRITICAL"
                  ? "text-red-400"
                  : "text-yellow-400"
              }
            />

            <InvestigationCard
              title="Related Events"
              value={String(
                events.length
              )}
              subtitle="Recent events from source"
              icon={Activity}
            />

            <InvestigationCard
              title="Correlated Alerts"
              value={String(
                correlation?.alert_count ??
                  0
              )}
              subtitle="Unresolved alerts from source"
              icon={Network}
            />
          </div>

          {/* ================================================== */}
          {/* Risk Bar */}
          {/* ================================================== */}

          <div className="bg-slate-950 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Risk Level
              </span>

              <span className="text-xs text-white font-medium">
                {riskScore}/100
              </span>
            </div>

            <div className="h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  riskScore >= 80
                    ? "bg-red-500"
                    : riskScore >= 60
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                }`}
                style={{
                  width: `${riskBarWidth}%`,
                }}
              />
            </div>
          </div>

          {/* ================================================== */}
          {/* Alert Details */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            <div className="bg-slate-950 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white">
                Detection Details
              </h3>

              <div className="mt-4 space-y-3">

                <DetailRow
                  label="Alert Type"
                  value={formatAlertType(
                    alert.alert_type
                  )}
                />

                <DetailRow
                  label="Source IP"
                  value={
                    alert.source_ip ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Destination IP"
                  value={
                    alert.destination_ip ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Protocol"
                  value={
                    alert.protocol ||
                    "Unknown"
                  }
                />

                <DetailRow
                  label="Status"
                  value={formatAlertType(
                    alert.status
                  )}
                />

                <DetailRow
                  label="Detected At"
                  value={new Date(
                    alert.detected_at
                  ).toLocaleString()}
                />
              </div>
            </div>

            <div className="bg-slate-950 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-white">
                Detection Reason
              </h3>

              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-300 leading-6">
                  {alert.description}
                </p>
              </div>

              {correlation && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Correlated Risk
                    </span>

                    <span className="text-sm font-semibold text-white">
                      {
                        correlation.correlated_risk
                      }
                      /100
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">
                    {correlation.alert_count} unresolved related alert
                    {correlation.alert_count ===
                    1
                      ? ""
                      : "s"}{" "}
                    detected from this source.
                  </p>

                  {correlation.alert_types.length >
                    0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {correlation.alert_types.map(
                        (type) => (
                          <span
                            key={type}
                            className="text-[10px] px-2 py-1 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400"
                          >
                            {formatAlertType(
                              type
                            )}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================================================== */}
          {/* Related Events */}
          {/* ================================================== */}

          <div className="bg-slate-950 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity
                  size={17}
                  className="text-blue-400"
                />

                <h3 className="text-sm font-semibold text-white">
                  Related Network Events
                </h3>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Latest events observed from the alert source
              </p>
            </div>

            {events.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No related network events found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                        Time
                      </th>

                      <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                        Event
                      </th>

                      <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                        Destination
                      </th>

                      <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                        Port
                      </th>

                      <th className="px-5 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                        Protocol
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {events.map(
                      (event) => (
                        <tr
                          key={event.id}
                          className="border-b border-slate-900 hover:bg-slate-900 transition"
                        >
                          <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(
                              event.timestamp
                            ).toLocaleString()}
                          </td>

                          <td className="px-5 py-3">
                            <p className="text-xs text-white">
                              {formatAlertType(
                                event.event_type
                              )}
                            </p>

                            {event.description && (
                              <p className="text-[10px] text-slate-600 mt-1">
                                {
                                  event.description
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-3 text-xs text-slate-400">
                            {event.destination_ip ||
                              "Unknown"}
                          </td>

                          <td className="px-5 py-3 text-xs text-slate-400">
                            {event.destination_port ??
                              "—"}
                          </td>

                          <td className="px-5 py-3 text-xs text-slate-400">
                            {event.protocol ||
                              "Unknown"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* ========================================================= */
/* Investigation Card */
/* ========================================================= */

function InvestigationCard({
  title,
  value,
  subtitle,
  icon: Icon,
  valueClass = "text-white",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof ShieldAlert;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-950 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {title}
        </span>

        <Icon
          size={17}
          className="text-blue-400"
        />
      </div>

      <p
        className={`text-xl font-bold mt-3 ${valueClass}`}
      >
        {value}
      </p>

      <p className="text-[11px] text-slate-600 mt-1">
        {subtitle}
      </p>
    </div>
  );
}


/* ========================================================= */
/* Detail Row */
/* ========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span className="text-xs text-slate-300 text-right">
        {value}
      </span>
    </div>
  );
}


/* ========================================================= */
/* Format Alert/Event Type */
/* ========================================================= */

function formatAlertType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}