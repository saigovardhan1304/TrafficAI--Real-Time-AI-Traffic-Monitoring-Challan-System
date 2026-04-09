import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car } from "lucide-react";

const VehicleSearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const fetchVehicles = async (searchQuery: string = "") => {
    let q = supabase.from("vehicles").select("*").order("created_at", { ascending: false });
    
    if (searchQuery) {
        q = q.ilike("plate_number", `%${searchQuery}%`);
    }

    const { data } = await q;
    setResults(data ?? []);
  };

  useEffect(() => {
    // Auto-populate on mount
    fetchVehicles();
  }, []);

  const handleSearch = async () => {
    setSearched(true);
    await fetchVehicles(query);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registered Vehicles</h1>
        <p className="text-sm text-muted-foreground mt-1">Database of all registered vehicles</p>
      </div>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Enter plate number (e.g. MH01)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" /> Search
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No vehicles found in database</p>
        ) : (
          results.map((v) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-primary">{v.plate_number}</p>
                  <p className="text-xs text-muted-foreground">Registered Vehicle</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="text-foreground font-medium">{v.owner_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile</span>
                  <span className="text-foreground">{v.registered_mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-foreground text-right text-xs max-w-[200px]">{v.address}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VehicleSearchPage;
