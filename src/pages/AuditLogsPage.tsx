import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      setLogs(data ?? []);
    };
    fetch();
  }, []);

  const exportCSV = () => {
    const header = "ID,Action,Details,Created At\n";
    const rows = logs.map((l) => `${l.id},"${l.action}","${JSON.stringify(l.details)}",${l.created_at}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">System action history</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2" disabled={logs.length === 0}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Details</th>
                <th className="text-left p-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">No audit logs recorded yet</td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{l.action}</td>
                    <td className="p-3 text-xs text-muted-foreground font-mono max-w-xs truncate">{JSON.stringify(l.details)}</td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(l.created_at)}</td>
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

export default AuditLogsPage;
