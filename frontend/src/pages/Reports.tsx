import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  ShieldCheck,
  Server,
  Activity,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface Asset {
  id: number;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  status: string;
  first_seen: string;
  last_seen: string;
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

export default function Reports() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        assetsResponse,
        alertsResponse,
        statisticsResponse,
      ] = await Promise.all([
        fetch(
          "http://127.0.0.1:8000/api/assets/"
        ),
        fetch(
          "http://127.0.0.1:8000/api/alerts/"
        ),
        fetch(
          "http://127.0.0.1:8000/api/statistics/"
        ),
      ]);

      if (
        !assetsResponse.ok ||
        !alertsResponse.ok ||
        !statisticsResponse.ok
      ) {
        throw new Error(
          "Failed to load report data"
        );
      }

      const assetsData =
        await assetsResponse.json();

      const alertsData =
        await alertsResponse.json();

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
    } catch (err) {
      console.error(
        "Failed to load report data:",
        err
      );

      setError(
        "Unable to load security report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const onlineAssets =
    assets.filter(
      (asset) =>
        asset.status === "online"
    ).length;

  const generatedDate =
    new Date().toLocaleString();

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Print only the report itself — hide the app shell. */
          body * {
            visibility: hidden !important;
          }

          .report-print-root,
          .report-print-root * {
            visibility: visible !important;
          }

          .report-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .report-document {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            border: 0 !important;
            border-radius: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
          }

          .report-document > div {
            border-color: #d1d5db !important;
          }

          .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-table-section {
            break-inside: auto;
            page-break-inside: auto;
          }

          .report-document table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .report-document thead {
            display: table-header-group !important;
          }

          .report-document tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .report-document th,
          .report-document td {
            padding: 6px 7px !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
            vertical-align: top !important;
          }

          .report-metric-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }

          .report-severity-grid,
          .report-status-grid {
            gap: 10px !important;
          }

          .report-metric-card,
          .report-severity-card,
          .report-status-card {
            padding: 10px !important;
          }

          .report-document .bg-slate-900 {
            background: #ffffff !important;
          }

          .report-document .bg-slate-950 {
            background: #f8fafc !important;
          }

          .report-document .border-slate-800,
          .report-document .border-slate-900 {
            border-color: #d1d5db !important;
          }

          .report-document .text-white {
            color: #111827 !important;
          }

          .report-document .text-slate-300 {
            color: #374151 !important;
          }

          .report-document .text-slate-400 {
            color: #4b5563 !important;
          }

          .report-document .text-slate-500,
          .report-document .text-slate-600 {
            color: #6b7280 !important;
          }

          .report-document h2,
          .report-document h3,
          .report-document p,
          .report-document td,
          .report-document th {
            break-inside: avoid;
          }

          .report-document svg {
            color: #2563eb !important;
          }
        }
      `}</style>

      <div className="space-y-6 report-print-root">

      {/* ================================================== */}
      {/* Page Header */}
      {/* ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">

        <div>
          <h1 className="text-2xl font-bold text-white">
            Security Reports
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Generate and review NetMonitor security assessments
          </p>
        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={
              loadReportData
            }
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

          <button
            onClick={() =>
              window.print()
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white transition"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>

        </div>
      </div>

      {/* ================================================== */}
      {/* Error */}
      {/* ================================================== */}

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 text-sm text-red-400 print:hidden">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* Report Document */}
      {/* ================================================== */}

      <div className="report-document bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {/* Report Header */}

        <div className="report-section px-6 py-7 border-b border-slate-800">

          <div className="flex items-start justify-between gap-6">

            <div className="flex items-start gap-4">

              <div className="p-3 rounded-xl bg-blue-500/10 print:bg-slate-100">
                <ShieldCheck
                  size={28}
                  className="text-blue-400 print:text-slate-900"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white print:text-black">
                  NetMonitor Security Assessment Report
                </h2>

                <p className="text-sm text-slate-500 mt-1 print:text-slate-600">
                  Network Security Monitoring & Threat Detection Platform
                </p>
              </div>

            </div>

            <div className="text-right shrink-0">
              <p className="text-xs text-slate-600">
                Generated
              </p>

              <p className="text-sm text-slate-300 mt-1 print:text-black">
                {generatedDate}
              </p>
            </div>

          </div>

        </div>

        {/* ================================================== */}
        {/* Executive Summary */}
        {/* ================================================== */}

        <div className="report-section p-6 border-b border-slate-800">

          <div className="flex items-center gap-2 mb-4">

            <FileText
              size={18}
              className="text-blue-400"
            />

            <h3 className="text-lg font-semibold text-white print:text-black">
              Executive Summary
            </h3>

          </div>

          <p className="text-sm text-slate-400 leading-6 print:text-slate-700">
            This report summarizes network activity, discovered
            assets, generated security alerts, detection severity,
            and risk observations recorded by NetMonitor.
          </p>

        </div>

        {/* ================================================== */}
        {/* Network Overview */}
        {/* ================================================== */}

        <div className="report-section p-6 border-b border-slate-800">

          <h3 className="text-lg font-semibold text-white print:text-black">
            Network Overview
          </h3>

          <div className="report-metric-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">

            <ReportMetric
              title="Monitored Network"
              value="192.168.1.0/24"
              icon={Server}
            />

            <ReportMetric
              title="Total Assets"
              value={
                loading
                  ? "—"
                  : String(
                      assets.length
                    )
              }
              icon={Server}
            />

            <ReportMetric
              title="Online Assets"
              value={
                loading
                  ? "—"
                  : String(
                      onlineAssets
                    )
              }
              icon={ShieldCheck}
            />

            <ReportMetric
              title="Network Events"
              value={
                loading
                  ? "—"
                  : (
                      statistics?.total_events ??
                      0
                    ).toLocaleString()
              }
              icon={Activity}
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* Security Overview */}
        {/* ================================================== */}

        <div className="report-section p-6 border-b border-slate-800">

          <h3 className="text-lg font-semibold text-white print:text-black">
            Security Overview
          </h3>

          <div className="report-metric-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">

            <ReportMetric
              title="Total Alerts"
              value={
                loading
                  ? "—"
                  : String(
                      statistics?.total_alerts ??
                      0
                    )
              }
              icon={ShieldAlert}
            />

            <ReportMetric
              title="High Severity"
              value={
                loading
                  ? "—"
                  : String(
                      statistics?.severity.high ??
                      0
                    )
              }
              icon={AlertTriangle}
              danger
            />

            <ReportMetric
              title="New Alerts"
              value={
                loading
                  ? "—"
                  : String(
                      statistics?.alerts.new ??
                      0
                    )
              }
              icon={ShieldAlert}
            />

            <ReportMetric
              title="Average Risk"
              value={
                loading
                  ? "—"
                  : `${statistics?.average_risk_score ?? 0}/100`
              }
              icon={Activity}
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* Severity Breakdown */}
        {/* ================================================== */}

        <div className="report-section p-6 border-b border-slate-800">

          <h3 className="text-lg font-semibold text-white print:text-black">
            Severity Breakdown
          </h3>

          <div className="report-severity-grid grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

            <SeverityMetric
              label="High"
              value={
                statistics?.severity.high ??
                0
              }
              className="text-red-400"
            />

            <SeverityMetric
              label="Medium"
              value={
                statistics?.severity.medium ??
                0
              }
              className="text-yellow-400"
            />

            <SeverityMetric
              label="Low"
              value={
                statistics?.severity.low ??
                0
              }
              className="text-blue-400"
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* Detection Breakdown */}
        {/* ================================================== */}

        <div className="report-table-section p-6 border-b border-slate-800">

          <h3 className="text-lg font-semibold text-white print:text-black">
            Detection Breakdown
          </h3>

          <div className="mt-4 overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-slate-800">

                  <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                    Detection Type
                  </th>

                  <th className="px-4 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                    Alerts
                  </th>

                </tr>

              </thead>

              <tbody>

                {Object.entries(
                  statistics?.alerts_by_type ??
                    {}
                ).map(
                  (
                    [type, count]
                  ) => (
                    <tr
                      key={type}
                      className="border-b border-slate-900"
                    >

                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatType(
                          type
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-white">
                        {count}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================================================== */}
        {/* Alert Status */}
        {/* ================================================== */}

        <div className="p-6 border-b border-slate-800">

          <h3 className="text-lg font-semibold text-white print:text-black">
            Alert Status
          </h3>

          <div className="report-status-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">

            <StatusMetric
              label="New"
              value={
                statistics?.alerts.new ??
                0
              }
            />

            <StatusMetric
              label="Investigating"
              value={
                statistics?.alerts.investigating ??
                0
              }
            />

            <StatusMetric
              label="Resolved"
              value={
                statistics?.alerts.resolved ??
                0
              }
            />

            <StatusMetric
              label="False Positive"
              value={
                statistics?.alerts.false_positive ??
                0
              }
            />

          </div>

        </div>

        {/* ================================================== */}
        {/* Alert Details */}
        {/* ================================================== */}

        <div className="report-table-section p-6">

          <div className="flex items-center gap-2 mb-4">

            <ShieldAlert
              size={18}
              className="text-red-400"
            />

            <h3 className="text-lg font-semibold text-white print:text-black">
              Security Alert Details
            </h3>

          </div>

          {alerts.length ===
          0 ? (
            <div className="bg-slate-950 rounded-lg p-5 text-sm text-slate-500">
              No security alerts have been recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-800">

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Alert
                    </th>

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Severity
                    </th>

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Risk
                    </th>

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Source
                    </th>

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Status
                    </th>

                    <th className="px-3 py-3 text-[10px] uppercase tracking-wide text-slate-600">
                      Detected
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {alerts.map(
                    (alert) => (
                      <tr
                        key={alert.id}
                        className="border-b border-slate-900"
                      >

                        <td className="px-3 py-3 text-sm text-white">
                          {formatType(
                            alert.alert_type
                          )}
                        </td>

                        <td
                          className={`px-3 py-3 text-xs font-bold ${
                            alert.severity.toUpperCase() ===
                              "HIGH" ||
                            alert.severity.toUpperCase() ===
                              "CRITICAL"
                              ? "text-red-400"
                              : alert.severity.toUpperCase() ===
                                  "MEDIUM"
                                ? "text-yellow-400"
                                : "text-blue-400"
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </td>

                        <td className="px-3 py-3 text-sm text-white">
                          {alert.risk_score}/100
                        </td>

                        <td className="px-3 py-3 text-xs text-slate-400">
                          {alert.source_ip ||
                            "Unknown"}
                        </td>

                        <td className="px-3 py-3 text-xs text-slate-400">
                          {formatType(
                            alert.status
                          )}
                        </td>

                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(
                            alert.detected_at
                          ).toLocaleString()}
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
      </div>
    </>
  );
}


