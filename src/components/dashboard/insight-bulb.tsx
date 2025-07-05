
"use client"
import { Lightbulb } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface InsightBulbProps {
  insight: React.ReactNode;
  className?: string;
}

export function InsightBulb({ insight, className }: InsightBulbProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={cn("relative", className)}>
            <Lightbulb className="h-5 w-5 text-muted-foreground hover:text-yellow-400 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs z-50">
          {typeof insight === "string" ? <p>{insight}</p> : insight}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
