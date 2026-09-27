Absolutely. Below is a **complete, professional, product-style README** for your current **NetMonitor** project. It is written as a real cybersecurity software product document rather than a simple university assignment.

I have kept implemented functionality separate from future enhancements, so the README does not falsely claim features that are not currently implemented.

You can paste the entire content directly into:

```text
D:\NetMonitor\README.md
```

````markdown
# NetMonitor

### Network Security Monitoring & Threat Detection Platform

NetMonitor is a web-based network security monitoring and threat detection platform designed to help network administrators and security teams discover authorized network assets, monitor network activity, identify suspicious behavior, investigate security alerts, assess risk, and generate security reports from a centralized dashboard.

The platform combines network discovery, packet-level event collection, configurable detection rules, alert correlation, risk scoring, investigation workflows, asset inventory, network visualization, and reporting into a focused network-security monitoring system.

> **Security Notice:** NetMonitor is designed for authorized networks, systems, and environments only. Do not monitor, scan, or analyze networks without appropriate permission.

---

# 1. Project Overview

Modern organizations operate networks containing laptops, desktops, servers, mobile devices, virtual machines, network appliances, and other connected systems. As network activity increases, manually identifying unusual connection behavior becomes difficult.

NetMonitor provides a centralized interface for observing network activity and identifying patterns that may require investigation.

The platform follows a security monitoring workflow:

```text
Authorized Network
        │
        ▼
Network Discovery
        │
        ▼
Asset Inventory
        │
        ▼
Packet / Event Collection
        │
        ▼
Event Normalization
        │
        ▼
Detection Rules
        │
        ▼
Security Alert
        │
        ▼
Risk Assessment
        │
        ▼
Alert Correlation
        │
        ▼
Investigation
        │
        ▼
Reporting
````

NetMonitor is intentionally focused on **network-security monitoring and threat detection** rather than attempting to replace a full enterprise SIEM platform.

---

# 2. Project Goals

The primary goal of NetMonitor is to provide a practical security monitoring platform that can help authorized network operators:

* Discover connected network assets.
* Maintain an asset inventory.
* Observe live network activity.
* Record network security events.
* Detect suspicious connection patterns.
* Generate security alerts.
* Assign risk scores to detected behavior.
* Correlate multiple alerts from the same source.
* Investigate suspicious network events.
* Monitor detection-rule status.
* Visualize network structure.
* Generate security reports.
* Provide a centralized web-based security interface.

---

# 3. Problem Statement

Network administrators and security teams need visibility into what is happening inside their networks.

Without centralized monitoring, it can be difficult to answer questions such as:

* Which devices are currently connected?
* What hosts are communicating?
* What protocols are being used?
* Which systems are generating unusual connection activity?
* Are repeated connection attempts occurring?
* Is a host contacting multiple destinations in a short period?
* Which events have resulted in security alerts?
* What is the associated risk?
* Which alerts require investigation?
* What happened before and after a suspicious event?

Traditional troubleshooting can involve multiple tools and manual correlation.

NetMonitor addresses this problem by combining network discovery, event collection, detection, alert management, investigation, and reporting into one focused platform.

---

# 4. Objectives

## 4.1 Primary Objectives

1. Develop a centralized web-based network security monitoring platform.
2. Discover and maintain an inventory of authorized network assets.
3. Capture and record network activity as security events.
4. Detect predefined suspicious network behaviors.
5. Generate actionable security alerts.
6. Provide risk scores and severity classification.
7. Correlate alerts originating from the same source.
8. Provide investigation capabilities for security analysts.
9. Provide network and security analytics through a dashboard.
10. Generate security reports based on current platform data.

## 4.2 Secondary Objectives

* Provide configurable detection rules.
* Allow detection rules to be enabled or disabled.
* Provide network topology visualization.
* Provide searchable event data.
* Provide alert status management.
* Support false-positive classification.
* Provide a simple operational interface for network monitoring.

---

# 5. Product Scope

NetMonitor currently focuses on the following areas:

```text
Network Discovery
        +
Asset Inventory
        +
Live Network Monitoring
        +
Event Collection
        +
Rule-Based Threat Detection
        +
Security Alerts
        +
Risk Scoring
        +
Alert Correlation
        +
Investigation
        +
Network Visualization
        +
