import {
  BarChart3, BookOpen, FlaskConical, Home, LayoutDashboard, Map, NotebookPen, Settings, ShieldAlert,
  Sparkles, Trophy, UserRound, Users, type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Navigation per PRD section 21. Adding a screen means adding one line here. */
export const NAV: Record<Role, NavItem[]> = {
  student: [
    { href: "/student", label: "Home", icon: Home },
    { href: "/student/path", label: "My Path", icon: Map },
    { href: "/student/learn", label: "Learn", icon: BookOpen },
    { href: "/student/labs", label: "Labs", icon: FlaskConical },
    { href: "/student/ai", label: "AURA AI", icon: Sparkles },
    { href: "/student/progress", label: "Progress", icon: Trophy },
    { href: "/student/notes", label: "Notes", icon: NotebookPen },
    { href: "/student/profile", label: "Profile", icon: UserRound },
  ],
  facilitator: [
    { href: "/facilitator", label: "Overview", icon: LayoutDashboard },
    { href: "/facilitator/students", label: "Students", icon: Users },
    { href: "/facilitator/queue", label: "Intervention Queue", icon: ShieldAlert },
    { href: "/facilitator/curriculum", label: "Curriculum", icon: Map },
    { href: "/facilitator/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/facilitator/settings", label: "Settings", icon: Settings },
  ],
};

/** Exact match for a section root, prefix match for everything under it. */
export function isActive(pathname: string, href: string, role: Role) {
  const root = role === "student" ? "/student" : "/facilitator";
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}
