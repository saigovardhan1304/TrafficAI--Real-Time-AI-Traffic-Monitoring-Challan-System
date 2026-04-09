import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { VIOLATION_LABELS, STATUS_COLORS, formatDate, FINE_AMOUNTS, formatCurrency } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, FileText, Download, ShieldAlert } from "lucide-react";

const ViolationsPage = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const [violations, setViolations] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchViolations = async () => {
    let query = supabase.from("violations").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setViolations(data ?? []);
  };

  useEffect(() => {
    fetchViolations();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("violations").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Violation ${status}` });
      fetchViolations();
    }
  };

  const generateChallan = async (violation: any) => {
    // Find vehicle owner
    let ownerName = "Unknown";
    if (violation.vehicle_id) {
      const { data: vehicle } = await supabase.from("vehicles").select("owner_name").eq("id", violation.vehicle_id).maybeSingle();
      ownerName = vehicle?.owner_name ?? "Unknown";
    }

    const { error } = await supabase.from("challans").insert({
      violation_id: violation.id,
      owner_name: ownerName,
      vehicle_number: violation.plate_number ?? "Unknown",
      violation_type: violation.violation_type,
      fine_amount: FINE_AMOUNTS[violation.violation_type] ?? 1000,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } else {
      toast({ title: "Challan Generated", description: `Challan created for ${violation.plate_number}` });
      return true;
    }
  };

  const confirmAndGenerate = async (violation: any) => {
    const ok = await generateChallan(violation);
    if (ok) {
      await updateStatus(violation.id, "confirmed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Violations</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage detected violations</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground bg-muted/30">
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Plate Number</th>
                <th className="text-left p-3 font-medium">Confidence</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Detected At</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No violations found</td>
                </tr>
              ) : (
                violations.map((v) => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-medium text-foreground">{VIOLATION_LABELS[v.violation_type]}</td>
                    <td className="p-3 font-mono text-xs text-primary">{v.plate_number || "—"}</td>
                    <td className="p-3">{v.confidence}%</td>
                    <td className="p-3 text-muted-foreground text-xs">{v.location || "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn("text-xs capitalize", STATUS_COLORS[v.status])}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(v.detected_at)}</td>
                    <td className="p-3">
                      {v.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-7 text-xs gap-1 bg-success hover:bg-success/90" 
                            onClick={() => confirmAndGenerate(v)}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Generate Challan
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => updateStatus(v.id, "dismissed")}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {v.status === "confirmed" && role === "admin" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => generateChallan(v)}>
                          <FileText className="w-3 h-3" /> Challan
                        </Button>
                      )}
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

export default ViolationsPage;
