"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ChevronsUpDown,
  FileText,
  FolderKanban,
  LayoutGrid,
  LogOut,
  PlusSquare,
  Settings,
  UserCircle,
  ClipboardCheck,
  Download,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useClerk, useUser } from "@clerk/nextjs";
import LemmaLogo from "@/components/lemma-logo";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

export function LemmaSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "User";
  const displayEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r border-white/[0.06]",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#040405] text-white/60 transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            {/* ── Logo / Institution header ── */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-white/[0.06] p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2 px-2 text-white/60 hover:bg-white/[0.06] hover:text-white"
                    >
                      <LemmaLogo showWordmark={false} iconClassName="h-5 w-5 rounded-md" />
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium text-white">
                              Lemma
                            </p>
                            <ChevronsUpDown className="h-4 w-4 text-white/30" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-[#111214] text-white border-white/10">
                    <DropdownMenuItem asChild className="flex items-center gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white">
                      <Link href="/app/settings">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* ── Navigation links ── */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    <Link
                      href="/app"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                        pathname === "/app" && "bg-white/[0.08] text-amber-400",
                      )}
                    >
                      <LayoutGrid className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Projects</p>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                      href="/app/projects/new"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                        pathname === "/app/projects/new" && "bg-white/[0.08] text-amber-400",
                      )}
                    >
                      <PlusSquare className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">New Project</p>
                        )}
                      </motion.li>
                    </Link>

                    {pathname.startsWith("/app/projects/") && pathname !== "/app/projects/new" && (
                      <Link
                        href={pathname}
                        className={cn(
                          "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                          "bg-white/[0.08] text-amber-400",
                        )}
                      >
                        <FolderKanban className="h-4 w-4 shrink-0" />
                        <motion.li variants={variants}>
                          {!isCollapsed && (
                            <p className="ml-2 text-sm font-medium">Workspace</p>
                          )}
                        </motion.li>
                      </Link>
                    )}

                    <Separator className="w-full bg-white/[0.06]" />

                    <Link
                      href="/app/review"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                        pathname?.includes("/review") && "bg-white/[0.08] text-amber-400",
                      )}
                    >
                      <ClipboardCheck className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="ml-2 flex items-center gap-2">
                            <p className="text-sm font-medium">Review</p>
                            <Badge
                              className={cn(
                                "flex h-fit w-fit items-center gap-1.5 rounded border-none bg-amber-400/10 px-1.5 text-amber-400",
                              )}
                              variant="outline"
                            >
                              AI
                            </Badge>
                          </div>
                        )}
                      </motion.li>
                    </Link>
                    <Link
                      href="/app/exports"
                      className={cn(
                        "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                        pathname?.includes("/exports") && "bg-white/[0.08] text-amber-400",
                      )}
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="ml-2 text-sm font-medium">Exports</p>
                        )}
                      </motion.li>
                    </Link>
                  </div>
                </ScrollArea>
              </div>

              {/* ── Bottom section: settings + account ── */}
              <div className="flex flex-col p-2">
                <Link
                  href="/app/settings"
                  className={cn(
                    "mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white",
                    pathname?.includes("/settings") && "bg-white/[0.08] text-amber-400",
                  )}
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Settings</p>
                    )}
                  </motion.li>
                </Link>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/[0.06] hover:text-white">
                        <Avatar className="size-4">
                          <AvatarFallback className="bg-amber-400/20 text-[9px] text-amber-400">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium text-white/80">Account</p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-white/30" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} className="bg-[#111214] text-white border-white/10">
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-amber-400/20 text-xs text-amber-400">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-white">
                            {displayName}
                          </span>
                          <span className="line-clamp-1 text-xs text-white/50">
                            {displayEmail}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild className="flex items-center gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white">
                        <Link href="/app/settings">
                          <UserCircle className="h-4 w-4" /> Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white"
                        onClick={() => signOut({ redirectUrl: "/" })}
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
