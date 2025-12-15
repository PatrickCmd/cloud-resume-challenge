import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { mockVisitorService } from "@/services/mockVisitorService";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    mockVisitorService.trackVisit().then(setCount);
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3.5 w-3.5" />
      <span>{count.toLocaleString()} visitors</span>
    </div>
  );
}
