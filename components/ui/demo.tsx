"use client";

import { useState } from "react";

import AnimatedTextCycle from "@/components/ui/animated-text-cycle";
import MorphPanel from "@/components/ui/ai-input";
import {
  SecondaryNavbar,
  SimpleNavbar,
} from "@/components/ui/core-header-navbar";
import { GradientText } from "@/components/ui/gradient-text";
import Frame760 from "@/components/ui/sidebar-component";

export default function DemoOne() {
  const [type, setType] = useState("/");

  return (
    <div className="w-full overflow-hidden rounded-[22px] border border-white/10 bg-[var(--color-bg-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <SimpleNavbar
        title="Home"
        userName="Harsh S."
        userImage="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
      />

      <SecondaryNavbar
        currentType={type}
        onTypeChange={setType}
        links={[
          { name: "Home", href: "/" },
          { name: "Institutions", href: "/institutions" },
          { name: "Method", href: "/method" },
          { name: "Legal", href: "/legal" },
        ]}
      />
    </div>
  );
}

export function AnimatedTextCycleDemo() {
  return (
    <div className="max-w-[500px] p-4">
      <h1 className="text-left text-4xl font-light text-white/70">
        Your{" "}
        <AnimatedTextCycle
          words={[
            "business",
            "team",
            "workflow",
            "productivity",
            "projects",
            "analytics",
            "dashboard",
            "platform",
          ]}
          interval={3000}
          className="bg-[linear-gradient(90deg,#ffffff,#a9bcff)] bg-clip-text text-transparent"
        />{" "}
        deserves better tools
      </h1>
    </div>
  );
}

export function GradientTextDemo() {
  return (
    <h1 className="text-center text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
      Design <GradientText>without</GradientText> Limits
    </h1>
  );
}

export function SidebarComponentDemo() {
  return <Frame760 />;
}

export function AIInputDemo() {
  return <MorphPanel />;
}
