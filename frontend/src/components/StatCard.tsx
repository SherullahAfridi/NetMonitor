import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  danger?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  danger = false,
}: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div
          className={`p-2 rounded-lg ${
            danger ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
          }`}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-2xl font-bold text-white">{value}</h2>

        <p className="mt-1 text-xs text-slate-500">{change}</p>
      </div>
    </div>
  );
}