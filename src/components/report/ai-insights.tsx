
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  BarChart3,
} from "lucide-react"

interface AIInsight {
  id: string
  type: "prediction" | "recommendation" | "risk" | "opportunity" | "pattern"
  priority: "high" | "medium" | "low"
  confidence: number
  title: string
  description: string
  impact: string
  actionItems: string[]
  dataPoints: string[]
  trend?: "positive" | "negative" | "neutral"
}

const aiInsights: AIInsight[] = [
  {
    id: "1",
    type: "prediction",
    priority: "high",
    confidence: 87,
    title: "Sprint 100 Completion Risk",
    description:
      "Based on current velocity trends and team capacity, there's a 73% probability that Sprint 100 will face similar scope creep issues.",
    impact: "Potential 15-20% scope overflow in next sprint",
    actionItems: [
      "Implement stricter story point estimation reviews",
      "Add 10% buffer to Sprint 100 planning",
      "Schedule mid-sprint scope review checkpoint",
    ],
    dataPoints: [
      "Last 3 sprints averaged 12% scope increase",
      "Backend team consistently at 95%+ capacity",
      "External dependency delays increased by 40%",
    ],
    trend: "negative",
  },
  {
    id: "2",
    type: "opportunity",
    priority: "high",
    confidence: 92,
    title: "Web Team Optimization Potential",
    description:
      "Web team consistently outperforms estimates by 15-20%. They could take on additional scope or mentor other teams.",
    impact: "Potential 25% increase in overall team velocity",
    actionItems: [
      "Assign Web team as mentors for iOS team",
      "Consider reallocating 2-3 story points to Web team",
      "Document Web team's best practices for knowledge sharing",
    ],
    dataPoints: [
      "Web team: 100% efficiency for 3 consecutive sprints",
      "Average task completion 1.2 days ahead of estimate",
      "Zero bugs reported in last 2 sprints",
    ],
    trend: "positive",
  },
  {
    id: "3",
    type: "risk",
    priority: "medium",
    confidence: 78,
    title: "iOS Team Burnout Indicators",
    description:
      "iOS team showing signs of decreased velocity and increased task duration. Pattern suggests potential burnout risk.",
    impact: "Risk of 20-30% velocity decrease in upcoming sprints",
    actionItems: [
      "Schedule one-on-one meetings with iOS team members",
      "Consider redistributing complex tasks to other teams",
      "Implement pair programming sessions for knowledge transfer",
    ],
    dataPoints: [
      "iOS velocity decreased 18% over last 2 sprints",
      "Average task completion time increased by 35%",
      "Team reported 2 blocked tasks due to complexity",
    ],
    trend: "negative",
  },
  {
    id: "4",
    type: "pattern",
    priority: "medium",
    confidence: 85,
    title: "Mid-Sprint Velocity Drop Pattern",
    description: "Consistent pattern detected: team velocity drops 25% between days 6-9 across last 4 sprints.",
    impact: "Predictable productivity dip affecting sprint outcomes",
    actionItems: [
      "Schedule lighter workload for days 6-9",
      "Plan team building or training activities during low-velocity period",
      "Front-load critical tasks in first 5 days of sprint",
    ],
    dataPoints: [
      "Days 6-9 average: 23.5h vs sprint average: 31.2h",
      "Pattern consistent across all teams",
      "Correlation with mid-sprint review meetings",
    ],
    trend: "neutral",
  },
  {
    id: "5",
    type: "recommendation",
    priority: "high",
    confidence: 91,
    title: "Optimal Sprint Length Adjustment",
    description:
      "Analysis suggests 12-day sprints would improve completion rates by 23% based on team velocity patterns.",
    impact: "Potential improvement in sprint completion from 89.9% to 95%+",
    actionItems: [
      "Pilot 12-day sprint for Sprint 101",
      "Adjust story point allocation accordingly",
      "Monitor team satisfaction and delivery quality",
    ],
    dataPoints: [
      "Team velocity peaks at day 10-11 consistently",
      "Last 2 days often show rushed completion",
      "Quality metrics improve with shorter, focused sprints",
    ],
    trend: "positive",
  },
  {
    id: "6",
    type: "prediction",
    priority: "low",
    confidence: 72,
    title: "Q1 Velocity Forecast",
    description: "Based on current trends, team velocity will stabilize at 36-38 story points per sprint by end of Q1.",
    impact: "Improved predictability for quarterly planning",
    actionItems: [
      "Adjust Q1 roadmap based on 37-point average",
      "Plan capacity for 2-3% monthly velocity improvement",
      "Set realistic stakeholder expectations",
    ],
    dataPoints: [
      "Current velocity trend: +2.3% monthly",
      "Team maturity curve suggests plateau at 37 points",
      "Historical data from similar team compositions",
    ],
    trend: "positive",
  },
]

const performancePredictions = {
  nextSprintCompletion: 85,
  velocityTrend: "stable",
  riskLevel: "medium",
  recommendedActions: 3,
  confidenceScore: 84,
}

