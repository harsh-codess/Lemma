"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import Footer from "@/components/footer";
import Header from "@/components/header";

const AUTH_PATH_PREFIXES = ["/sign-in", "/sign-up"];
const CHROMELESS_PATH_PREFIXES = ["/sso-callback", "/app", "/onboarding"];

const SiteShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const hideAllChrome = CHROMELESS_PATH_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );
  const hideFooter = AUTH_PATH_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix),
  );

  if (hideAllChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      {hideFooter ? null : <Footer />}
    </>
  );
};

export default SiteShell;
