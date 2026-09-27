import type { ReactNode } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-white flex">
      {/* ================================================== */}
      {/* Sidebar */}
      {/* ================================================== */}

      <Sidebar />

      {/* ================================================== */}
      {/* Main Application Area */}
      {/* ================================================== */}

      <div className="flex-1 min-w-0 min-h-screen">
        {/* Top Navigation */}

        <Topbar />

        {/* Page Content */}

        <main className="min-w-0 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}