/* ========================================================= */
/* Report Metric */
/* ========================================================= */

function ReportMetric({
  title,
  value,
  icon: Icon,
  danger = false,
}: {
  title: string;
  value: string;
  icon: typeof Server;
  danger?: boolean;
}) {
  return (
    <div className="report-metric-card bg-slate-950 rounded-lg p-4">

      <Icon
        size={19}
        className={
          danger
            ? "text-red-400"
            : "text-blue-400"
        }
      />

      <p className="text-xs text-slate-500 mt-3">
        {title}
      </p>

      <p
        className={`text-xl font-bold mt-1 ${
          danger
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


/* ========================================================= */
/* Severity Metric */
/* ========================================================= */

function SeverityMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="report-severity-card bg-slate-950 rounded-lg p-4">

      <div className="flex items-center justify-between">

        <span
          className={`text-sm font-medium ${className}`}
        >
          {label}
        </span>

        <span className="text-xl font-bold text-white">
          {value}
        </span>

      </div>

    </div>
  );
}


/* ========================================================= */
/* Status Metric */
/* ========================================================= */

function StatusMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="report-status-card bg-slate-950 rounded-lg p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="text-xl font-bold text-white mt-2">
        {value}
      </p>

    </div>
  );
}


/* ========================================================= */
/* Format Type */
/* ========================================================= */

function formatType(
  type: string
) {
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