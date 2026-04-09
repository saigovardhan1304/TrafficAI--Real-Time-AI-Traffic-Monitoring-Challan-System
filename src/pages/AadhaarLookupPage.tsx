import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, ShieldCheck, AlertCircle } from "lucide-react";

// Simulated Aadhaar database
const MOCK_AADHAAR: Record<string, { name: string; dob: string; gender: string; address: string; photo: string }> = {
  "1234-5678-9012": { name: "Rajesh Kumar", dob: "15-03-1985", gender: "Male", address: "123 MG Road, Mumbai", photo: "RK" },
  "2345-6789-0123": { name: "Priya Sharma", dob: "22-07-1990", gender: "Female", address: "45 Connaught Place, Delhi", photo: "PS" },
  "3456-7890-1234": { name: "Suresh Reddy", dob: "08-11-1978", gender: "Male", address: "78 Brigade Road, Bangalore", photo: "SR" },
  "4567-8901-2345": { name: "Lakshmi Iyer", dob: "30-01-1992", gender: "Female", address: "12 Anna Salai, Chennai", photo: "LI" },
  "5678-9012-3456": { name: "Amit Singh", dob: "14-06-1988", gender: "Male", address: "56 Hazratganj, Lucknow", photo: "AS" },
};

const AadhaarLookupPage = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<(typeof MOCK_AADHAAR)[string] | null>(null);
  const [searched, setSearched] = useState(false);
  const [confidence, setConfidence] = useState(0);

  const handleLookup = () => {
    setSearched(true);
    const found = MOCK_AADHAAR[query.trim()];
    if (found) {
      setResult(found);
      setConfidence(Math.floor(Math.random() * 10 + 90));
    } else {
      setResult(null);
      setConfidence(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aadhaar Lookup</h1>
        <p className="text-sm text-muted-foreground mt-1">Simulated identity verification (Demo Only)</p>
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Simulated Data Only</p>
          <p className="text-xs text-muted-foreground mt-1">
            This is a demo simulation. No real government database is accessed. Try: 1234-5678-9012
          </p>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Enter Aadhaar number (e.g. 1234-5678-9012)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
        />
        <Button onClick={handleLookup} className="gap-2">
          <Search className="w-4 h-4" /> Lookup
        </Button>
      </div>

      {searched && (
        result ? (
          <div className="max-w-md rounded-xl border border-success/30 bg-card p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span className="text-sm font-semibold text-success">Identity Verified</span>
              <Badge variant="outline" className="ml-auto text-xs bg-success/10 text-success border-success/20">
                {confidence}% match
              </Badge>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {result.photo}
              </div>
              <div>
                <p className="font-semibold text-foreground">{result.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{query}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span className="text-foreground">{result.dob}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span className="text-foreground">{result.gender}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-foreground text-right text-xs max-w-[200px]">{result.address}</span></div>
            </div>
          </div>
        ) : (
          <div className="max-w-md rounded-xl border border-destructive/30 bg-card p-6 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
            <UserCheck className="w-10 h-10 text-destructive/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No match found for this Aadhaar number</p>
          </div>
        )
      )}
    </div>
  );
};

export default AadhaarLookupPage;
