
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, FileText, Users, Target, AlertTriangle, CheckCircle, Clock, Award, Zap } from "lucide-react"
import { AIInsights } from "@/components/report/ai-insights"

const sprintData = {
  sprintNumber: 99,
  startDate: "2025-01-15",
  endDate: "2025-01-29",
  duration: 14,
  status: "Completed",
  totalScope: 218.5,
  completedWork: 196.5,
  remainingWork: 22.0,
  progressPercentage: 89.9,
  teamCount: 4,
  totalTasks: 47,
  completedTasks: 42,
  inProgressTasks: 3,
  blockedTasks: 2,
}

const executiveSummary = {
  overallHealth: "Good",
  keyAchievements: [
    "Delivered 89.9% of planned scope",
    "All critical features completed on time",
    "Zero production incidents during sprint",
    "Improved team velocity by 12%",
  ],
  challenges: [
    "Scope creep detected mid-sprint",
    "Backend team capacity constraints",
    "Two tasks blocked by external dependencies",
  ],
  recommendations: [
    "Implement stricter scope change control",
    "Consider additional backend resources",
    "Establish better dependency management process",
  ],
}

const teamPerformance = [
  {
    team: "Backend",
    planned: 64.0,
    completed: 58.0,
    efficiency: 91,
    velocity: 8.1,
    status: "Good",
    issues: 1,
    highlights: ["API optimization completed", "Database migration successful"],
  },
  {
    team: "iOS",
    planned: 64.0,
    completed: 48.0,
    efficiency: 75,
    velocity: 8.0,
    status: "Behind",
    issues: 2,
    highlights: ["New UI components delivered", "Performance improvements"],
  },
  {
    team: "Web",
    planned: 48.0,
    completed: 48.0,
    efficiency: 100,
    velocity: 13.3,
    status: "Excellent",
    issues: 0,
    highlights: ["All features delivered", "Zero bugs reported"],
  },
  {
    team: "Android",
    planned: 64.0,
    completed: 59.0,
    efficiency: 92,
    velocity: 12.5,
    status: "Good",
    issues: 1,
    highlights: ["Push notifications implemented", "App store submission ready"],
  },
]

const burndownData = [
  { day: "Day 1", ideal: 218.5, actual: 218.5 },
  { day: "Day 3", ideal: 175.0, actual: 186.0 },
  { day: "Day 5", ideal: 131.5, actual: 155.0 },
  { day: "Day 7", ideal: 88.0, actual: 123.0 },
  { day: "Day 9", ideal: 44.5, actual: 88.0 },
  { day: "Day 11", ideal: 22.0, actual: 65.0 },
  { day: "Day 14", ideal: 0, actual: 22.0 },
]

const workDistribution = [
  { name: "Build", value: 74, hours: 161.7, color: "#3B82F6" },
  { name: "Run", value: 8, hours: 17.5, color: "#F97316" },
  { name: "Buffer", value: 18, hours: 39.3, color: "#10B981" },
]

const tasksByStatus = [
  { status: "Completed", count: 42, percentage: 89.4, color: "#10B981" },
  { status: "In Progress", count: 3, percentage: 6.4, color: "#3B82F6" },
  { status: "Blocked", count: 2, percentage: 4.3, color: "#EF4444" },
]

export default function ReportPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800"
      case "Good":
        return "bg-blue-100 text-blue-800"
      case "Behind":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Excellent":
        return <Award className="w-4 h-4 text-green-600" />
      case "Good":
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      case "Behind":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-white">
      {/* Report Header */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sprint {sprintData.sprintNumber} Report</h1>
            <p className="text-gray-600 mt-1">
              {new Date(sprintData.startDate).toLocaleDateString()} -{" "}
              {new Date(sprintData.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`${sprintData.status === "Completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
            >
              {sprintData.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{sprintData.duration}</div>
            <div className="text-xs text-gray-500">Days</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{sprintData.progressPercentage}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{sprintData.completedTasks}</div>
            <div className="text-xs text-gray-500">Tasks Done</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{sprintData.teamCount}</div>
            <div className="text-xs text-gray-500">Teams</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{sprintData.totalScope}h</div>
            <div className="text-xs text-gray-500">Total Scope</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{sprintData.remainingWork}h</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>
      </div>

      {/* AI-Powered Insights Section */}
      <AIInsights />

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Key Achievements
              </h4>
              <ul className="space-y-2">
                {executiveSummary.keyAchievements.map((achievement, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    {achievement}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Challenges
              </h4>
              <ul className="space-y-2">
                {executiveSummary.challenges.map((challenge, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                    {challenge}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {executiveSummary.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${executiveSummary.overallHealth === "Good" ? "bg-green-500" : "bg-orange-500"}`}
              />
              <span className="font-medium">Overall Sprint Health: {executiveSummary.overallHealth}</span>
            </div>
            <p className="text-sm text-gray-600">
              Sprint 99 achieved {sprintData.progressPercentage}% completion with strong team performance across most
              areas. Key focus areas for next sprint include scope management and dependency resolution.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sprint Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                ideal: { label: "Ideal", color: "#9CA3AF" },
                actual: { label: "Actual", color: "#3B82F6" },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="ideal" stroke="#9CA3AF" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <ChartContainer
                config={{
                  build: { label: "Build", color: "#3B82F6" },
                  run: { label: "Run", color: "#F97316" },
                  buffer: { label: "Buffer", color: "#10B981" },
                }}
                className="h-[200px] w-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={workDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {workDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="space-y-2">
              {workDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {item.hours}h ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamPerformance.map((team) => (
              <div key={team.team} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{team.team} Team</h3>
                    {getStatusIcon(team.status)}
                    <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{team.efficiency}%</div>
                    <div className="text-sm text-gray-500">Efficiency</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-xl font-bold">{team.planned}h</div>
                    <div className="text-xs text-gray-500">Planned</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="text-xl font-bold">{team.completed}h</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-xl font-bold">{team.velocity}</div>
                    <div className="text-xs text-gray-500">Velocity</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-xl font-bold">{team.issues}</div>
                    <div className="text-xs text-gray-500">Issues</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{team.efficiency}%</span>
                  </div>
                  <Progress value={team.efficiency} className="h-2" />
                </div>

                <div>
                  <h4 className="font-medium mb-2">Key Highlights</h4>
                  <ul className="space-y-1">
                    {team.highlights.map((highlight, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <ChartContainer
                config={{
                  completed: { label: "Completed", color: "#10B981" },
                  inProgress: { label: "In Progress", color: "#3B82F6" },
                  blocked: { label: "Blocked", color: "#EF4444" },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="count">
                      {tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            <div className="col-span-2 space-y-4">
              {tasksByStatus.map((status) => (
                <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="font-medium">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{status.count} tasks</div>
                    <div className="text-sm text-gray-500">{status.percentage}%</div>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Next Sprint Carryover</h4>
                <p className="text-sm text-blue-700">
                  5 tasks ({sprintData.inProgressTasks} in progress, {sprintData.blockedTasks} blocked) will be carried
                  over to Sprint 100. Estimated effort: {sprintData.remainingWork} hours.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="border-t pt-6 text-center text-sm text-gray-500">
        <p>
          Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
        <p className="mt-1">Sprint Tracking Tool v2.0 with AI Intelligence | Confidential</p>
      </div>
    </div>
  )
}

    