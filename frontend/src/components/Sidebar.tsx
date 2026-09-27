import {
  LayoutDashboard,
  Network,
  Monitor,
  Bell,
  ShieldAlert,
  Activity,
  FileText,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Network", icon: Network, path: "/network" },
  { label: "Assets", icon: Monitor, path: "/assets" },
  { label: "Alerts", icon: Bell, path: "/alerts" },
  { label: "Threat Detection", icon: ShieldAlert, path: "/threats" },
  { label: "Events", icon: Activity, path: "/events" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-950 border-r border-slate-800 text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white">NetMonitor</h1>
          <p className="text-xs text-slate-500">Security Operations</p>
        </div>
      </div>

      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-blue-500/10 text-blue-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}