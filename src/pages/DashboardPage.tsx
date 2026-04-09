import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";
import { VIOLATION_LABELS, STATUS_COLORS, formatDate } from "@/lib/constants";
import { AlertTriangle, FileText, Clock, CheckCircle, XCircle, Activity, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import DashboardCharts from "@/components/DashboardCharts";
import SystemStatus from "@/components/SystemStatus";
import SeedData from "@/components/SeedData";

const DashboardPage = () => {
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, dismissed: 0, challans: 0 });
  const [recentViolations, setRecentViolations] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: violations } = await supabase.from("violations").select("*").order("created_at", { ascending: false }).limit(10);
      const { count: total } = await supabase.from("violations").select("*", { count: "exact", head: true });
      const { count: pending } = await supabase.from("violations").select("*", { count: "exact", head: true }).eq("status", "pending");
      const { count: confirmed } = await supabase.from("violations").select("*", { count: "exact", head: true }).eq("status", "confirmed");
      const { count: dismissed } = await supabase.from("violations").select("*", { count: "exact", head: true }).eq("status", "dismissed");
      const { count: challans } = await supabase.from("challans").select("*", { count: "exact", head: true });

      setStats({
        total: total ?? 0,
        pending: pending ?? 0,
        confirmed: confirmed ?? 0,
        dismissed: dismissed ?? 0,
        challans: challans ?? 0,
      });
      setRecentViolations(violations ?? []);
    };

    fetchData();

    // Realtime subscription
    const violationsChannel = supabase
      .channel("violations-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => fetchData())
      .subscribe();

    const challansChannel = supabase
      .channel("challans-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "challans" }, () => fetchData())
      .subscribe();

    return () => { 
      supabase.removeChannel(violationsChannel); 
      supabase.removeChannel(challansChannel);
    };
  }, []);

  return (
    <div className="space-y-6 relative pb-10">
      {/* Decorative gradients */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Control Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time infrastructure and violation monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SeedData />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/20 border border-border/50 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-muted-foreground">Live Monitoring Active</span>
            <span className="text-foreground ml-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Violations" value={stats.total} icon={<AlertTriangle className="w-5 h-5" />} variant="default" />
        <StatCard title="Pending Review" value={stats.pending} icon={<Clock className="w-5 h-5" />} variant="warning" />
        <StatCard title="Confirmed" value={stats.confirmed} icon={<CheckCircle className="w-5 h-5" />} variant="success" />
        <StatCard title="Dismissed" value={stats.dismissed} icon={<XCircle className="w-5 h-5" />} variant="default" />
        <StatCard title="Challans Issued" value={stats.challans} icon={<FileText className="w-5 h-5" />} variant="danger" />
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <DashboardCharts />
        <SystemStatus />
      </div>

      {/* Recent Violations */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Incident Log</h2>
          </div>
          <button className="text-xs text-primary hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/20">
                <th className="text-left p-3 font-medium">Violation Type</th>
                <th className="text-left p-3 font-medium">Registration No.</th>
                <th className="text-left p-3 font-medium">Confidence</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentViolations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <Activity className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                    No recent incidents detected.
                  </td>
                </tr>
              ) : (
                recentViolations.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{VIOLATION_LABELS[v.violation_type] ?? v.violation_type}</span>
                        <span className="text-[10px] text-muted-foreground">{v.location || "Camera 01"}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-xs text-primary font-bold">{v.plate_number || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${v.confidence}%` }} />
                        </div>
                        <span>{v.confidence}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-tight px-2 py-0 h-5", STATUS_COLORS[v.status])}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(v.detected_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
