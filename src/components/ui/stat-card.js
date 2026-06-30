import { Card } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({ title, value, change, changeType, icon: Icon }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                "text-sm font-medium",
                changeType === "positive" ? "text-success-500" : "text-danger-500"
              )}
            >
              {changeType === "positive" ? "+" : ""}{change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-lg bg-primary-50">
            <Icon className="w-5 h-5 text-primary-500" />
          </div>
        )}
      </div>
    </Card>
  );
}
