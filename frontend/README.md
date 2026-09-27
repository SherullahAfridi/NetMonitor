# NetMonitor

Network Security Monitoring & Threat Detection Platform

Defensive cybersecurity • Web-based • Nmap + Scapy • FastAPI + React + TypeScript • v1.0.0

> NetMonitor is intended only for networks, devices, and environments that you own or are explicitly authorized to monitor or scan.

## Overview

NetMonitor gives a network operator a single operational view of network assets, observed activity, security detections, alert context, and investigation data. It combines Nmap-based discovery, Scapy-based packet collection, a FastAPI backend, a SQLite/SQLAlchemy data layer, a rule-driven detection engine, source-based alert correlation, a React web interface, and browser-based reporting.

The workflow is intentionally simple and connected:

**Discover → Collect → Detect → Alert → Correlate → Investigate → Report**

NetMonitor is deliberately narrower in scope than a full enterprise SIEM — it focuses on network visibility and network-oriented detection rather than generalized, multi-domain log management.

## Status

This is a **functional prototype / product foundation**. Core workflows are implemented and validated end-to-end; enterprise-grade features (authentication, distributed sensors, AI/ML detection, cloud scaling) are documented as future roadmap items, not current functionality.

## Features

| Area | Current implementation |
|---|---|
| Network discovery | Nmap host discovery with XML parsing and asset upsert |
| Packet monitoring | Scapy background collector with stop-aware sniff loop |
| Events | TCP connection attempts, UDP traffic, ICMP echo requests |
| Detection | Five configurable rule types with thresholds/windows |
| Alerting | Severity, risk score, status, source/destination context |
| Correlation | Unresolved source-based correlation, capped at 100 |
| Investigation | Alert and event views with related-event evidence |
| Reporting | Live-data HTML report with print-to-PDF export |
| Operations | Collector start/stop and rule enable/disable controls |

## Architecture

NetMonitor uses a layered architecture:

| Layer | Components | Responsibility |
|---|---|---|
| Network telemetry | Nmap, Scapy, configured interface/subnet | Discovery, packet observation, raw telemetry |
| Application services | FastAPI, `detection.py`, `correlation.py` | API orchestration, detection, alerting, statistics |
| Persistence | SQLite, SQLAlchemy | Assets, events, alerts, detection rules |
| Presentation | React, TypeScript, Tailwind, Recharts, React Flow | Dashboards, investigation UI, topology, reports |

**Runtime flow:** Nmap discovers hosts → assets are upserted into inventory → Scapy observes packets on the configured interface → traffic is normalized into events → events are persisted and evaluated against detection rules → threshold matches create alerts with risk/severity → alerts from the same source are correlated → the frontend renders metrics, events, alerts, topology, and reports.

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, React Flow (`@xyflow`), Lucide React
**Backend:** Python, FastAPI, Uvicorn, SQLAlchemy, Scapy
**Discovery:** Nmap
**Database:** SQLite

## Detection Rules

| Rule | Threshold | Window | Severity | Risk | Intent |
|---|---|---|---|---|---|
| Possible Port Scan | 5 | 60s | HIGH | 85 | Repeated TCP attempts indicating port scanning |
| Repeated Connection Attempts | 5 | 60s | MEDIUM | 55 | Repeated attempts to the same destination |
| Possible Host Sweep | 3 | 60s | HIGH | 75 | Contact with multiple destination hosts |
| High Connection Rate | 20 | 60s | HIGH | 80 | High volume of TCP connection attempts |
| Unknown Device | 1 | 60s | MEDIUM | 60 | Source IP missing from asset inventory |

Thresholds and time windows are stored in the `DetectionRule` database model (not hard-coded in the UI), and every alert includes a human-readable detection reason for explainability.

### Correlated Risk

```python
correlation_bonus = min((len(unique_alert_types) - 1) * 10, 20)
correlated_risk = min(highest_risk + correlation_bonus, 100)
```

The correlation service starts from the highest risk score among a source's unresolved alerts and adds a capped bonus for multiple distinct alert types (max +20), with the final score capped at 100. A correlated risk of 100/100 reflects this deterministic formula — it is not by itself a calibrated probability of compromise.

## Alert Lifecycle

```
NEW → INVESTIGATING → RESOLVED
NEW → FALSE_POSITIVE
```

False-positive alerts are retained in history but excluded from the active Security Alerts summary.

## Project Structure

```
backend/
├── main.py
├── database.py
├── models.py
├── alerts.py
├── events.py
├── rules.py
├── detection.py
├── correlation.py
├── scanner.py
├── collector.py
└── routes/
    ├── assets.py
    ├── alerts.py
    ├── events.py
    ├── rules.py
    └── statistics.py

frontend/src/
├── components/
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   ├── StatCard.tsx
│   ├── AlertTable.tsx
│   ├── NetworkChart.tsx
│   └── NetworkTopology.tsx
├── layouts/
│   └── DashboardLayout.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Network.tsx
│   ├── Assets.tsx
│   ├── Alerts.tsx
│   ├── ThreatDetection.tsx
│   ├── Events.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── api/
├── types/
├── App.tsx
└── main.tsx
```

## Getting Started

### Prerequisites

| Component | Validated version |
|---|---|
| Python | 3.13.7 |
| Node.js | 24.11.0 |
| npm | 11.6.1 |
| Nmap | 7.991 |
| Npcap | 1.88 |

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install fastapi "uvicorn[standard]" sqlalchemy scapy
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev

# Production build
npm run build
```

Once both are running, open the frontend URL shown by Vite, go to **Settings**, and confirm **Backend API = HEALTHY**.

### Interactive API Docs

FastAPI serves live interactive documentation at:

```
http://127.0.0.1:8000/docs
```

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/collector/status` | Collector state |
| POST | `/api/collector/start` | Start collector |
| POST | `/api/collector/stop` | Request collector stop |
| GET | `/api/assets/` | Read asset inventory |
| POST | `/api/assets/scan?target=...` | Run authorized Nmap discovery |
| GET | `/api/events/` | Read network events |
| POST | `/api/events/` | Create an event and invoke detections |
| GET | `/api/alerts/` | Read security alerts |
| GET | `/api/alerts/{alert_id}` | Read alert details |
| GET | `/api/alerts/correlation/{source_ip}` | Read correlated source risk |
| PATCH | `/api/alerts/{alert_id}/status` | Update alert status |
| GET | `/api/rules/` | Read detection rules |
| GET | `/api/rules/{rule_id}` | Read one rule |
| PATCH | `/api/rules/{rule_id}/toggle` | Enable/disable a rule |
| GET | `/api/statistics/` | Read aggregate statistics |

## Data Model

| Entity | Key fields |
|---|---|
| Asset | `id, ip, mac, hostname, vendor, status, first_seen, last_seen` |
| NetworkEvent | `id, source_ip, destination_ip, source_port, destination_port, protocol, event_type, description, timestamp` |
| Alert | `id, alert_type, severity, risk_score, source_ip, destination_ip, protocol, description, status, detected_at, resolved_at` |
| DetectionRule | `id, rule_name, rule_type, description, enabled, threshold, window_seconds, severity, risk_score, created_at, updated_at` |

Alerts reference source/destination IPs rather than a strict foreign key to Assets, so alerts can exist even if the source isn't currently in inventory. Correlation is computed at query time from unresolved alerts sharing a source IP.

## Operations Runbook

**Startup**
1. Start the backend (`uvicorn main:app --reload`).
2. Start the frontend (`npm run dev`).
3. Open Settings and confirm Backend API = HEALTHY.
4. Confirm Network Collector = STOPPED before starting a deliberate session.

**Monitoring**
1. Run an authorized discovery scan from Assets when inventory needs refreshing.
2. Confirm the authorized monitoring scope under Network.
3. Start the collector from Settings.
4. Watch live activity in Events (with protocol filtering).
5. Triage new detections in Alerts.
6. Open an alert to review source, destination, rule, severity, risk, correlation, and related events.
7. Classify the alert (Investigating / Resolved / False Positive).
8. Generate a report once the session is complete.
9. Stop the collector when monitoring is no longer needed.

## Security Notes & Authorization Boundary

- Only discover or monitor networks/devices you own or are explicitly authorized to assess.
- The documented test environment used `192.168.1.0/24` as the monitored subnet — always scope scans to approved ranges.
- The current build has **no authentication layer**; do not expose the API or UI on an untrusted network.
- Before any production use: add authentication/RBAC, put the API behind TLS and a reverse proxy, migrate off SQLite for multi-user workloads, add audit logging, and implement event/report retention policies.
- Run the packet collector with the minimum privileges necessary.

## Known Limitations

| Limitation | Mitigation / direction |
|---|---|
| Threshold sensitivity — normal traffic can trigger alerts | Investigation + false-positive workflow; tune thresholds; future behavioral baselines |
| SQLite scale | Migrate to PostgreSQL via existing SQLAlchemy abstraction |
| Single collector / monitoring point | Introduce distributed sensors and centralized ingestion |
| Small event taxonomy | Add richer protocol parsers and IDS integrations |
| No authentication layer | Add auth, RBAC, TLS, API hardening before production |
| No automated retention policy | Implement TTL/archival strategy |
| Rule-based (non-adaptive) detection | Add ML anomaly detection as a secondary layer |

## Roadmap

| Phase | Capabilities | Status |
|---|---|---|
| 1 — Current foundation | Discovery, collection, rules, alerts, correlation, investigation, reports | Complete |
| 2 — Detection enrichment | Threat intelligence, richer metadata, rule authoring | Future |
| 3 — AI-assisted analysis | Behavioral anomalies, adaptive baselines, LLM-assisted summaries | Future |
| 4 — Distributed deployment | Multiple sensors, centralized ingestion, PostgreSQL, RBAC | Future |
| 5 — Productization | Cloud deployment, multi-tenancy, billing, enterprise integrations | Future |

## Relationship to a SIEM

NetMonitor is **not** a SIEM replacement. It focuses on authorized network visibility, network events, rule-based detection, alert investigation, and network-security reporting — rather than enterprise-scale, multi-source log ingestion. Future versions may integrate with SIEM, IDS/IPS, Wazuh, Zeek, Suricata, or firewall platforms.

## Validation Summary

The build passed a full functional/integration test matrix (health checks, discovery, collector start/stop, live event generation, all five detection rules, alert investigation, alert lifecycle transitions, dashboard sync, reporting, and a production frontend build). See the full technical specification for detailed test IDs and evidence snapshots.

```
npm run build
✓ 2592 modules transformed.
✓ built successfully
```

---

**NetMonitor** — Network Security Monitoring & Threat Detection Platform