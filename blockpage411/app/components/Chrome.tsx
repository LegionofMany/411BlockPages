"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const showNavbar = !isAdminRoute;

  return (
    <>
      {showNavbar ? <Navbar /> : null}
      <div
        id="content"
        style={{
          // reserve space for the fixed navbar only when it is rendered
          paddingTop: showNavbar ? "4rem" : 0,
        }}
      >
        {children}
      </div>
    </>
  );
}
