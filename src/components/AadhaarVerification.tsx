import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCheck, ShieldCheck, ScanFace, Database } from "lucide-react";

interface AadhaarVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  plateNumber: string;
  isFaceScan?: boolean;
  onVerify: () => void;
}

const AadhaarVerification = ({ isOpen, onClose, plateNumber, isFaceScan, onVerify }: AadhaarVerificationProps) => {
  const [step, setStep] = useState<"scanning" | "matched" | "unauthorized">("scanning");

  useEffect(() => {
    if (isOpen) {
      setStep("scanning");
      const timer = setTimeout(() => {
        setStep("matched");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-border bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {isFaceScan ? "Aadhaar Face Biometric Match" : "Vehicle Record Verification"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {step === "scanning" ? (
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 rounded-full border-2 border-primary/20 overflow-hidden mx-auto bg-muted/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  {isFaceScan ? (
                    <ScanFace className="w-16 h-16 text-primary/50 animate-pulse" />
                  ) : (
                    <Database className="w-14 h-14 text-muted-foreground/40" />
                  )}
                </div>
                {/* Scanner bar */}
                <div className="absolute w-full h-1 bg-primary/80 scan-line" />
                
                {/* Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
                      backgroundSize: '10px 10px',
                    }}
                />
              </div>
              <p className="text-sm font-mono text-primary animate-pulse tracking-widest">
                {isFaceScan ? "SCANNING FACE & MATCHING AADHAAR..." : "QUERYING VEHICLE DATABASE..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFaceScan ? "Running biometric cross-reference" : `Matching against Registration No: ${plateNumber}`}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6 animate-fade-in w-full">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden relative">
                   {isFaceScan ? (
                     <>
                      <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Face Match" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-success rounded-lg" />
                     </>
                   ) : (
                     <UserCheck className="w-10 h-10 text-primary" />
                   )}
                </div>
                <div className="text-left space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    {isFaceScan ? "Aadhaar Biometric Match" : "Aadhaar Linked Owner"}
                  </p>
                  <p className="text-sm font-bold text-foreground">Rajesh Khurana</p>
                  <p className="text-[10px] font-mono text-primary">UID: XXXX XXXX 1234</p>
                  <p className="text-[10px] text-muted-foreground">Match Confidence: {isFaceScan ? '99.4%' : 'Verified'}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-xs hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={onVerify}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-background text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Confirm Registration
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AadhaarVerification;
