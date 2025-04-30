"use client";

import React from "react";
import { Provider } from "jotai";
import { GlobalPodomoroTimer } from "../(clock)/ClockApp";
import { AuthInitializer } from "../auth/AuthInitializer";

export default function JotaiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider>
      <AuthInitializer />
      {/* Mount the global timer component here */}
      <GlobalPodomoroTimer />
      {children}
    </Provider>
  );
}
