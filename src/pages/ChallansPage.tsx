import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VIOLATION_LABELS, STATUS_COLORS, formatDate, formatCurrency } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

const ChallansPage = () => {
  const [challans, setChallans] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("challans").select("*").order("created_at", { ascending: false });
      setChallans(data ?? []);
    };
    fetch();
  }, []);

  const downloadChallan = (challan: any) => {
    // Generate a simple text-based challan for demo
    const content = `
========================================
        TRAFFIC VIOLATION CHALLAN
========================================

Challan ID: ${challan.id.slice(0, 8).toUpperCase()}
Date: ${formatDate(challan.issued_at)}

Owner: ${challan.owner_name}
Vehicle: ${challan.vehicle_number}
Violation: ${VIOLATION_LABELS[challan.violation_type] ?? challan.violation_type}

Fine Amount: ${formatCurrency(challan.fine_amount)}
Status: ${challan.status.toUpperCase()}

========================================
    AI Traffic Violation Management
           TrafficAI System
========================================
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `challan-${challan.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Challans</h1>
        <p className="text-sm text-muted-foreground mt-1">Generated violation challans</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left p-3 font-medium">Challan ID</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Vehicle</th>
                <th className="text-left p-3 font-medium">Violation</th>
                <th className="text-left p-3 font-medium">Fine</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Issued</th>
                <th className="text-left p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No challans generated yet</td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-primary">{c.id.slice(0, 8).toUpperCase()}</td>
                    <td className="p-3 text-foreground">{c.owner_name}</td>
                    <td className="p-3 font-mono text-xs">{c.vehicle_number}</td>
                    <td className="p-3">{VIOLATION_LABELS[c.violation_type] ?? c.violation_type}</td>
                    <td className="p-3 font-semibold text-foreground">{formatCurrency(c.fine_amount)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[c.status])}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(c.issued_at)}</td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => downloadChallan(c)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
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

export default ChallansPage;