Reporting
```

The current implementation is designed around a single authorized monitoring environment and uses a local database for operational data.

---

# 6. Core Product Modules

## 6.1 Security Dashboard

The dashboard provides a centralized overview of network-security activity.

It displays:

* Active assets
* Security alerts
* Network events
* Average risk score
* Recent alerts
* Top network hosts
* Detection summary
* Alert status information

The dashboard obtains live information from the backend API.

---

## 6.2 Network Discovery

NetMonitor uses Nmap for authorized network discovery.

The discovery process identifies information such as:

* IP address
* MAC address
* Hostname
* Vendor
* Host availability

The discovered information is stored in the asset inventory.

Example monitored network:

```text
192.168.1.0/24
```

---

## 6.3 Asset Inventory

The asset inventory provides a centralized view of discovered network devices.

Each asset can contain:

```text
Asset ID
IP Address
MAC Address
Hostname
Vendor
Status
First Seen
Last Seen
```

Asset records are stored in SQLite through SQLAlchemy.

The system also prevents duplicate IP entries during asset discovery.

---

## 6.4 Live Network Monitoring

NetMonitor uses Scapy for packet-level monitoring.

The collector can observe authorized network traffic and convert relevant traffic into normalized network events.

Current event categories include:

```text
TCP_CONNECTION_ATTEMPT
UDP_TRAFFIC
ICMP_ECHO_REQUEST
```

The packet collector runs in the backend as a background service.

---

## 6.5 Event Explorer

The Event Explorer provides a searchable interface for recorded network activity.

Events can be searched using fields including:

* Source IP
* Destination IP
* Source port
* Destination port
* Protocol
* Event type
* Event description

Protocol filtering supports discovered protocol types such as:

```text
TCP
UDP
ICMP
```

---

## 6.6 Security Event Timeline

The Events page provides a chronological timeline of recent network activity.

The timeline helps analysts understand:

```text
What happened?
When did it happen?
Which source generated it?
Which destination was contacted?
Which protocol was used?
Was it associated with an alert?
```

Timeline events can be opened for detailed investigation.

---

## 6.7 Threat Detection Engine

The detection engine analyzes recorded network events using configurable security rules.

Current detection rules:

| Rule                         | Default Threshold | Window | Severity | Risk |
| ---------------------------- | ----------------: | -----: | -------- | ---: |
| Possible Port Scan           |                 5 | 60 sec | HIGH     |   85 |
| Repeated Connection Attempts |                 5 | 60 sec | MEDIUM   |   55 |
| Possible Host Sweep          |                 3 | 60 sec | HIGH     |   75 |
| High Connection Rate         |                20 | 60 sec | HIGH     |   80 |
| Unknown Device               |                 1 | 60 sec | MEDIUM   |   60 |

These values are configuration values used by the current implementation and can be managed through the Settings interface.

---

# 7. Detection Rules

## 7.1 Possible Port Scan

This rule detects repeated TCP connection attempts associated with different destination ports and is intended to identify behavior consistent with port-scanning activity.

Default configuration:

```text
Threshold: 5
Window: 60 seconds
Severity: HIGH
Risk Score: 85
```

---

## 7.2 Repeated Connection Attempts

This rule detects repeated connection attempts from the same source to a destination within a configured time window.

Default configuration:

```text
Threshold: 5
Window: 60 seconds
Severity: MEDIUM
Risk Score: 55
```

Example alert:

```text
Repeated connection attempts detected from
192.168.1.2 to 172.16.54.249.

5 connection attempts were observed
within 60 seconds.
```

---

## 7.3 Possible Host Sweep

This rule identifies a source contacting multiple destination hosts within a short period.

Default configuration:

```text
Threshold: 3
Window: 60 seconds
Severity: HIGH
Risk Score: 75
```

The rule is intended to identify behavior consistent with host-discovery or host-sweep activity.

---

## 7.4 High Connection Rate

This rule detects a high number of TCP connection attempts from a source within the configured time window.

Default configuration:

```text
Threshold: 20
Window: 60 seconds
Severity: HIGH
Risk Score: 80
```

---

## 7.5 Unknown Device

This rule identifies activity from a source IP that is not currently present in the asset inventory.

Default configuration:

```text
Threshold: 1
Window: 60 seconds
Severity: MEDIUM
Risk Score: 60
```

---

# 8. Alert Management

When a detection rule identifies suspicious behavior, NetMonitor creates a security alert.

Each alert contains information such as:

```text
Alert ID
Alert Type
Severity
Risk Score
Source IP
Destination IP
Protocol
Description
Status
Detected Time
Resolved Time
```

---

# 9. Alert Status Workflow

NetMonitor supports the following alert states:

```text
NEW
  │
  ▼
INVESTIGATING
  │
  ▼
