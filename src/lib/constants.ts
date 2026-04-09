export const VIOLATION_LABELS: Record<string, string> = {
  triple_riding: "Triple Riding",
  mobile_usage: "Mobile Usage",
  helmet_violation: "Helmet Violation",
};

export const FINE_AMOUNTS: Record<string, number> = {
  triple_riding: 1000,
  mobile_usage: 2000,
  helmet_violation: 1000,
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-success/10 text-success border-success/20",
  dismissed: "bg-muted text-muted-foreground border-border",
  paid: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
