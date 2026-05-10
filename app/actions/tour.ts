"use server";
import { getDemoTargets, type DemoTargets } from "@/lib/queries/demo-targets";

export async function fetchDemoTargets(): Promise<DemoTargets> {
  return getDemoTargets();
}