RESOLVED
```

Alerts can also be classified as:

```text
FALSE_POSITIVE
```

This allows the analyst to distinguish an investigated security alert from an event that was determined not to require further action.

---

# 10. Severity Levels

Current severity levels are:

```text
HIGH
MEDIUM
LOW
```

Severity is assigned by the configured detection rule.

Risk score and severity are related but are stored independently, allowing the platform to present both the rule-defined score and the corresponding security classification.

---

# 11. Risk Scoring

Each detection rule has an associated risk score.

Current rule scores:

```text
Possible Port Scan             85
High Connection Rate           80
Possible Host Sweep            75
Unknown Device                 60
Repeated Connection Attempts   55
```

Risk scores are represented on a:

```text
0–100
```

scale.

---

# 12. Alert Correlation

NetMonitor performs source-based alert correlation.

When multiple unresolved alerts originate from the same source IP, the platform calculates a correlated risk value.

The current correlation process considers:

1. The highest risk score among unresolved alerts.
2. The number of unique alert types.
3. A correlation bonus for multiple alert types.
4. A maximum correlated score of 100.

Conceptually:

```text
Highest Alert Risk
        +
Correlation Bonus
        │
        ▼
Correlated Risk
        │
        ▼
Severity Classification
```

The correlation bonus is limited so that the final risk score cannot exceed:

```text
100
```

This provides analysts with additional context when a source exhibits multiple categories of suspicious behavior.

---

# 13. Alert Investigation

The Alert Investigation interface provides a centralized view of an individual security alert.

The investigation view includes:

```text
Risk Score
Severity
Related Events
Correlated Alerts
Source IP
Destination IP
Protocol
Status
Detection Time
Detection Reason
Correlated Risk
Related Alert Types
Recent Network Events
```

Example investigation workflow:

```text
Security Alert
      │
      ▼
Review Detection Reason
      │
      ▼
Review Risk & Severity
      │
      ▼
Review Correlated Alerts
      │
      ▼
Review Related Network Events
      │
      ▼
Determine Status
```

---

# 14. Event Investigation

Individual network events can also be investigated.

The event investigation view provides:

### Event Overview

```text
Event ID
Event Type
Protocol
Timestamp
```

### Network Flow

```text
Source IP
Source Port
Destination IP
Destination Port
```

### Event Description

Human-readable information generated by the collector.

### Security Assessment

The event can be presented as:

```text
Security Alert Associated
Potentially Suspicious Activity
No Suspicious Classification
```

### Related Security Alert

When a matching alert is found, the interface displays:

```text
Alert Type
Severity
Risk Score
Description
Status
```

---

# 15. Event-to-Alert Correlation Logic

NetMonitor uses multiple conditions before associating an event with an alert.

The current correlation process checks:

```text
Source IP
       +
Time proximity
       +
Relevant event type
       +
Protocol
       +
Destination IP when available
```

For connection-oriented detections such as:

```text
Port Scan
Repeated Connection Attempts
High Connection Rate
Host Sweep
```

the system expects a TCP connection-attempt event.

This prevents unrelated UDP or ICMP traffic from being incorrectly classified as the source of those alerts.

The current association window is:

```text
10 seconds
```

between the event timestamp and alert detection time.

---

# 16. Network Topology

The Network section provides a visual representation of the monitored environment.

The topology is intended to help users understand:

```text
Known Assets
Network Relationships
Connected Hosts
Network Structure
```

The topology interface provides a visual security-oriented representation of the discovered environment.

---

# 17. Network Monitoring Configuration

The current implementation is configured around an authorized local network.

Example:

```text
Monitored Network:
192.168.1.0/24
```

Current components:

```text
Discovery Engine:
Nmap

Packet Collector:
Scapy

Backend:
FastAPI

Database:
SQLite + SQLAlchemy
```

---

# 18. Monitoring Controls

The Settings page provides controls for the packet collector.

Available actions:

```text
Start Collector
Stop Collector
```

Collector state:

```text
RUNNING
STOPPED
```

The frontend periodically checks collector state through the backend API.

This status is reflected across the interface, including the Settings, Network, and top navigation areas.

---

# 19. Detection Rule Management

Detection rules can be enabled or disabled from the Settings page.

Each rule displays:

```text
Rule Name
Severity
Description
Threshold
Detection Window
Risk Score
Enabled / Disabled State
```

This allows the operator to control which detection rules are active without modifying application source code.

---

# 20. Reports

NetMonitor provides security reporting based on current platform data.

The report can include:

```text
Network Events
Discovered Assets
Security Alerts
High Severity Alerts
New Alerts
Average Risk Score
Detection Breakdown
Alert Status Breakdown
```

The report is generated from current application data and can be exported through the browser's print/PDF workflow.

---

# 21. Technology Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
React Router
Recharts
Lucide React
React Flow / @xyflow
Axios
TanStack React Query
date-fns
```

## Backend

```text
Python
FastAPI
Uvicorn
SQLAlchemy
Scapy
Nmap integration
```

