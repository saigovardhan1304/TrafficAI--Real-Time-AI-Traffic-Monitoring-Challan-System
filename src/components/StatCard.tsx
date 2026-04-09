import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  variant?: "default" | "danger" | "warning" | "success";
};

const variantStyles = {
  default: "border-border",
  danger: "border-destructive/30",
  warning: "border-warning/30",
  success: "border-success/30",
};

const iconBg = {
  default: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const StatCard = ({ title, value, icon, trend, variant = "default" }: StatCardProps) => (
  <div className={cn("rounded-xl border bg-card p-5 animate-fade-in", variantStyles[variant])} style={{ boxShadow: 'var(--shadow-card)' }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </div>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg[variant])}>
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
