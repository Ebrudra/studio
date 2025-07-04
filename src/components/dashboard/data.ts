import type { TicketStatus, TicketTypeScope, Team, TicketType } from "@/types"
import { CheckCircle2, Circle, CircleDot, XCircle } from "lucide-react"

export const statuses: { value: TicketStatus; label: string; icon: React.ElementType }[] = [
  { value: "To Do", label: "To Do", icon: Circle },
  { value: "In Progress", label: "In Progress", icon: CircleDot },
  { value: "Done", label: "Done", icon: CheckCircle2 },
  { value: "Blocked", label: "Blocked", icon: XCircle },
]

export const scopes: { value: Team; label: string }[] = [
    { value: "Backend", label: "Backend" },
    { value: "iOS", label: "iOS" },
    { value: "Web", label: "Web" },
    { value: "Android", label: "Android" },
    { value: "Mobile", label: "Mobile" },
    { value: "Out of Scope", label: "Out of Scope" },
]

export const ticketTypes: { value: TicketType; label: string }[] = [
    { value: "User story", label: "User story" },
    { value: "Bug", label: "Bug" },
    { value: "Task", label: "Task" },
    { value: "Buffer", label: "Buffer" },
];

export const typeScopes: { value: TicketTypeScope; label: string }[] = [
    { value: "Build", label: "Build" },
    { value: "Run", label: "Run" },
    { value: "Sprint", label: "Sprint" },
]
