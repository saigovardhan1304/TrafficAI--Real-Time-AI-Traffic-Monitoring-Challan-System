import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, CameraOff, AlertTriangle, Shield, Phone, Users, Upload, Loader2, Play } from "lucide-react";
import { VIOLATION_LABELS, FINE_AMOUNTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import AadhaarVerification from "@/components/AadhaarVerification";

const VIOLATION_TYPES = ["triple_riding", "mobile_usage", "helmet_violation"] as const;
const DEMO_PLATES = ["MH01AB1234", "DL02CD5678", "KA03EF9012", "UNKNOWN", "TN04GH3456", "UNKNOWN", "UP05IJ7890"];

const violationIcons: Record<string, any> = {
  triple_riding: Users,
  mobile_usage: Phone,
  helmet_violation: Shield,
};

const MonitorPage = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [detections, setDetections] = useState<Array<{ type: string; confidence: number; plate: string; id: string }>>([]);
  const [boundingBoxes, setBoundingBoxes] = useState<Array<{ id: number; x: number; y: number; w: number; h: number; label: string; color: string }>>([]);
  const [verificationDetection, setVerificationDetection] = useState<any>(null);

  const simulateDetection = () => {
    const type = VIOLATION_TYPES[Math.floor(Math.random() * VIOLATION_TYPES.length)];
    const confidence = Math.floor(Math.random() * 30 + 65); // 65 to 95 to show slight possibilities
    const plate = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
    const id = crypto.randomUUID();
    const newDetection = { type, confidence, plate, id };
    setDetections((prev) => [newDetection, ...prev].slice(0, 8));

    // Auto-log high confidence detections (> 80%)
    if (confidence > 80 && plate !== "UNKNOWN" && role === "admin") {
      autoLogViolation(newDetection);
    }
  };

  const autoLogViolation = async (detection: { type: string; confidence: number; plate: string }) => {
    console.log("Auto-logging high confidence violation:", detection);
    await processViolation(detection, true);
  };

  useEffect(() => {
    let boxInterval: any;
    if (isStreaming || videoUrl) {
      // Initialize boxes for different violations
      setBoundingBoxes([
        { id: 1, x: 20, y: 30, w: 120, h: 100, label: "Triple Riding: 74%", color: "hsl(var(--destructive))" },
        { id: 2, x: 60, y: 40, w: 80, h: 90, label: "No Helmet: 82%", color: "hsl(var(--warning))" },
        { id: 3, x: 40, y: 60, w: 90, h: 90, label: "Mobile Usage: 65%", color: "hsl(var(--destructive))" },
      ]);

      boxInterval = setInterval(() => {
        setBoundingBoxes((prev) => 
          prev.map((box) => ({
            ...box,
            x: Math.max(5, Math.min(80, box.x + (Math.random() * 4 - 2))),
            y: Math.max(5, Math.min(70, box.y + (Math.random() * 4 - 2))),
          }))
        );
      }, 150);
    } else {
      setBoundingBoxes([]);
    }
    return () => clearInterval(boxInterval);
  }, [isStreaming, videoUrl]);

  const handleStartStop = () => {
    if (!isStreaming) {
      // Stop video if playing
      if (videoUrl) {
        setVideoUrl(null);
        setIsProcessingVideo(false);
        clearInterval((window as any).__videoInterval);
      }
      setIsStreaming(true);
      // Simulate periodic detections
      const interval = setInterval(() => {
        if (Math.random() > 0.6) simulateDetection(); // Reduced frequency (0.4 -> 0.6)
      }, 7000); // Increased interval (2500 -> 7000)
      (window as any).__monitorInterval = interval;
    } else {
      setIsStreaming(false);
      clearInterval((window as any).__monitorInterval);
      setDetections([]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isStreaming) {
      setIsStreaming(false);
      clearInterval((window as any).__monitorInterval);
    }
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsProcessingVideo(true);
    setDetections([]);
    
    toast({ title: "Video Uploaded", description: `Playing and analyzing ${file.name}...` });

    // Simulate batch detection while video is playing
    const interval = setInterval(() => {
      if (Math.random() > 0.5) simulateDetection(); // Reduced frequency (0.3 -> 0.5)
    }, 6000); // Increased interval (2000 -> 6000)
    (window as any).__videoInterval = interval;
  };

  const stopVideo = () => {
    setVideoUrl(null);
    setIsProcessingVideo(false);
    clearInterval((window as any).__videoInterval);
    setDetections([]);
  };

  const handleLogViolation = async (detection: { type: string; confidence: number; plate: string }) => {
    if (role !== "admin") {
      toast({ title: "Unauthorized", description: "Only admins can log violations", variant: "destructive" });
      return;
    }
    setVerificationDetection(detection);
  };

  const confirmVerification = async () => {
    if (!verificationDetection) return;
    await processViolation(verificationDetection);
    setVerificationDetection(null);
  };

  const processViolation = async (detection: { type: string; confidence: number; plate: string }, isAuto = false) => {
    try {
      // Find vehicle if plate is known
      let vehicleId = null;
      let fallbackPlate = detection.plate;
      let ownerName = "Unknown";

      if (detection.plate !== "UNKNOWN") {
        const { data: vehicle } = await supabase
          .from("vehicles")
          .select("id, owner_name")
          .eq("plate_number", detection.plate)
          .maybeSingle();
        vehicleId = vehicle?.id ?? null;
        ownerName = vehicle?.owner_name ?? "Unknown";
      } else {
        // If UNKNOWN plate, we simulate a face match providing a dummy vehicle/person
        fallbackPlate = "FACE-MATCH-" + Math.floor(Math.random() * 9999);
      }

      // Ensure vehicleId is explicitly null if not found
      const finalVehicleId = vehicleId || null;

      const { data: violationData, error: violationError } = await supabase.from("violations")
        .insert({
          violation_type: detection.type,
          vehicle_id: finalVehicleId,
          plate_number: fallbackPlate,
          confidence: Math.round(detection.confidence),
          status: isAuto ? "confirmed" : "pending",
          location: videoUrl ? "Uploaded Video Analysis" : "Camera 01 - Main Road",
        })
        .select()
        .single();

      if (violationError) {
        console.error("Violation Insert Error:", violationError);
        toast({ title: "Database Error", description: violationError.message, variant: "destructive" });
      } else if (violationData) {
        if (isAuto) {
          toast({ title: "Auto-Logged Violation", description: `${VIOLATION_LABELS[detection.type]} automatically recorded and confirmed.` });
          
          // Generate Challan automatically for auto-confirmed violations
          const { error: challanError } = await supabase.from("challans").insert({
            violation_id: violationData.id,
            owner_name: ownerName,
            vehicle_number: fallbackPlate,
            violation_type: detection.type,
            fine_amount: FINE_AMOUNTS[detection.type] ?? 1000,
          });

          if (challanError) {
            console.error("Auto-Challan Error:", challanError);
          } else {
            toast({ title: "Challan Generated", description: `Automatic challan created for ${fallbackPlate}` });
          }
        } else {
          toast({ title: "Violation Pending", description: `${VIOLATION_LABELS[detection.type]} recorded for manual review.` });
        }
        setDetections((prev) => prev.filter((d) => d.id !== (detection as any).id));
      }
    } catch (err: any) {
      console.error("Unexpected error during processing:", err);
      toast({ title: "System Error", description: err.message || "An unexpected error occurred", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Monitor</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered traffic violation detection</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="video-upload"
            className="hidden"
            accept="video/*"
            onChange={handleVideoUpload}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => document.getElementById('video-upload')?.click()}
            disabled={isStreaming}
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </Button>
          <Button
            onClick={handleStartStop}
            variant={isStreaming ? "destructive" : "default"}
            className="gap-2"
          >
            {isStreaming ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {isStreaming ? "Stop Camera" : "Start Camera"}
          </Button>
          {videoUrl && (
            <Button variant="destructive" onClick={stopVideo} className="gap-2">
               Stop Video
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed (Simulated or Real Video) */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-card overflow-hidden relative" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
              
              {videoUrl ? (
                <video 
                  src={videoUrl} 
                  autoPlay 
                  loop 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              ) : null}

              {(isStreaming || videoUrl) ? (
                <div className="absolute inset-0 w-full h-full">
                  {/* Scan line effect */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                    <div className={cn("absolute w-full h-0.5 bg-primary/30 scan-line", videoUrl && "bg-destructive/50")} />
                  </div>
                  
                  {/* Grid overlay */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-10"
                    style={{
                      backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
                      backgroundSize: '40px 40px',
                    }}
                  />
                  
                  {/* Bounding Boxes */}
                  {boundingBoxes.map((box) => (
                    <div 
                      key={box.id}
                      className="absolute border-2 transition-all duration-150 ease-linear pointer-events-none z-20"
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.w}px`,
                        height: `${box.h}px`,
                        borderColor: box.color,
                        boxShadow: `0 0 10px ${box.color}`
                      }}
                    >
                      <div 
                        className="absolute -top-6 left-0 px-1.5 py-0.5 rounded-t text-[10px] font-bold text-background whitespace-nowrap"
                        style={{ backgroundColor: box.color }}
                      >
                        {box.label}
                      </div>
                      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                    </div>
                  ))}

                  {!videoUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                      <Camera className="w-12 h-12 text-primary/40 mb-3" />
                      <p className="text-sm text-primary font-mono bg-background/50 px-2 py-1 rounded">LIVE FEED ACTIVE</p>
                    </div>
                  )}

                  {/* Recording/Analysis indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-30 bg-background/50 px-2 py-1 rounded-full backdrop-blur-sm">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", videoUrl ? "bg-orange-500" : "bg-destructive")} />
                    <span className={cn("text-xs font-mono font-bold", videoUrl ? "text-orange-500" : "text-destructive")}>
                      {videoUrl ? "ANALYZING VIDEO" : "REC"}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 z-30 bg-background/50 px-2 py-1 rounded backdrop-blur-sm">
                    <span className="text-xs font-mono text-foreground">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center z-10">
                  <CameraOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Camera & Analysis inactive</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start Camera or Upload Video to begin detection</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Detections Panel */}
        <div className="rounded-xl border border-border bg-card flex flex-col max-h-[calc(100vh-12rem)]" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="p-4 border-b border-border flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h2 className="text-sm font-semibold text-foreground">Live Detections</h2>
            {detections.length > 0 && (
              <Badge variant="outline" className="ml-auto text-xs bg-warning/10 text-warning border-warning/20">
                {detections.length}
              </Badge>
            )}
          </div>
          <div className="p-2 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
            {detections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {(isStreaming || videoUrl) ? "Scanning for violations..." : "Start camera or upload video"}
              </p>
            ) : (
              detections.map((d) => {
                const Icon = violationIcons[d.type] || AlertTriangle;
                return (
                  <div key={d.id} className="rounded-lg border border-border bg-muted/30 p-3 animate-fade-in relative overflow-hidden group">
                    {d.plate === "UNKNOWN" && (
                      <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-bl tracking-wider">
                        FACE SCAN REQ
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-destructive" />
                      <span className="text-xs font-semibold text-foreground">{VIOLATION_LABELS[d.type]}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-mono font-bold", d.plate === "UNKNOWN" ? "text-destructive" : "text-primary")}>
                        {d.plate === "UNKNOWN" ? "NO PLATE VISIBLE" : d.plate}
                      </span>
                      <span className="text-muted-foreground">{d.confidence}% conf</span>
                    </div>
                    <Button
                      size="sm"
                      variant={d.plate === "UNKNOWN" ? "default" : "outline"}
                      className={cn("w-full mt-2 text-xs h-7", d.plate === "UNKNOWN" && "bg-destructive hover:bg-destructive/90 text-white")}
                      onClick={() => handleLogViolation(d)}
                    >
                      {d.plate === "UNKNOWN" ? "Scan Face & Log" : "Log Violation"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <AadhaarVerification 
        isOpen={!!verificationDetection} 
        onClose={() => setVerificationDetection(null)}
        plateNumber={verificationDetection?.plate || ""}
        isFaceScan={verificationDetection?.plate === "UNKNOWN"}
        onVerify={confirmVerification}
      />
    </div>
  );
};

export default MonitorPage;
