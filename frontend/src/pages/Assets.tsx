import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Server,
  Radar,
  Search,
  X,
  ShieldAlert,
  Activity,
  Clock,
  Network,
  CheckCircle,
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

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/assets/"
      );

      if (!response.ok) {
        throw new Error("Failed to load assets");
      }

      const data = await response.json();

      setAssets(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load assets:",
        error
      );

      setError(
        "Failed to connect to NetMonitor backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadInvestigationData = async () => {
    try {
      const [
        eventsResponse,
        alertsResponse,
      ] = await Promise.all([
        fetch(
          "http://127.0.0.1:8000/api/events/"
        ),
        fetch(
          "http://127.0.0.1:8000/api/alerts/"
        ),
      ]);

      if (eventsResponse.ok) {
        const eventsData =
          await eventsResponse.json();

        setEvents(
          Array.isArray(eventsData)
            ? eventsData
            : []
        );
      }

      if (alertsResponse.ok) {
        const alertsData =
          await alertsResponse.json();

        setAlerts(
          Array.isArray(alertsData)
            ? alertsData
            : []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load asset investigation data:",
        error
      );
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadAssets(),
      loadInvestigationData(),
    ]);
  };

  const scanNetwork = async () => {
    try {
      setScanning(true);
      setError("");
      setMessage(
        "Scanning authorized network..."
      );

      const response = await fetch(
        "http://127.0.0.1:8000/api/assets/scan?target=192.168.1.0%2F24",
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Network scan failed"
        );
      }

      const result =
        await response.json();

      setMessage(
        `Scan completed. ${result.discovered} assets discovered.`
      );

      await loadAssets();
    } catch (error) {
      console.error(
        "Scan failed:",
        error
      );

      setError(
        "Network scan failed."
      );
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const filteredAssets = useMemo(() => {
    const query =
      searchTerm
        .trim()
        .toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter(
      (asset) => {
        return [
          asset.ip,
          asset.mac,
          asset.hostname,
          asset.vendor,
          asset.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      }
    );
  }, [assets, searchTerm]);

  const onlineAssets = assets.filter(
    (asset) =>
      asset.status === "online"
  ).length;

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Asset Inventory
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Discovered devices on the monitored network
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={loadAllData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-white transition"
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
            onClick={scanNetwork}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm text-white transition"
          >
            <Radar
              size={16}
              className={
                scanning
                  ? "animate-spin"
                  : ""
              }
            />

            {scanning
              ? "Scanning..."
              : "Scan Network"}
          </button>

        </div>
      </div>

      {/* ================================================== */}
      {/* Overview Cards */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <AssetStat
          title="Total Assets"
          value={
            loading
              ? "—"
              : String(assets.length)
          }
          subtitle="Discovered devices"
          icon={Server}
        />

        <AssetStat
          title="Online Assets"
          value={
            loading
              ? "—"
              : String(onlineAssets)
          }
          subtitle="Currently marked online"
          icon={CheckCircle}
        />

        <AssetStat
          title="Monitored Network"
          value="192.168.1.0/24"
          subtitle="Authorized scan range"
          icon={Network}
        />

      </div>

      {/* ================================================== */}
      {/* Messages */}
      {/* ================================================== */}

      {message && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ================================================== */}
      {/* Search */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search IP, hostname, MAC address, vendor..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* ================================================== */}
      {/* Asset Table */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        {/* Table Header */}

        <div className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-slate-800 text-xs text-slate-500 uppercase">
          <span>Host</span>
          <span>IP Address</span>
          <span>MAC Address</span>
          <span>Vendor</span>
          <span>Status</span>
          <span>Last Seen</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            Loading assets...
          </div>
        ) : filteredAssets.length ===
          0 ? (
          <div className="p-10 text-center">
            <Server
              size={32}
              className="mx-auto text-slate-600 mb-3"
            />

            <p className="text-white font-medium">
              No assets found
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Try a different search term.
            </p>
          </div>
        ) : (
          filteredAssets.map(
            (asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() =>
                  setSelectedAsset(
                    asset
                  )
                }
                className="w-full grid grid-cols-6 gap-4 px-5 py-4 border-b border-slate-800 hover:bg-slate-800/40 text-left transition"
              >

                {/* Host */}

                <div className="flex items-center gap-2 min-w-0">
                  <Server
                    size={16}
                    className="text-blue-400 shrink-0"
                  />

                  <span className="text-sm text-white truncate">
                    {asset.hostname ||
                      "Unknown Host"}
                  </span>
                </div>

                {/* IP */}

                <span className="text-sm text-slate-300">
                  {asset.ip}
                </span>

                {/* MAC */}

                <span className="text-xs text-slate-400">
                  {asset.mac ||
                    "Unknown"}
                </span>

                {/* Vendor */}

                <span className="text-sm text-slate-400 truncate">
                  {asset.vendor ||
                    "Unknown"}
                </span>

                {/* Status */}

                <span
                  className={`text-sm ${
                    asset.status ===
                    "online"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  ● {asset.status}
                </span>

                {/* Last Seen */}

                <span className="text-xs text-slate-500">
                  {new Date(
                    asset.last_seen
                  ).toLocaleString()}
                </span>

              </button>
            )
          )
        )}

      </div>

      {/* ================================================== */}
      {/* Asset Investigation */}
      {/* ================================================== */}

      {selectedAsset && (
        <AssetInvestigation
          asset={selectedAsset}
          events={events}
          alerts={alerts}
          onClose={() =>
            setSelectedAsset(null)
          }
        />
      )}

    </div>
  );
}


/* ========================================================= */
/* Asset Statistics Card */
/* ========================================================= */

function AssetStat({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Server;
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

      <p className="text-xs text-slate-600 mt-1">
        {subtitle}
      </p>

    </div>
  );
}


/* ========================================================= */
/* Asset Investigation */
/* ========================================================= */

function AssetInvestigation({
  asset,
  events,
  alerts,
  onClose,
}: {
  asset: Asset;
  events: NetworkEvent[];
  alerts: Alert[];
  onClose: () => void;
}) {
  const assetEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.source_ip ===
              asset.ip ||
            event.destination_ip ===
              asset.ip
        )
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        )
        .slice(0, 10),
    [events, asset.ip]
  );

  const assetAlerts = useMemo(
    () =>
      alerts
        .filter(
          (alert) =>
            alert.source_ip ===
              asset.ip ||
            alert.destination_ip ===
              asset.ip
        )
        .sort(
          (a, b) =>
            new Date(
              b.detected_at
            ).getTime() -
            new Date(
              a.detected_at
            ).getTime()
        )
        .slice(0, 10),
    [alerts, asset.ip]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl">

        {/* ================================================== */}
        {/* Modal Header */}
        {/* ================================================== */}

        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">

          <div>
            <div className="flex items-center gap-3">

              <div className="p-2 rounded-lg bg-blue-500/10">
                <Server
                  size={20}
                  className="text-blue-400"
                />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Asset Investigation
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  {asset.hostname ||
                    "Unknown Host"}{" "}
                  • {asset.ip}
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* ================================================== */}
        {/* Modal Content */}
        {/* ================================================== */}

        <div className="p-6 space-y-6">

          {/* ================================================== */}
          {/* Asset Overview */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            <DetailCard
              label="IP Address"
              value={asset.ip}
            />

            <DetailCard
              label="MAC Address"
              value={
                asset.mac ||
                "Unknown"
              }
            />

            <DetailCard
              label="Hostname"
              value={
                asset.hostname ||
                "Unknown"
              }
            />

            <DetailCard
              label="Vendor"
              value={
                asset.vendor ||
                "Unknown"
              }
            />

          </div>

          {/* ================================================== */}
          {/* Status / Times */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

              <div className="flex items-center gap-2">
                <CheckCircle
                  size={17}
                  className={
                    asset.status ===
                    "online"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }
                />

                <span className="text-xs text-slate-500">
                  Current Status
                </span>
              </div>

              <p
                className={`text-xl font-bold mt-3 ${
                  asset.status ===
                  "online"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {asset.status.toUpperCase()}
              </p>

            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

              <div className="flex items-center gap-2">
                <Clock
                  size={17}
                  className="text-blue-400"
                />

                <span className="text-xs text-slate-500">
                  First Seen
                </span>
              </div>

              <p className="text-sm text-white mt-3">
                {new Date(
                  asset.first_seen
                ).toLocaleString()}
              </p>

            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

              <div className="flex items-center gap-2">
                <Activity
                  size={17}
                  className="text-blue-400"
                />

                <span className="text-xs text-slate-500">
                  Last Seen
                </span>
              </div>

              <p className="text-sm text-white mt-3">
                {new Date(
                  asset.last_seen
                ).toLocaleString()}
              </p>

            </div>

          </div>

          {/* ================================================== */}
          {/* Security Summary */}
          {/* ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <SummaryCard
              title="Related Events"
              value={String(
                assetEvents.length
              )}
              icon={Activity}
            />

            <SummaryCard
              title="Related Alerts"
              value={String(
                assetAlerts.length
              )}
              icon={ShieldAlert}
            />

            <SummaryCard
              title="Network Role"
              value={
                asset.ip ===
                "192.168.1.1"
                  ? "Gateway"
                  : "Host"
              }
              icon={Network}
            />

          </div>

          {/* ================================================== */}
          {/* Related Alerts */}
          {/* ================================================== */}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert
                size={18}
                className="text-red-400"
              />

              <h3 className="text-sm font-semibold text-white">
                Related Security Alerts
              </h3>
            </div>

            {assetAlerts.length ===
            0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-400">
                  No security alerts are currently associated with this asset.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

                {assetAlerts.map(
                  (alert) => (
                    <div
                      key={alert.id}
                      className="px-5 py-4 border-b border-slate-800 last:border-b-0"
                    >

                      <div className="flex items-center justify-between gap-4">

                        <div>
                          <p className="text-sm font-medium text-white">
                            {formatType(
                              alert.alert_type
                            )}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {alert.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">

                          <p
                            className={`text-xs font-bold ${
                              alert.severity.toUpperCase() ===
                                "HIGH" ||
                              alert.severity.toUpperCase() ===
                                "CRITICAL"
                                ? "text-red-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            Risk{" "}
                            {alert.risk_score}/100
                          </p>

                        </div>

                      </div>

                      <p className="text-[10px] text-slate-600 mt-2">
                        {new Date(
                          alert.detected_at
                        ).toLocaleString()}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

          {/* ================================================== */}
          {/* Related Events */}
          {/* ================================================== */}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity
                size={18}
                className="text-blue-400"
              />

              <h3 className="text-sm font-semibold text-white">
                Recent Network Activity
              </h3>
            </div>

            {assetEvents.length ===
            0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-400">
                  No network events are currently associated with this asset.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

                {assetEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="px-5 py-4 border-b border-slate-800 last:border-b-0"
                    >

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

                        <div>
                          <p className="text-sm font-medium text-white">
                            {formatType(
                              event.event_type
                            )}
                          </p>

                          <p className="text-xs text-slate-500 mt-1">
                            {event.source_ip ||
                              "Unknown"}{" "}
                            →{" "}
                            {event.destination_ip ||
                              "Unknown"}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">

                          <span className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-400">
                            {event.protocol
                              ? event.protocol.toUpperCase()
                              : "UNKNOWN"}
                          </span>

                          {event.destination_port && (
                            <span className="text-[10px] px-2 py-1 rounded border border-slate-700 bg-slate-950 text-slate-400">
                              Port{" "}
                              {event.destination_port}
                            </span>
                          )}

                        </div>

                      </div>

                      <p className="text-[10px] text-slate-600 mt-2">
                        {new Date(
                          event.timestamp
                        ).toLocaleString()}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}


/* ========================================================= */
/* Detail Card */
/* ========================================================= */

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-600">
        {label}
      </p>

      <p className="text-sm text-white mt-2">
        {value}
      </p>
    </div>
  );
}


/* ========================================================= */
/* Summary Card */
/* ========================================================= */

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

      <Icon
        size={18}
        className="text-blue-400"
      />

      <p className="text-xs text-slate-500 mt-3">
        {title}
      </p>

      <p className="text-xl font-bold text-white mt-1">
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