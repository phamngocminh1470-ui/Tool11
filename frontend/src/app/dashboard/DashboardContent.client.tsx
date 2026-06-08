"use client";

import React from "react";
import dynamic from "next/dynamic";

const DashboardContent = dynamic(
  () => import("./DashboardContent"),
  { ssr: false }
);

export default function DashboardContentClient() {
  return <DashboardContent />;
}
