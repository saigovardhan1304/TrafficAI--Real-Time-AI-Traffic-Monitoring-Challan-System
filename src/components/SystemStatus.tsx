import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Database, ShieldCheck, Cpu } from "lucide-react";

const SystemStatus = () => {
  const statuses = [
    { name: "Main API Node", status: "Online", icon: Server, color: "text-primary" },
    { name: "Database Cluster", status: "Stable", icon: Database, color: "text-primary" },
    { name: "AI Inference Engine", status: "Active", icon: Cpu, color: "text-primary" },
    { name: "Security Protocols", status: "Enforced", icon: ShieldCheck, color: "text-primary" },
  ];

  return (
    <Card className="col-span-1 lg:col-span-2 border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statuses.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md bg-muted/50 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-foreground">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.status}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