## Database

```text
SQLite
SQLAlchemy ORM
```

## Network Security / Monitoring Tools

```text
Nmap
Scapy
```

---

# 22. System Architecture

```text
                    ┌───────────────────────┐
                    │    Authorized LAN     │
                    │   192.168.1.0/24      │
                    └───────────┬───────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
        ┌────────────────┐          ┌──────────────────┐
        │      Nmap      │          │      Scapy       │
        │ Network        │          │ Packet/Event     │
        │ Discovery      │          │ Collection       │
        └───────┬────────┘          └─────────┬────────┘
                │                             │
                └─────────────┬───────────────┘
                              ▼
                   ┌─────────────────────┐
                   │    FastAPI Backend  │
                   │                     │
                   │ Event Processing    │
                   │ Asset Management    │
                   │ Detection Engine    │
                   │ Alert Management    │
                   │ Correlation          │
                   │ Statistics          │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ SQLite Database     │
                   │                     │
                   │ Assets              │
                   │ Events              │
                   │ Alerts              │
                   │ Detection Rules     │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │ React Web Dashboard  │
                   │                     │
                   │ Dashboard           │
                   │ Network             │
                   │ Assets              │
                   │ Alerts              │
                   │ Threat Detection    │
                   │ Events              │
                   │ Reports             │
                   │ Settings            │
                   └─────────────────────┘
```

---

# 23. Backend Architecture

The backend is organized around FastAPI routes, database models, security detection logic, and network collection.

Conceptual structure:

```text
backend/
│
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
│
└── routes/
    ├── assets.py
    ├── alerts.py
    ├── events.py
    ├── rules.py
    └── statistics.py
```

---

# 24. Frontend Architecture

The frontend follows a page/component structure.

Example:

```text
frontend/
│
├── src/
│   │
│   ├── api/
│   ├── types/
│   │
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── StatCard.tsx
│   │   ├── AlertTable.tsx
│   │   ├── NetworkChart.tsx
│   │   └── NetworkTopology.tsx
│   │
│   ├── layouts/
│   │   └── DashboardLayout.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Network.tsx
│   │   ├── Assets.tsx
│   │   ├── Alerts.tsx
│   │   ├── ThreatDetection.tsx
│   │   ├── Events.tsx
│   │   ├── Reports.tsx
│   │   └── Settings.tsx
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── vite.config.ts
└── index.css
```

---

# 25. Database Design

NetMonitor currently uses SQLite with SQLAlchemy ORM.

The major entities are:

```text
Assets
Network Events
Security Alerts
Detection Rules
```

---

## 25.1 Assets

Main fields include:

```text
id
ip
mac
hostname
vendor
status
first_seen
last_seen
```

---

## 25.2 Network Events

Main fields include:

```text
id
source_ip
destination_ip
source_port
destination_port
protocol
event_type
description
timestamp
```

---

## 25.3 Security Alerts

Main fields include:

```text
id
alert_type
severity
risk_score
source_ip
destination_ip
protocol
description
status
detected_at
resolved_at
```

---

## 25.4 Detection Rules

Main fields include:

```text
id
rule_name
rule_type
description
enabled
threshold
window_seconds
severity
risk_score
created_at
updated_at
```

---

# 26. API Reference

Base URL:

```text
http://127.0.0.1:8000
```

---

## Health

### GET `/api/health`

Checks backend availability.

Example response:

```json
{
  "status": "healthy"
}
```

---

# 27. Collector APIs

### GET `/api/collector/status`

Returns the current collector state.

### POST `/api/collector/start`

Starts the packet collector.

### POST `/api/collector/stop`

Requests the packet collector to stop.

---

# 28. Asset APIs

### GET `/api/assets/`

Returns the current asset inventory.

### POST `/api/assets/scan`

Runs network discovery.

Example:

```text
POST /api/assets/scan?target=192.168.1.0/24
```

---

# 29. Event APIs

### GET `/api/events/`

Returns recorded network events.

### POST `/api/events/`

Creates a network event and passes it through the configured detection logic.

---

# 30. Alert APIs

### GET `/api/alerts/`

Returns security alerts.

### GET `/api/alerts/{alert_id}`

Returns details for a specific alert.

### GET `/api/alerts/correlation/{source_ip}`

Returns correlated alert information for a source IP.

### PATCH `/api/alerts/{alert_id}/status`

Updates the status of an alert.

Supported statuses:

```text
NEW
INVESTIGATING
RESOLVED
FALSE_POSITIVE
```

---

# 31. Detection Rule APIs

### GET `/api/rules/`

Returns configured detection rules.

### GET `/api/rules/{rule_id}`

