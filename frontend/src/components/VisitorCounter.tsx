import { useEffect } from "react";
import { Eye } from "lucide-react";
import { useVisitorCount, useTrackVisitor } from "@/hooks/useVisitorAnalytics";

export function VisitorCounter() {
  const { data: visitorData } = useVisitorCount();
  const trackVisitor = useTrackVisitor();

  useEffect(() => {
    // Track visitor on component mount with current page path
    trackVisitor.mutate({
      page_path: window.location.pathname,
      referrer: document.referrer || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visitorData?.total_visitors && visitorData?.total_visitors !== 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Eye className="h-3.5 w-3.5" />
      <span>{visitorData.total_visitors.toLocaleString()} visitors</span>
    </div>
  );
}
