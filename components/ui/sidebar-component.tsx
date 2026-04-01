"use client";

import * as React from "react";
import Link from "next/link";
import {
  FolderKanban,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  PlusSquare,
} from "lucide-react";

import LemmaLogo from "@/components/lemma-logo";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "lemma.workspace.sidebar-collapsed";

type SidebarItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (pathname: string) => boolean;
};

const baseItems: SidebarItem[] = [
  {
    href: "/app",
    label: "Projects",
    icon: LayoutGrid,
    active: (pathname) => pathname === "/app",
  },
  {
    href: "/app/projects/new",
    label: "New project",
    icon: PlusSquare,
    active: (pathname) => pathname === "/app/projects/new",
  },
];

const getSidebarItems = (pathname: string): SidebarItem[] => {
  if (pathname.startsWith("/app/projects/") && pathname !== "/app/projects/new") {
    return [
      ...baseItems,
      {
        href: pathname,
        label: "Current workspace",
        icon: FolderKanban,
        active: (currentPathname) =>
          currentPathname.startsWith("/app/projects/") &&
          currentPathname !== "/app/projects/new",
      },
    ];
  }

  return baseItems;
};

function SidebarNavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: SidebarItem;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isActive = item.active(pathname);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex h-11 items-center rounded-2xl transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-3.5",
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-white/62 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      {!collapsed ? (
        <span className="truncate text-sm font-medium">{item.label}</span>
      ) : null}
    </Link>
  );
}

export function LemmaWorkspaceSidebar({
  pathname,
  className,
  onNavigate,
}: {
  pathname: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const items = React.useMemo(() => getSidebarItems(pathname), [pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(storedValue === "true");
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col rounded-[24px] bg-[#09090a] transition-[width] duration-200",
        collapsed ? "w-[88px]" : "w-[280px]",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center p-3",
          collapsed ? "flex-col gap-3 justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <Link href="/app" className="min-w-0">
            <LemmaLogo
              className="gap-2.5"
              iconClassName="h-10 w-10 rounded-[14px]"
              wordmarkClassName="text-[15px] font-semibold tracking-[-0.02em]"
            />
          </Link>
        ) : (
          <Link href="/app">
            <LemmaLogo showWordmark={false} iconClassName="h-10 w-10 rounded-[14px]" />
          </Link>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-white/68 transition-colors hover:bg-white/[0.08] hover:text-white",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="px-4 py-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/34">
            Navigation
          </p>
          <p className="mt-3 text-sm leading-6 text-white/56">
            Keep the flow simple: portfolio, project creation, and the active workspace.
          </p>
        </div>
      ) : null}

      <nav className={cn("flex flex-1 flex-col gap-2 p-3 pt-4")}>
        {items.map((item) => (
          <SidebarNavLink
            key={`${item.href}-${item.label}`}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function Frame760() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#040405] p-4">
      <LemmaWorkspaceSidebar pathname="/app" />
    </div>
  );
}

export default Frame760;
