import { useEffect, useState } from "react";
import {
  Network as NetworkIcon,
  Server,
  Wifi,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import NetworkTopology from "../components/NetworkTopology";

interface Asset {
  id: number;
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
  status: string;
}

interface CollectorStatus {
  running: boolean;
}

export default function Network() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectorRunning, setCollectorRunning] =
    useState<boolean | null>(null);

  const loadCollectorStatus = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/collector/status"
      );

      if (!response.ok) {
        throw new Error("Failed to load collector status");
      }

      const data: CollectorStatus = await response.json();

      setCollectorRunning(Boolean(data.running));
    } catch (error) {
      console.error(
        "Failed to load collector status:",
        error
      );

      setCollectorRunning(null);
    }
  };

  const loadNetwork = async () => {
    try {
      setLoading(true);

      const [assetsResponse, collectorResponse] =
        await Promise.all([
          fetch(
            "http://127.0.0.1:8000/api/assets/"
          ),
          fetch(
            "http://127.0.0.1:8000/api/collector/status"
          ),
        ]);

      if (
        !assetsResponse.ok ||
        !collectorResponse.ok
      ) {
        throw new Error(
          "Failed to load network information"
        );
      }

      const assetsData: Asset[] =
        await assetsResponse.json();

      const collectorData: CollectorStatus =
        await collectorResponse.json();

      setAssets(
        Array.isArray(assetsData)
          ? assetsData
          : []
      );

      setCollectorRunning(
        Boolean(collectorData.running)
      );
    } catch (error) {
      console.error(
        "Failed to load network:",
        error
      );

      setCollectorRunning(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetwork();

    const interval = setInterval(() => {
      loadCollectorStatus();
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const onlineAssets = assets.filter(
    (asset) => asset.status === "online"
  );

  const monitoringLabel =
    collectorRunning === null
      ? "Checking..."
      : collectorRunning
        ? "Active"
        : "Stopped";

  const monitoringTextClass =
    collectorRunning === true
      ? "text-emerald-400"
      : collectorRunning === false
        ? "text-red-400"
        : "text-slate-400";

  const monitoringIconClass =
    collectorRunning === true
      ? "text-emerald-400"
      : collectorRunning === false
        ? "text-red-400"
        : "text-slate-500";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Network Overview
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Real-time overview of the monitored network
          </p>
        </div>

        <button
          onClick={loadNetwork}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-sm text-white"
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

      {/* Network information */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Monitored Network */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <NetworkIcon
            className="text-blue-400 mb-4"
            size={22}
          />

          <p className="text-sm text-slate-500">
            Monitored Network
          </p>

          <p className="text-xl font-semibold text-white mt-1">
            192.168.1.0/24
          </p>

        </div>

        {/* Discovered Assets */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <Server
            className="text-blue-400 mb-4"
            size={22}
          />

          <p className="text-sm text-slate-500">
            Discovered Assets
          </p>

          <p className="text-2xl font-semibold text-white mt-1">
            {loading ? "—" : assets.length}
          </p>

        </div>

        {/* Online Hosts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <Wifi
            className="text-emerald-400 mb-4"
            size={22}
          />

          <p className="text-sm text-slate-500">
            Online Hosts
          </p>

          <p className="text-2xl font-semibold text-emerald-400 mt-1">
            {loading
              ? "—"
              : onlineAssets.length}
          </p>

        </div>

        {/* Monitoring Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

          <ShieldCheck
            className={`${monitoringIconClass} mb-4`}
            size={22}
          />

          <p className="text-sm text-slate-500">
            Monitoring Status
          </p>

          <p
            className={`text-xl font-semibold mt-1 ${monitoringTextClass}`}
          >
            {loading
              ? "—"
              : monitoringLabel}
          </p>

        </div>

      </div>

      {/* Network Topology */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Network Topology
            </h2>

            <p className="text-sm text-slate-500">
              Discovered hosts in the monitored network
            </p>
          </div>
        </div>

        <NetworkTopology />

      </div>

      {/* Discovered Hosts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            Discovered Hosts
          </h2>
        </div>

        <div className="divide-y divide-slate-800">

          {assets.length === 0 && !loading ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-500">
                No discovered hosts found.
              </p>
            </div>
          ) : (
            assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/30"
              >

                <div className="flex items-center gap-3">

                  <Server
                    size={18}
                    className="text-blue-400"
                  />

                  <div>
                    <p className="text-sm text-white">
                      {asset.hostname || asset.ip}
                    </p>

                    <p className="text-xs text-slate-500">
                      {asset.ip}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-6">

                  <span className="text-xs text-slate-500">
                    {asset.vendor ||
                      "Unknown vendor"}
                  </span>

                  <span className="text-xs text-emerald-400">
                    ● {asset.status}
                  </span>

                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
}