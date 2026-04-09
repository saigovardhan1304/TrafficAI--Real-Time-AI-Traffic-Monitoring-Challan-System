import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SAMPLE_VEHICLES = [
  { plate_number: "KA01MA1111", owner_name: "Rahul Sharma", registered_mobile: "9876543210", address: "123, MG Road, Bangalore" },
  { plate_number: "MH12AB2222", owner_name: "Priya Patel", registered_mobile: "9876543211", address: "45, Marine Drive, Mumbai" },
  { plate_number: "DL3CA3333", owner_name: "Amit Kumar", registered_mobile: "9876543212", address: "Sector 15, Gurgaon, Delhi" },
  { plate_number: "TN07BZ4444", owner_name: "Suresh Raina", registered_mobile: "9876543213", address: "Anna Nagar, Chennai" },
  { plate_number: "WB02X5555", owner_name: "Ananya Roy", registered_mobile: "9876543214", address: "Salt Lake, Kolkata" },
];

const SeedData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const handleSeed = async () => {
    setLoading(true);
    try {
      // 1. Seed Vehicles
      const vehiclesToSeed = SAMPLE_VEHICLES.map((v, i) => i === 0 && user ? { ...v, owner_id: user.id } : v);
      const { error: vehicleError } = await supabase.from("vehicles").upsert(vehiclesToSeed, { onConflict: 'plate_number' });
      if (vehicleError) throw vehicleError;

      // 2. Seed some violations
      const { data: vehicles } = await supabase.from("vehicles").select("id, plate_number");
      if (vehicles && vehicles.length > 0) {
        const sampleViolations = [
          {
            violation_type: "helmet_violation",
            vehicle_id: vehicles[0].id,
            plate_number: vehicles[0].plate_number,
            confidence: 94,
            status: "pending",
            location: "Junction A - North",
          },
          {
            violation_type: "triple_riding",
            vehicle_id: vehicles[1].id,
            plate_number: vehicles[1].plate_number,
            confidence: 88,
            status: "confirmed",
            location: "Main Street - East",
          }
        ];
        await supabase.from("violations").upsert(sampleViolations);
      }

      toast({ title: "Database Seeded", description: "Sample vehicles and violations have been added." });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Seeding Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading} 
      variant="outline" 
      size="sm" 
      className="gap-2 border-primary/20 hover:bg-primary/10"
    >
      <Database className="w-4 h-4" />
      {loading ? "Seeding..." : "Seed Sample Data"}
    </Button>
  );
};

export default SeedData;
