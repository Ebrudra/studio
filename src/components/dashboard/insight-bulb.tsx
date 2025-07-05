
"use client"
import { Lightbulb } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InsightBulbProps {
  insight: React.ReactNode;
  className?: string;
}

export function InsightBulb({ insight, className }: InsightBulbProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`relative ${className}`}>
            <Lightbulb className="h-5 w-5 text-yellow-400 hover:text-yellow-500 transition-colors" />
            <span className="animate-ping absolute top-0 right-0 inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs z-50">
          {typeof insight === "string" ? <p>{insight}</p> : insight}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

    