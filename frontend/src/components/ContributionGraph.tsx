import { useMemo } from "react";

export function ContributionGraph() {
  const weeks = 52;
  const days = 7;

  const contributions = useMemo(() => {
    const data: number[][] = [];
    for (let w = 0; w < weeks; w++) {
      const week: number[] = [];
      for (let d = 0; d < days; d++) {
        // Generate a weighted random pattern
        const rand = Math.random();
        if (rand > 0.7) week.push(Math.floor(Math.random() * 4) + 1);
        else if (rand > 0.4) week.push(1);
        else week.push(0);
      }
      data.push(week);
    }
    return data;
  }, []);

  const getContributionColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-[hsl(var(--contribution-empty))]";
      case 1:
        return "bg-[hsl(var(--contribution-light))]";
      case 2:
        return "bg-[hsl(var(--contribution-medium))]";
      case 3:
        return "bg-[hsl(var(--contribution-heavy))]";
      case 4:
        return "bg-[hsl(var(--contribution-max))]";
      default:
        return "bg-[hsl(var(--contribution-empty))]";
    }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
      <h3 className="section-title">
        <span className="w-3 h-3 bg-primary rounded-sm" />
        Activity
      </h3>
      
      <div className="p-4 rounded-lg border border-border bg-card overflow-x-auto">
        <div className="flex gap-1 text-xs text-muted-foreground mb-2">
          {months.map((month, i) => (
            <span key={month} style={{ width: `${100 / 12}%` }} className="text-center">
              {i % 2 === 0 ? month : ""}
            </span>
          ))}
        </div>
        
        <div className="flex gap-[3px]">
          {contributions.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((level, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`contribution-box ${getContributionColor(level)}`}
                  title={`${level} contributions`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`contribution-box ${getContributionColor(level)}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