Returns details for a specific rule.

### PATCH `/api/rules/{rule_id}/toggle`

Enables or disables a detection rule.

---

# 32. Statistics API

### GET `/api/statistics/`

Returns summarized security statistics.

The response includes values such as:

```text
total_events
total_alerts
alert status counts
severity counts
alerts by type
events by type
average risk score
```

---

# 33. API Documentation

FastAPI automatically provides interactive API documentation.

After starting the backend, open:

```text
http://127.0.0.1:8000/docs
```

The documentation interface can be used to inspect and test the available API endpoints.

---

# 34. Installation Requirements

## Software Requirements

Recommended development environment:

```text
Windows 10 / Windows 11
Python 3.13+
Node.js
npm
Nmap
Npcap
Git
VS Code
```

Current project development environment was tested with:

```text
Python 3.13.7
Node.js 24.11.0
npm 11.6.1
Git 2.49.0
Nmap 7.991
Npcap 1.88
```

---

# 35. Backend Installation

Navigate to the backend directory:

```powershell
cd D:\NetMonitor\backend
```

Create the virtual environment:

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install fastapi "uvicorn[standard]" sqlalchemy scapy
```

Start the backend:

```powershell
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 36. Frontend Installation

Open a second terminal.

Navigate to:

```powershell
cd D:\NetMonitor\frontend
```

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

---

# 37. Production Build

The frontend can be compiled into a production build using:

```powershell
npm run build
```

The successful production build generates:

```text
dist/
```

The production build performs:

```text
TypeScript compilation
        +
Vite production bundling
```

---

# 38. Running NetMonitor

The standard development workflow is:

### Terminal 1

```powershell
cd D:\NetMonitor\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

### Terminal 2

```powershell
cd D:\NetMonitor\frontend
npm run dev
```

Then open the frontend URL provided by Vite.

---

# 39. Recommended Operational Workflow

For an authorized monitoring environment:

```text
1. Start backend
        ↓
2. Start frontend
        ↓
3. Open Settings
        ↓
4. Confirm backend health
        ↓
5. Run network discovery
        ↓
6. Review Assets
        ↓
7. Start Network Collector
        ↓
8. Observe Events
        ↓
9. Monitor Alerts
        ↓
10. Investigate suspicious activity
        ↓
11. Review correlated risk
        ↓
12. Generate Report
        ↓
13. Stop Collector when monitoring is complete
```

---

# 40. Testing Strategy

NetMonitor was tested through several functional and integration scenarios.

## 40.1 Backend Tests

Verified:

```text
Backend health endpoint
API availability
Database connectivity
Collector start
Collector stop
Detection rule retrieval
Detection rule toggling
Asset scanning
Asset persistence
Alert creation
Event creation
Alert status updates
Alert correlation
Statistics generation
```

---

# 41. Detection Testing

All five configured detection rules were tested independently.

Tested detections:

```text
Possible Port Scan
Repeated Connection Attempts
Possible Host Sweep
High Connection Rate
Unknown Device
```

The system generated the corresponding alert types using the configured thresholds and risk values.

---

# 42. Asset Testing

Network discovery was tested against the authorized local network.

Example:

```text
192.168.1.0/24
```

The system successfully discovered network hosts and stored the resulting asset information.

Duplicate asset verification also confirmed that duplicate IP entries were not created.

---

# 43. Collector Testing

The packet collector was tested through the web interface.

The following workflow was verified:

```text
STOPPED
   ↓
Start Collector
   ↓
RUNNING
   ↓
Network events increase
   ↓
Stop Collector
   ↓
STOPPED
```

The collector was also verified to stop cleanly after its current packet-capture cycle.

---

# 44. Alert Workflow Testing

Alert management was tested using:

```text
NEW
   ↓
INVESTIGATING
   ↓
RESOLVED
```

and:

```text
NEW
   ↓
