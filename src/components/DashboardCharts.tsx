import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity } from "lucide-react";

// Helper to format Date to 'Mon', 'Tue' etc.
const getDayName = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
};

const DashboardCharts = () => {
  const [data, setData] = useState<{ name: string; violations: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      // Get the date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: violations } = await supabase
        .from("violations")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (!violations || violations.length === 0) {
        // Fallback or empty state
        const emptyDays = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          emptyDays.push({ name: getDayName(d.toISOString()), violations: 0 });
        }
        setData(emptyDays);
      } else {
        // Group by day Name
        const grouped: Record<string, number> = {};
        
        // Initialize last 7 days to 0 to ensure continuous graph
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          grouped[getDayName(d.toISOString())] = 0;
        }

        // Count violations per day
        violations.forEach((v) => {
          const dayName = getDayName(v.created_at);
          if (grouped[dayName] !== undefined) {
             grouped[dayName] += 1;
          }
        });

        const formattedData = Object.keys(grouped).map(key => ({
          name: key,
          violations: grouped[key]
        }));
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchChartData();

    const channel = supabase
      .channel("chart-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "violations" }, () => fetchChartData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
  return (
    <Card className="col-span-1 lg:col-span-3 border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Violation Trends</span>
          <span className="text-xs font-normal text-muted-foreground">Last 7 Days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {loading ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                 <Activity className="w-6 h-6 animate-pulse" />
                 <span className="text-xs">Loading Live Data...</span>
              </div>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-card)'
                  }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="violations" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorViolations)" 
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;
