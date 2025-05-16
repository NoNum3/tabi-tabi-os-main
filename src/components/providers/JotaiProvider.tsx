"use client";

import React from "react";
import { Provider } from "jotai";
import { GlobalPodomoroTimer } from "@/apps/clock/ClockApp";

export default function JotaiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      {/* Mount the global timer component here */}
      <GlobalPodomoroTimer />
      {children}
    </Provider>
  );
}