FALSE_POSITIVE
```

The alert counters updated after status changes.

False-positive alerts were excluded from the Events page's Security Alerts count according to the current implementation.

---

# 45. Investigation Testing

Alert investigation was tested with live generated detection data.

The investigation interface successfully displayed:

```text
Alert Type
Risk Score
Severity
Source
Destination
Protocol
Status
Detection Reason
Related Events
Correlated Alerts
Correlated Risk
```

Event investigation was also tested by opening individual network events and checking their relationship with generated alerts.

---

# 46. Correlation Testing

Alert correlation was verified using multiple alerts originating from the same source.

The investigation interface displayed:

```text
Related security alerts
Unique alert types
Correlated risk
Recent source events
```

The correlation score is capped at:

```text
100/100
```

---

# 47. Frontend Testing

The following pages were manually tested:

```text
Dashboard
Network
Assets
Alerts
Threat Detection
Events
Reports
Settings
```

The following functionality was tested:

```text
Navigation
API data loading
Statistics
Filtering
Search
Investigation modals
Collector controls
Rule toggles
Alert status actions
Reports
PDF export
Loading states
Empty states
Error states
```

---

# 48. Production Build Validation

The frontend production build was successfully validated.

The latest successful build completed with:

```text
TypeScript compilation: PASS
Vite production build: PASS
Modules transformed: 2592
Build generated: dist/
```

The build also reports a chunk-size optimization warning because one generated JavaScript bundle is larger than the default warning threshold.

This is a performance optimization consideration and does not prevent the production build from completing.

---

# 49. Example Live Monitoring Result

During live testing, NetMonitor successfully captured network activity including:

```text
TCP connection attempts
UDP traffic
ICMP activity
```

The event explorer displayed source and destination addresses, ports, protocols, timestamps, and event descriptions.

Live traffic also demonstrated that threshold-based rules can generate alerts during normal application/network activity. This highlights the importance of investigation and false-positive handling in a rule-based monitoring system.

---

# 50. Security Considerations

NetMonitor should only be used in environments where monitoring and scanning are authorized.

Recommended security practices include:

* Monitor only owned or explicitly authorized networks.
* Protect access to the NetMonitor server.
* Restrict access to captured network data.
* Use secure credentials when authentication is added.
* Avoid exposing the development API directly to the public internet.
* Protect generated reports because they may contain sensitive network information.
* Restrict administrator functionality to authorized personnel.
* Log important administrative actions in production deployments.

---

# 51. Current Limitations

The current version is a focused network monitoring and rule-based detection platform.

Known limitations include:

## 51.1 Local Monitoring Focus

The current implementation is designed around an authorized local monitoring network.

---

## 51.2 Rule-Based Detection

The current detection engine is primarily threshold and rule based.

It does not currently provide a complete machine-learning anomaly-detection pipeline.

---

## 51.3 Limited Protocol Analysis

Current packet event classification focuses on selected network activities such as:

```text
TCP connection attempts
UDP traffic
ICMP echo requests
```

Deep protocol inspection is outside the current implementation scope.

---

## 51.4 Local Database

SQLite is suitable for the current implementation and development environment, but large-scale enterprise deployments would generally require a more scalable database architecture.

---

## 51.5 Single Collector Architecture

The current platform is built around a local collector rather than a distributed multi-sensor architecture.

---

## 51.6 No Full Enterprise SIEM Features

NetMonitor is not intended to replace enterprise SIEM products.

It does not attempt to provide the full scope of:

```text
Mass-scale centralized log management
Enterprise-wide log ingestion
Complete compliance management
Full endpoint detection and response
Enterprise identity security
Full SOAR automation
```

---

# 52. Future Enhancements

NetMonitor can be extended into a broader security platform.

Potential future features include:

## 52.1 AI-Based Anomaly Detection

Introduce machine-learning models for:

```text
Behavioral anomaly detection
Unusual traffic identification
Adaptive risk scoring
Network behavior profiling
Predictive security alerts
```

Potential technologies:

```text
Scikit-learn
Isolation Forest
XGBoost
Neural Networks
LLM-assisted analysis
```

---

## 52.2 Threat Intelligence Integration

Add integrations with threat-intelligence sources to enrich:

```text
IP addresses
Domains
URLs
Indicators of Compromise
Known malicious infrastructure
```

---

## 52.3 IDS/IPS Integration

Possible integrations:

```text
Suricata
Zeek
Snort
```

This would allow NetMonitor to ingest richer network-security telemetry.

---

## 52.4 Wazuh Integration

Future integration with Wazuh could allow NetMonitor to combine network-security observations with endpoint and host-security telemetry.

---

## 52.5 Firewall Integration

Integrations with firewall logs could provide additional context for:

```text
Blocked connections
Allowed connections
Policy violations
Repeated denied traffic
```

---

## 52.6 Distributed Sensors

Future architecture could support:

```text
Sensor 1 ─┐
Sensor 2 ─┤
Sensor 3 ─┼──► Central NetMonitor Server
Sensor 4 ─┤
Sensor 5 ─┘
```

This would allow monitoring across multiple network segments.

---

## 52.7 Scalable Database

For larger deployments:

```text
SQLite
   ↓
PostgreSQL
```

could be used to support larger data volumes and concurrent users.

---

## 52.8 Multi-Tenant SaaS Architecture

A future commercial version could support:

```text
Organization
   │
   ├── Users
   ├── Networks
   ├── Assets
   ├── Alerts
   ├── Sensors
   └── Reports
