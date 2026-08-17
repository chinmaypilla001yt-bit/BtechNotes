import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Clock,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Paperclip,
  Plus,
  Settings,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/notes", label: "My Notes", icon: BookOpen },
  { to: "/subjects", label: "Subjects", icon: FolderTree },
  { to: "/recent", label: "Recent Notes", icon: Clock },
  { to: "/files", label: "Files", icon: Paperclip },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.displayName ?? user?.email ?? "U").slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2 text-left transition-colors hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL ?? undefined} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user?.displayName ?? "Student"}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await logout();
            toast.success("Signed out");
            navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-3">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 px-2 py-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight">BTech Notes</span>
      </Link>

      <Button asChild size="sm" className="mx-1">
        <Link to="/notes/new" onClick={onNavigate}>
          <Plus className="mr-1.5 h-4 w-4" /> New Note
        </Link>
      </Button>

      <div className="flex-1 overflow-y-auto">
        <NavLinks {...(onNavigate ? { onNavigate } : {})} />
      </div>

      <div className="space-y-1">
        <Link
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <Settings className="h-4 w-4" aria-hidden="true" /> Settings
        </Link>
        <ProfileMenu />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link to="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold">BTech Notes</span>
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
