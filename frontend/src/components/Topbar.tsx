import {
  Search,
  Bell,
  ShieldCheck,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

export default function Topbar() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showProfile, setShowProfile] =
    useState(false);

  const [collectorRunning, setCollectorRunning] =
    useState<boolean | null>(null);

  // ==================================================
  // Load Collector Status
  // ==================================================

  const loadCollectorStatus = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/collector/status"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch collector status"
        );
      }

      const data = await response.json();

      setCollectorRunning(
        Boolean(data.running)
      );
    } catch {
      setCollectorRunning(null);
    }
  };

  // ==================================================
  // Poll Collector Status
  // ==================================================

  useEffect(() => {
    loadCollectorStatus();

    const interval = window.setInterval(() => {
      loadCollectorStatus();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // ==================================================
  // Search
  // ==================================================

  const handleSearch = () => {
    const query = searchTerm.trim();

    if (!query) {
      return;
    }

    navigate(
      `/events?search=${encodeURIComponent(
        query
      )}`
    );

    setSearchTerm("");
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // ==================================================
  // Alerts
  // ==================================================

  const openAlerts = () => {
    navigate("/alerts");
  };

  // ==================================================
  // Monitoring Status UI
  // ==================================================

  const monitoringText =
    collectorRunning === null
      ? "Checking status..."
      : collectorRunning
        ? "Monitoring active"
        : "Monitoring stopped";

  const monitoringColor =
    collectorRunning === null
      ? "bg-slate-500"
      : collectorRunning
        ? "bg-emerald-400"
        : "bg-red-400";

  const monitoringTextColor =
    collectorRunning === null
      ? "text-slate-500"
      : collectorRunning
        ? "text-slate-500"
        : "text-red-400";

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">

      {/* ================================================== */}
      {/* Security Center */}
      {/* ================================================== */}

      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
            collectorRunning === false
              ? "bg-red-500/10"
              : "bg-emerald-500/10"
          }`}
        >
          <ShieldCheck
            className={
              collectorRunning === false
                ? "text-red-400"
                : "text-emerald-400"
            }
            size={19}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">
            Network Security Center
          </p>

          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${monitoringColor}`}
            />

            <p
              className={`text-xs ${monitoringTextColor}`}
            >
              {monitoringText}
            </p>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* Right Controls */}
      {/* ================================================== */}

      <div className="flex items-center gap-3">

        {/* ==================================================
            Global Search
            ================================================== */}

        <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 focus-within:border-blue-500/50 transition">
          <Search
            size={16}
            className="text-slate-500 shrink-0"
          />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
            placeholder="Search events, IPs..."
            className="bg-transparent outline-none text-sm text-white placeholder:text-slate-600 w-48"
            aria-label="Search network events"
          />

          {searchTerm.trim() && (
            <button
              type="button"
              onClick={handleSearch}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition"
            >
              Search
            </button>
          )}
        </div>

        {/* ==================================================
            Notification
            ================================================== */}

        <button
          type="button"
          onClick={openAlerts}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="View security alerts"
          aria-label="View security alerts"
        >
          <Bell size={20} />

          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-slate-950" />
        </button>

        {/* ==================================================
            User Profile
            ================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowProfile(
                (current) => !current
              )
            }
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm text-white transition"
            aria-label="Open user profile"
          >
            A
          </button>

          {showProfile && (
            <div className="absolute right-0 top-11 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-3 z-50">

              <div className="px-2 py-2 border-b border-slate-800">
                <p className="text-sm font-medium text-white">
                  Security Analyst
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  NetMonitor Administrator
                </p>
              </div>

              <div className="px-2 py-3">

                {/* System Status */}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    System
                  </span>

                  <span className="text-xs text-emerald-400">
                    Operational
                  </span>
                </div>

                {/* Monitoring Status */}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    Monitoring
                  </span>

                  <span
                    className={`text-xs ${
                      collectorRunning === false
                        ? "text-red-400"
                        : collectorRunning === true
                          ? "text-emerald-400"
                          : "text-slate-500"
                    }`}
                  >
                    {collectorRunning === null
                      ? "Checking..."
                      : collectorRunning
                        ? "Active"
                        : "Stopped"}
                  </span>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}