export function AIInsights() {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "prediction":
        return <BarChart3 className="w-4 h-4" />
      case "recommendation":
        return <Lightbulb className="w-4 h-4" />
      case "risk":
        return <AlertTriangle className="w-4 h-4" />
      case "opportunity":
        return <Target className="w-4 h-4" />
      case "pattern":
        return <TrendingUp className="w-4 h-4" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getInsightColor = (type: string, priority: string) => {
    if (type === "risk") return "border-red-200 bg-red-50"
    if (type === "opportunity") return "border-green-200 bg-green-50"
    if (priority === "high") return "border-orange-200 bg-orange-50"
    return "border-blue-200 bg-blue-50"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return <Badge className={colors[priority as keyof typeof colors]}>{priority.toUpperCase()}</Badge>
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const highPriorityInsights = aiInsights.filter((insight) => insight.priority === "high")
  const mediumPriorityInsights = aiInsights.filter((insight) => insight.priority === "medium")
  const lowPriorityInsights = aiInsights.filter((insight) => insight.priority === "low")

  return (
    <div className="space-y-6">
      {/* AI Overview Dashboard */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Brain className="w-5 h-5" />
            AI-Powered Sprint Intelligence
          </CardTitle>
          <p className="text-sm text-purple-600">
            Advanced analytics and machine learning insights based on historical data and current sprint patterns
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">{performancePredictions.nextSprintCompletion}%</div>
              <div className="text-xs text-gray-500">Next Sprint Prediction</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{performancePredictions.confidenceScore}%</div>
              <div className="text-xs text-gray-500">AI Confidence</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{performancePredictions.riskLevel.toUpperCase()}</div>
              <div className="text-xs text-gray-500">Risk Level</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{performancePredictions.recommendedActions}</div>
              <div className="text-xs text-gray-500">Critical Actions</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-indigo-600">{aiInsights.length}</div>
              <div className="text-xs text-gray-500">Total Insights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Critical Insights & Actions Required
          </CardTitle>
          <p className="text-sm text-gray-600">High-priority insights requiring immediate attention</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {highPriorityInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type, insight.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  {getTrendIcon(insight.trend)}
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(insight.priority)}
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
              </div>

              <p className="text-gray-700 mb-3">{insight.description}</p>

              <div className="mb-3 p-2 bg-white rounded border">
                <div className="text-sm font-medium text-gray-900 mb-1">Expected Impact:</div>
                <div className="text-sm text-gray-600">{insight.impact}</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Recommended Actions:
                  </h4>
                  <ul className="space-y-1">
                    {insight.actionItems.map((action, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    Supporting Data:
                  </h4>
                  <ul className="space-y-1">
                    {insight.dataPoints.map((dataPoint, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                        {dataPoint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Medium Priority Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Zap className="w-5 h-5" />
            Strategic Recommendations
          </CardTitle>
          <p className="text-sm text-gray-600">Medium-priority insights for sprint optimization</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {mediumPriorityInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type, insight.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  {getTrendIcon(insight.trend)}
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(insight.priority)}
                  <Badge variant="outline" className="text-xs">
                    {insight.confidence}% confidence
                  </Badge>
                </div>
              </div>

              <p className="text-gray-700 mb-2">{insight.description}</p>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Impact:</strong> {insight.impact}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Actions:</h4>
                  <ul className="space-y-1">
                    {insight.actionItems.slice(0, 2).map((action, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Key Data:</h4>
                  <ul className="space-y-1">
                    {insight.dataPoints.slice(0, 2).map((dataPoint, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                        {dataPoint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Predictive Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-5 h-5" />
            Predictive Analytics & Future Insights
          </CardTitle>
          <p className="text-sm text-gray-600">Long-term predictions and trend analysis</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {lowPriorityInsights.map((insight) => (
            <div key={insight.id} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getInsightIcon(insight.type)}
                  <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                  {getTrendIcon(insight.trend)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {insight.confidence}% confidence
                </Badge>
              </div>

              <p className="text-gray-700 mb-2">{insight.description}</p>
              <div className="text-sm text-gray-600">
                <strong>Expected Impact:</strong> {insight.impact}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Model Information */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-700">
            <Brain className="w-5 h-5" />
            AI Model Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Data Sources</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Historical sprint data (24 months)</li>
                <li>• Team velocity patterns</li>
                <li>• Task completion metrics</li>
                <li>• External dependency tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Model Accuracy</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Sprint completion: 89% accuracy</li>
                <li>• Velocity prediction: 85% accuracy</li>
                <li>• Risk identification: 78% accuracy</li>
                <li>• Pattern recognition: 92% accuracy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Last Updated</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Model training: {new Date().toLocaleDateString()}</li>
                <li>• Data refresh: Real-time</li>
                <li>• Confidence threshold: 70%</li>
                <li>• Next model update: Weekly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

    