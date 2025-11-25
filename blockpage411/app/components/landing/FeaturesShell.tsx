"use client";
import dynamic from "next/dynamic";

const DynamicFeatures = dynamic(() => import("./FeaturesClient"), { ssr: false });

export default function FeaturesShell() {
  return <DynamicFeatures />;
}