```

with tenant isolation and subscription-based deployment.

---

## 52.9 Notification System

Future notifications could include:

```text
Email
SMS
Slack
Microsoft Teams
Webhook
Mobile Push Notifications
```

---

## 52.10 Advanced Access Control

Future enterprise versions could implement:

```text
Administrator
Security Analyst
Network Administrator
Auditor
Read-Only User
```

with role-based access control.

---

# 53. Product Evolution

NetMonitor can evolve from a focused network monitoring platform into a broader security operations product.

Possible evolution:

```text
Current
│
├── Asset Discovery
├── Network Events
├── Rule-Based Detection
├── Alerts
├── Investigation
└── Reporting
│
▼
Next
│
├── Threat Intelligence
├── IDS/IPS Integration
├── Wazuh Integration
├── Advanced Analytics
└── AI-Assisted Detection
│
▼
Future
│
├── Distributed Sensors
├── PostgreSQL
├── Multi-Tenant Architecture
├── Cloud Deployment
├── Role-Based Access Control
└── SaaS Platform
```

---

# 54. Commercial Product Direction

NetMonitor is designed around a product architecture that can potentially be expanded beyond a university project.

A future commercial deployment could target:

```text
Universities
Schools
Small and Medium Businesses
Enterprises
Government Organizations
IT Departments
Security Operations Teams
Managed Security Service Providers
```

Potential subscription structure could later include:

```text
Starter
Professional
Enterprise
```

with differences based on:

```text
Number of monitored assets
Retention period
Number of sensors
Advanced detections
Threat intelligence
User accounts
Reports
Notifications
Integrations
```

These commercial features are future product concepts and are not part of the current implementation.

---

# 55. Project Pages

Current frontend routes include:

| Page             | Route       | Purpose                                  |
| ---------------- | ----------- | ---------------------------------------- |
| Dashboard        | `/`         | Overall security overview                |
| Network          | `/network`  | Network monitoring and topology          |
| Assets           | `/assets`   | Asset discovery and inventory            |
| Alerts           | `/alerts`   | Security alert management                |
| Threat Detection | `/threats`  | Detection rule monitoring                |
| Events           | `/events`   | Network event explorer and investigation |
| Reports          | `/reports`  | Security reporting                       |
| Settings         | `/settings` | System and collector configuration       |

---

# 56. Demo Flow

A recommended project demonstration flow is:

```text
1. Open NetMonitor
        ↓
2. Dashboard
        ↓
3. Network Discovery
        ↓
4. Review Assets
        ↓
5. Start Collector
        ↓
6. Generate authorized network activity
        ↓
7. Open Events
        ↓
8. Observe TCP / UDP / ICMP events
        ↓
9. Detection Engine identifies a pattern
        ↓
10. Security Alert is generated
        ↓
11. Open Alert Investigation
        ↓
12. Review Risk & Correlation
        ↓
13. Review Related Events
        ↓
14. Update Alert Status
        ↓
15. Open Reports
        ↓
16. Generate PDF Report
        ↓
17. Stop Collector
```

---

# 57. Example Security Investigation

Example workflow:

```text
Source:
192.168.1.2

Destination:
172.16.54.249

Protocol:
TCP

Behavior:
Repeated connection attempts

Observed Attempts:
5

Detection Window:
60 seconds

Rule:
REPEATED_CONNECTION_ATTEMPTS

Severity:
MEDIUM

Rule Risk:
55/100
```

The analyst can then:

```text
Review Event
      ↓
Review Alert
      ↓
Review Related Events
      ↓
Review Other Source Alerts
      ↓
Review Correlated Risk
      ↓
Classify Alert
```

This demonstrates the relationship between:

```text
Network Activity
      ↓
Event
      ↓
Detection
      ↓
Alert
      ↓
Correlation
      ↓
Investigation
```

---

# 58. Why NetMonitor Is Different From a Basic Network Scanner

A basic network scanner primarily focuses on discovery.

NetMonitor extends beyond discovery by combining:

```text
Discovery
    +
Asset Inventory
    +
Continuous Event Collection
    +
Threat Detection
    +
Security Alerts
    +
Risk Scoring
    +
Correlation
    +
Investigation
    +
Reporting
```

Therefore, the primary purpose of NetMonitor is not simply to identify hosts; it is to provide an operational network-security monitoring workflow.

---

# 59. Why NetMonitor Is Not a SIEM Replacement

A SIEM generally focuses on large-scale collection, centralized storage, searching, correlation, and analysis of security logs and events from many sources.

NetMonitor has a narrower scope.

Its primary focus is:

```text
Network Discovery
Network Activity
Network Security Events
Focused Threat Detection
Alert Investigation
Network Security Reporting
```

NetMonitor can potentially integrate with SIEM, IDS/IPS, endpoint-security, and firewall platforms in future versions.

The intended relationship is:

```text
Network Security Monitoring
          │
          ▼
      NetMonitor
          │
          ├────► SIEM
          ├────► Wazuh
          ├────► Zeek
          ├────► Suricata
          └────► Firewall
