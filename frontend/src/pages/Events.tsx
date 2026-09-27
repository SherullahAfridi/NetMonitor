import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  X,
} from "lucide-react";

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

export default function Events() {
  const [searchParams] = useSearchParams();

  const urlSearch =
    searchParams.get("search") ?? "";

  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] =
    useState(urlSearch);

  const [protocolFilter, setProtocolFilter] =
    useState("ALL");

  const [selectedEvent, setSelectedEvent] =
    useState<NetworkEvent | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventsResponse, alertsResponse] =
        await Promise.all([
          fetch(
            "http://127.0.0.1:8000/api/events/"
          ),
          fetch(
            "http://127.0.0.1:8000/api/alerts/"
          ),
        ]);

      if (!eventsResponse.ok) {
        throw new Error(
          "Failed to load network events"
        );
      }

      const eventsData =
        await eventsResponse.json();

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : []
      );

      if (alertsResponse.ok) {
        const alertsData =
          await alertsResponse.json();

        setAlerts(
          Array.isArray(alertsData)
            ? alertsData
            : []
        );
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error(
        "Failed to load events:",
        err
      );

      setError(
        "Unable to load network events."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  /* ====================================================== */
  /* Sync Topbar URL Search With Events Search               */
  /* ====================================================== */

  useEffect(() => {
    setSearchTerm(urlSearch);
  }, [urlSearch]);

  const protocols = useMemo(() => {
    const values = events
      .map(
        (event) => event.protocol
      )
      .filter(
        (
          protocol
        ): protocol is string =>
          Boolean(protocol)
      );

    return Array.from(
      new Set(values)
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return events.filter((event) => {
      const matchesProtocol =
        protocolFilter === "ALL" ||
        (
          event.protocol || ""
        ).toUpperCase() ===
          protocolFilter;

      if (!normalizedSearch) {
        return matchesProtocol;
      }

      const searchableText = [
        event.source_ip,
        event.destination_ip,
        event.source_port,
        event.destination_port,
        event.protocol,
        event.event_type,
        event.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesProtocol &&
        searchableText.includes(
          normalizedSearch
        )
      );
    });
  }, [
    events,
    searchTerm,
    protocolFilter,
  ]);

  const uniqueSources = new Set(
    events
      .map(
        (event) => event.source_ip
      )
      .filter(Boolean)
  ).size;

  const uniqueDestinations = new Set(
    events
      .map(
        (event) =>
          event.destination_ip
      )
      .filter(Boolean)
  ).size;

  const securityAlerts =
    alerts.filter(
      (alert) =>
        alert.status.toUpperCase() !==
        "FALSE_POSITIVE"
    ).length;

  /* ====================================================== */
  /* Timeline */
  /* ====================================================== */

  const timelineEvents = useMemo(
    () => {
      return [...filteredEvents]
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        )
        .slice(0, 10);
    },
    [filteredEvents]
  );

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* Header */}
      {/* ================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Network Events
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Explore and investigate recorded network activity
          </p>
        </div>

        <button
          onClick={loadEvents}
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

        <EventStat
          title="Total Events"
          value={
            loading
              ? "—"
              : String(events.length)
          }
          icon={Activity}
        />

        <EventStat
          title="Unique Sources"
          value={
            loading
              ? "—"
              : String(uniqueSources)
          }
          icon={Server}
        />

        <EventStat
          title="Destinations"
          value={
            loading
              ? "—"
              : String(
                  uniqueDestinations
                )
          }
          icon={ShieldAlert}
        />

        <EventStat
          title="Security Alerts"
          value={
            loading
              ? "—"
              : String(
                  securityAlerts
                )
          }
          icon={ShieldAlert}
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
      {/* Filters */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}

          <div className="relative flex-1">

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
              placeholder="Search IP, port, protocol, event type..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50"
            />

          </div>

          {/* Protocol Filter */}

          <div className="flex items-center gap-2">

            <Filter
              size={16}
              className="text-slate-500"
            />

            <select
              value={protocolFilter}
              onChange={(event) =>
                setProtocolFilter(
                  event.target.value
                )
              }
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-300 outline-none"
            >
              <option value="ALL">
                All Protocols
              </option>

              {protocols.map(
                (protocol) => (
                  <option
                    key={protocol}
                    value={protocol.toUpperCase()}
                  >
                    {protocol.toUpperCase()}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </div>

      {/* ================================================== */}
      {/* Security Event Timeline */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-slate-800">

          <div className="flex items-center gap-3">

            <div className="p-2 rounded-lg bg-blue-500/10">

              <Clock
                size={18}
                className="text-blue-400"
              />

            </div>

            <div>

              <h2 className="text-lg font-semibold text-white">
                Security Event Timeline
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Latest network activity in chronological order
              </p>

            </div>

          </div>

        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading security timeline...
          </div>
        ) : timelineEvents.length ===
          0 ? (

          <div className="p-8 text-center">

            <Clock
              size={30}
              className="mx-auto text-slate-600 mb-3"
            />

            <p className="text-white font-medium">
              No timeline events
            </p>

            <p className="text-sm text-slate-500 mt-1">
              No network activity matches the current filters.
            </p>

          </div>

        ) : (

          <div className="p-5">

            <div className="relative">

              {/* Vertical timeline line */}

              <div className="absolute left-[11px] top-3 bottom-3 w-px bg-slate-800" />

              <div className="space-y-5">

                {timelineEvents.map(
                  (event) => {

                    const relatedAlert =
                      findRelatedAlert(
                        event,
                        alerts
                      );

                    const suspicious =
                      Boolean(relatedAlert);

                    return (
                      <TimelineItem
                        key={event.id}
                        event={event}
                        suspicious={
                          suspicious
                        }
                        relatedAlert={
                          relatedAlert
                        }
                        onClick={() =>
                          setSelectedEvent(
                            event
                          )
                        }
                      />
                    );
                  }
                )}

              </div>

            </div>

          </div>

        )}

      </div>

      {/* ================================================== */}
      {/* Event Explorer */}
      {/* ================================================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Event Explorer
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Showing{" "}
              {filteredEvents.length}{" "}
              of {events.length}{" "}
              recorded events
            </p>

          </div>

          <Activity
            size={20}
            className="text-blue-400"
          />

        </div>

        {loading ? (

          <div className="p-10 text-center text-sm text-slate-500">
            Loading network events...
          </div>

        ) : filteredEvents.length ===
          0 ? (

          <div className="p-10 text-center">

            <Activity
              size={32}
              className="mx-auto text-slate-600 mb-3"
            />

            <p className="text-white font-medium">
              No events found
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Try changing your search or filter.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-800">

            {filteredEvents.map(
              (event) => (

                <EventRow
                  key={event.id}
                  event={event}
                  alerts={alerts}
                  onClick={() =>
                    setSelectedEvent(
                      event
                    )
                  }
                />

              )
            )}

          </div>

        )}

      </div>

      {/* ================================================== */}
      {/* Investigation Modal */}
      {/* ================================================== */}

      {selectedEvent && (
        <EventInvestigation
          event={selectedEvent}
          alerts={alerts}
          onClose={() =>
            setSelectedEvent(null)
          }
        />
      )}

    </div>
  );
}

/* ========================================================= */
/* Event Statistics */
/* ========================================================= */

function EventStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Activity;
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
/* Timeline Item */
/* ========================================================= */

function TimelineItem({
  event,
  suspicious,
  relatedAlert,
  onClick,
}: {
  event: NetworkEvent;
  suspicious: boolean;
  relatedAlert: Alert | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full text-left pl-9 hover:bg-slate-950/60 rounded-lg p-3 -ml-3 transition group"
    >

      {/* Timeline Marker */}

      <div
        className={`absolute left-0 top-5 w-[23px] h-[23px] rounded-full border-4 border-slate-900 z-10 ${
          relatedAlert
            ? "bg-red-500"
            : suspicious
              ? "bg-yellow-400"
              : "bg-blue-400"
        }`}
      />

      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-3">

        {/* Event Information */}

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <span className="text-xs text-slate-500">
              {new Date(
                event.timestamp
              ).toLocaleString()}
            </span>

            {relatedAlert && (
              <span className="text-[10px] font-bold px-2 py-1 rounded border border-red-500/20 bg-red-500/10 text-red-400">
                ALERT
              </span>
            )}

            {!relatedAlert &&
              suspicious && (
                <span className="text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                  SUSPICIOUS
                </span>
              )}

          </div>

          <p className="text-sm font-semibold text-white mt-1">
            {formatEventType(
              event.event_type
            )}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            {event.source_ip ||
              "Unknown source"}
            {" → "}
            {event.destination_ip ||
              "Unknown destination"}
          </p>

        </div>

        {/* Metadata */}

        <div className="flex flex-wrap items-center gap-3 shrink-0">

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

          {relatedAlert && (
            <span className="text-[10px] text-red-400 font-medium">
              Risk{" "}
              {relatedAlert.risk_score}
            </span>
          )}

        </div>

      </div>

      <p className="text-xs text-slate-600 mt-2 line-clamp-1">
        {event.description ||
          "Network activity recorded by NetMonitor."}
      </p>

      <div className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition mt-2">
        Click to investigate →
      </div>

    </button>
  );
}

/* ========================================================= */
/* Event Row */
/* ========================================================= */

function EventRow({
  event,
  alerts,
  onClick,
}: {
  event: NetworkEvent;
  alerts: Alert[];
  onClick: () => void;
}) {
  const suspicious =
    isSuspiciousEvent(
      event,
      alerts
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-5 py-5 hover:bg-slate-800/30 transition cursor-pointer"
    >

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

        {/* Event Identity */}

        <div className="flex items-start gap-4 min-w-0">

          <div className="mt-1">

            <Activity
              size={19}
              className={
                suspicious
                  ? "text-yellow-400"
                  : "text-blue-400"
              }
            />

          </div>

          <div className="min-w-0">

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="text-sm font-semibold text-white">
                {formatEventType(
                  event.event_type
                )}
              </h3>

              {suspicious && (
                <span className="text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                  SUSPICIOUS
                </span>
              )}

            </div>

            <p className="text-sm text-slate-400 mt-2">
              {event.description ||
                "Network activity recorded by NetMonitor."}
            </p>

          </div>

        </div>

        {/* Metadata */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 text-xs min-w-[500px]">

          <div>

            <p className="text-slate-600">
              Source
            </p>

            <p className="text-slate-300 mt-1">
              {event.source_ip ||
                "Unknown"}
            </p>

            {event.source_port && (
              <p className="text-slate-600 mt-0.5">
                Port{" "}
                {event.source_port}
              </p>
            )}

          </div>

          <div>

            <p className="text-slate-600">
              Destination
            </p>

            <p className="text-slate-300 mt-1">
              {event.destination_ip ||
                "Unknown"}
            </p>

            {event.destination_port && (
              <p className="text-slate-600 mt-0.5">
                Port{" "}
                {event.destination_port}
              </p>
            )}

          </div>

          <div>

            <p className="text-slate-600">
              Protocol
            </p>

            <p className="text-slate-300 mt-1">
              {event.protocol ||
                "Unknown"}
            </p>

          </div>

          <div>

            <p className="text-slate-600">
              Event ID
            </p>

            <p className="text-slate-300 mt-1">
              #{event.id}
            </p>

          </div>

        </div>

      </div>

      {/* Timestamp */}

      <div className="flex items-center gap-2 mt-4 ml-9 text-xs text-slate-600">

        <Clock size={13} />

        {new Date(
          event.timestamp
        ).toLocaleString()}

      </div>

      {/* Investigation Hint */}

      <div className="ml-9 mt-3 text-xs text-blue-400">
        Click to investigate event →
      </div>

    </button>
  );
}

/* ========================================================= */
/* Event Investigation */
/* ========================================================= */

function EventInvestigation({
  event,
  alerts,
  onClose,
}: {
  event: NetworkEvent;
  alerts: Alert[];
  onClose: () => void;
}) {
  const relatedAlert =
    findRelatedAlert(
      event,
      alerts
    );

  const suspicious =
    Boolean(relatedAlert);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">

      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl">

        {/* Modal Header */}

        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-slate-950 border-b border-slate-800">

          <div>

            <div className="flex items-center gap-3">

              <ShieldAlert
                size={22}
                className={
                  suspicious
                    ? "text-yellow-400"
                    : "text-blue-400"
                }
              />

              <h2 className="text-lg font-semibold text-white">
                Event Investigation
              </h2>

              {suspicious && (
                <span className="text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
                  SUSPICIOUS
                </span>
              )}

            </div>

            <p className="text-xs text-slate-500 mt-1">
              Investigating network event #
              {event.id}
            </p>

          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>

        </div>

        {/* Investigation Content */}

        <div className="p-6 space-y-6">

          {/* Event Overview */}

          <section>

            <h3 className="text-sm font-semibold text-white mb-3">
              Event Overview
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <DetailCard
                label="Event ID"
                value={`#${event.id}`}
              />

              <DetailCard
                label="Event Type"
                value={formatEventType(
                  event.event_type
                )}
              />

              <DetailCard
                label="Protocol"
                value={
                  event.protocol?.toUpperCase() ||
                  "Unknown"
                }
              />

              <DetailCard
                label="Timestamp"
                value={new Date(
                  event.timestamp
                ).toLocaleString()}
              />

            </div>

          </section>

          {/* Network Flow */}

          <section>

            <h3 className="text-sm font-semibold text-white mb-3">
              Network Flow
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <NetworkDetail
                title="Source"
                ip={event.source_ip}
                port={event.source_port}
              />

              <NetworkDetail
                title="Destination"
                ip={event.destination_ip}
                port={
                  event.destination_port
                }
              />

            </div>

          </section>

          {/* Description */}

          <section>

            <h3 className="text-sm font-semibold text-white mb-3">
              Event Description
            </h3>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

              <p className="text-sm text-slate-300 leading-6">
                {event.description ||
                  "No additional description was recorded for this event."}
              </p>

            </div>

          </section>

          {/* Security Assessment */}

          <section>

            <h3 className="text-sm font-semibold text-white mb-3">
              Security Assessment
            </h3>

            <div
              className={`rounded-xl border p-4 ${
                relatedAlert
                  ? "bg-red-500/5 border-red-500/20"
                  : suspicious
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-emerald-500/5 border-emerald-500/20"
              }`}
            >

              <div className="flex items-start gap-3">

                {relatedAlert ? (
                  <ShieldAlert
                    size={20}
                    className="text-red-400 mt-0.5"
                  />
                ) : suspicious ? (
                  <AlertTriangle
                    size={20}
                    className="text-yellow-400 mt-0.5"
                  />
                ) : (
                  <CheckCircle
                    size={20}
                    className="text-emerald-400 mt-0.5"
                  />
                )}

                <div>

                  <p className="text-sm font-medium text-white">

                    {relatedAlert
                      ? "Security alert associated with this event"
                      : suspicious
                        ? "Potentially suspicious activity"
                        : "No suspicious classification"}

                  </p>

                  <p className="text-xs text-slate-500 mt-1">

                    {relatedAlert
                      ? `${formatEventType(
                          relatedAlert.alert_type
                        )} with risk score ${relatedAlert.risk_score}/100.`
                      : suspicious
                        ? "This event matches a NetMonitor suspicious-event pattern and should be reviewed."
                        : "This event does not currently match the configured suspicious-event patterns."}

                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* Related Alert */}

          <section>

            <h3 className="text-sm font-semibold text-white mb-3">
              Related Security Alert
            </h3>

            {relatedAlert ? (

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <div className="flex items-center gap-3">

                      <h4 className="text-sm font-semibold text-white">
                        {formatEventType(
                          relatedAlert.alert_type
                        )}
                      </h4>

                      <SeverityBadge
                        severity={
                          relatedAlert.severity
                        }
                      />

                    </div>

                    <p className="text-sm text-slate-400 mt-2">
                      {
                        relatedAlert.description
                      }
                    </p>

                  </div>

                  <div className="text-right shrink-0">

                    <p className="text-[10px] text-slate-600">
                      Risk
                    </p>

                    <p className="text-sm font-semibold text-white">
                      {
                        relatedAlert.risk_score
                      }
                      /100
                    </p>

                    <span className="text-xs font-medium text-blue-400">
                      {relatedAlert.status.replace(
                        "_",
                        " "
                      )}
                    </span>

                  </div>

                </div>

              </div>

            ) : (

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">

                <p className="text-sm text-slate-400">
                  No related security alert found for this event.
                </p>

                <p className="text-xs text-slate-600 mt-1">
                  The detection engine may not have classified this event as an alert.
                </p>

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

      <p className="text-sm text-white mt-1">
        {value}
      </p>

    </div>
  );
}

/* ========================================================= */
/* Network Detail */
/* ========================================================= */

function NetworkDetail({
  title,
  ip,
  port,
}: {
  title: string;
  ip: string | null;
  port: number | null;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">

      <p className="text-xs text-slate-600">
        {title}
      </p>

      <p className="text-base font-medium text-white mt-1">
        {ip || "Unknown"}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {port
          ? `Port ${port}`
          : "Port information unavailable"}
      </p>

    </div>
  );
}

/* ========================================================= */
/* Severity Badge */
/* ========================================================= */

function SeverityBadge({
  severity,
}: {
  severity: string;
}) {
  const normalized =
    severity.toUpperCase();

  const className =
    normalized === "HIGH" ||
    normalized === "CRITICAL"
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : normalized === "MEDIUM"
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        : "text-blue-400 bg-blue-500/10 border-blue-500/20";

  return (
    <span
      className={`text-[10px] font-bold px-2 py-1 rounded border ${className}`}
    >
      {normalized}
    </span>
  );
}

/* ========================================================= */
/* Find Related Alert */
/* ========================================================= */

function findRelatedAlert(
  event: NetworkEvent,
  alerts: Alert[]
): Alert | null {
  if (!event.source_ip) {
    return null;
  }

  const eventTime = new Date(
    event.timestamp
  ).getTime();

  const candidates = alerts.filter(
    (alert) => {
      if (alert.source_ip !== event.source_ip) {
        return false;
      }

      // A network event should only be linked to an alert created
      // very close to the event. This avoids tagging unrelated
      // traffic from the same host as suspicious.
      const alertTime = new Date(
        alert.detected_at
      ).getTime();

      const ageSeconds =
        Math.abs(eventTime - alertTime) /
        1000;

      if (ageSeconds > 10) {
        return false;
      }

      const alertType =
        alert.alert_type.toUpperCase();

      // Connection-based detections are generated from TCP
      // connection-attempt events, not ordinary UDP/ICMP traffic.
      if (
        alertType.includes("PORT_SCAN") ||
        alertType.includes("REPEATED_CONNECTION") ||
        alertType.includes("HIGH_CONNECTION_RATE") ||
        alertType.includes("HOST_SWEEP")
      ) {
        if (
          event.protocol?.toUpperCase() !==
          "TCP"
        ) {
          return false;
        }

        if (
          !event.event_type
            .toUpperCase()
            .includes("CONNECTION_ATTEMPT")
        ) {
          return false;
        }
      }

      // When an alert has a concrete destination, require an exact
      // destination match as well.
      if (alert.destination_ip) {
        return (
          alert.destination_ip ===
          event.destination_ip
        );
      }

      return true;
    }
  );

  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort(
    (a, b) =>
      Math.abs(
        new Date(a.detected_at).getTime() -
        eventTime
      ) -
      Math.abs(
        new Date(b.detected_at).getTime() -
        eventTime
      )
  )[0];
}

/* ========================================================= */
/* Suspicious Event Classification */
/* ========================================================= */

function isSuspiciousEvent(
  event: NetworkEvent,
  alerts: Alert[]
) {
  return Boolean(
    findRelatedAlert(
      event,
      alerts
    )
  );
}

/* ========================================================= */
/* Format Event Type */
/* ========================================================= */

function formatEventType(
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