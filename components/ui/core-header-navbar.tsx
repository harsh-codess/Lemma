"use client";

import * as React from "react";
import Link from "next/link";

import LemmaLogo from "@/components/lemma-logo";
import { cn } from "@/lib/utils";

type NavbarLink = {
  name: string;
  href: string;
};

type SimpleNavbarProps = {
  title: string;
  userName?: string;
  userImage?: string;
  className?: string;
  statusLabel?: string;
  trailingContent?: React.ReactNode;
};

export function SimpleNavbar({
  title,
  userName,
  userImage,
  className,
  statusLabel = "Active now",
  trailingContent,
}: SimpleNavbarProps) {
  const avatarStyle = userImage
    ? {
        backgroundImage: `url(${userImage})`,
      }
    : undefined;

  return (
    <nav
      className={cn(
        "relative flex h-[58px] items-center justify-between overflow-hidden border-b border-white/8 bg-[rgba(8,9,10,0.72)] px-4 md:px-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 0% 0%, #000 36%, transparent 86%)",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 0% 0%, #000 36%, transparent 86%)",
          }}
        />
      </div>

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <Link href="/" className="shrink-0">
          <LemmaLogo
            className="gap-2.5"
            iconClassName="h-9 w-9 rounded-[11px]"
            wordmarkClassName="hidden text-[15px] font-semibold tracking-[-0.02em] sm:inline"
          />
        </Link>

        <div className="hidden h-5 w-px bg-white/10 sm:block" />

        <h1 className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(255,255,255,0.78)] sm:text-[12px]">
          {title}
        </h1>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        {trailingContent ? (
          trailingContent
        ) : (
          <>
            {userName ? (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  {userName}
                </span>
                <span className="text-[10px] uppercase tracking-[0.24em] text-white/38">
                  {statusLabel}
                </span>
              </div>
            ) : null}

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] p-1">
              {userImage ? (
                <div
                  className="h-full w-full rounded-full bg-cover bg-center"
                  style={avatarStyle}
                />
              ) : (
                <LemmaLogo
                  showWordmark={false}
                  className="gap-0"
                  iconClassName="h-8 w-8 rounded-full shadow-none"
                />
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

type SecondaryNavbarProps = {
  links: NavbarLink[];
  currentType: string;
  onTypeChange?: (type: string) => void;
  className?: string;
};

export function SecondaryNavbar({
  links,
  currentType,
  onTypeChange,
  className,
}: SecondaryNavbarProps) {
  return (
    <div
      className={cn(
        "group relative border-t border-white/[0.04] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]",
        className,
      )}
    >
      <div className="flex items-center">
        <div className="no-scrollbar flex flex-1 overflow-x-auto scroll-smooth">
          {links.map((link) => {
            const isActive = currentType === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onTypeChange?.(link.href)}
                className={cn(
                  "relative flex min-w-fit shrink-0 items-center justify-center border-r border-white/[0.06] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors md:px-6",
                  isActive
                    ? "bg-white/[0.05] text-white"
                    : "text-[rgba(255,255,255,0.68)] hover:bg-white/[0.03] hover:text-white",
                )}
              >
                <span>{link.name}</span>
                {isActive ? (
                  <span className="absolute inset-x-4 bottom-0 h-px bg-white/70" />
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--color-bg-primary)] via-[rgba(8,9,10,0.72)] to-transparent opacity-70 transition-opacity md:hidden group-hover:opacity-100" />
    </div>
  );
}

export type { NavbarLink };