```

---

# 60. Development Status

Current implementation status:

| Component               | Status    |
| ----------------------- | --------- |
| React frontend          | Completed |
| FastAPI backend         | Completed |
| SQLite database         | Completed |
| Nmap discovery          | Completed |
| Asset inventory         | Completed |
| Scapy packet collector  | Completed |
| Event storage           | Completed |
| Detection engine        | Completed |
| Five detection rules    | Completed |
| Alert management        | Completed |
| Alert correlation       | Completed |
| Risk scoring            | Completed |
| Event investigation     | Completed |
| Alert investigation     | Completed |
| Network topology        | Completed |
| Statistics              | Completed |
| Reports                 | Completed |
| PDF export              | Completed |
| Collector Start/Stop    | Completed |
| Detection-rule toggling | Completed |
| Production build        | Passed    |

---

# 61. Final Validation Summary

NetMonitor has been functionally tested across its major workflows.

Validated areas include:

```text
Backend health
Frontend operation
Network discovery
Asset inventory
Packet collection
Network event creation
Detection rules
Alert generation
Alert investigation
Event investigation
Risk calculation
Alert correlation
Alert status workflow
False-positive workflow
Statistics
Dashboard synchronization
Network status synchronization
Reports
PDF export
Production build
```

The current frontend production build completes successfully.

---

# 62. Project Security Principle

NetMonitor follows a defensive-security-first approach.

The platform is intended to help authorized security teams:

```text
Observe
    ↓
Detect
    ↓
Investigate
    ↓
Understand
    ↓
Report
```

rather than perform unauthorized offensive activity.

---

# 63. License

This project can be distributed under the license selected by the project owner.

Example:

```text
Copyright © 2026 NetMonitor Project

All rights reserved unless otherwise specified.
```

Replace this section with the final license before public distribution.

---

# 64. Disclaimer

NetMonitor is a network-security monitoring and defensive analysis platform.

It should only be used on:

```text
Networks you own
Networks you administer
Networks where you have explicit authorization to monitor
```

The project should not be used for unauthorized scanning, surveillance, interception, or security testing.

---

# 65. Project Summary

NetMonitor is a focused web-based network security monitoring platform that brings together:

```text
Nmap
   +
Scapy
   +
FastAPI
   +
SQLite
   +
React
   +
TypeScript
   +
Detection Rules
   +
Risk Scoring
   +
Alert Correlation
   +
Investigation
   +
Reporting
```

into one security-focused product.

Its current architecture establishes a foundation for expanding toward:

```text
AI-assisted detection
Threat intelligence
IDS/IPS integration
Wazuh integration
Distributed monitoring
Scalable databases
Cloud deployment
Multi-tenant architecture
SaaS delivery
```

---

# 66. Quick Start

```powershell
# Terminal 1 - Backend
cd D:\NetMonitor\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

```powershell
# Terminal 2 - Frontend
cd D:\NetMonitor\frontend
npm run dev
```

Open:

```text
http://localhost:5173
```

Backend API:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

Production build:

```powershell
npm run build
```

---

# 67. NetMonitor at a Glance

```text
┌─────────────────────────────────────────────────────┐
│                    NETMONITOR                       │
│ Network Security Monitoring & Threat Detection      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Network Discovery                                  │
│        ↓                                            │
│  Asset Inventory                                    │
│        ↓                                            │
│  Live Packet Monitoring                             │
│        ↓                                            │
│  Network Events                                     │
│        ↓                                            │
│  Detection Engine                                   │
│        ↓                                            │
│  Security Alerts                                    │
│        ↓                                            │
│  Risk Scoring                                       │
│        ↓                                            │
│  Alert Correlation                                  │
│        ↓                                            │
│  Investigation                                      │
│        ↓                                            │
│  Reporting                                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

# NetMonitor

### Network Security Monitoring & Threat Detection Platform

**Focus:** Defensive Cybersecurity
**Platform:** Web Application
**Frontend:** React + TypeScript
**Backend:** FastAPI + Python
**Database:** SQLite + SQLAlchemy
**Discovery:** Nmap
**Packet Monitoring:** Scapy
**Detection:** Configurable Rule-Based Engine
**Status:** Functional Prototype / Product Foundation
**Year:** 2026
