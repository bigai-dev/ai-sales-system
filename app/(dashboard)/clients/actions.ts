"use server";
import { eq } from "drizzle-orm";
import { revalidateTag, revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { parseMoney } from "@/db/lib/money";
import type { Result } from "@/lib/types";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export type NewClientInput = {
  name: string;
  contactName: string;
  contactRole?: string;
  industry?: string;
  size?: "SMB" | "Mid-market" | "Enterprise";
  employees?: number;
  devCount?: number;
  arr?: string; // "RM 70K" — workshop value (excl. SST)
  stage?: typeof clients.$inferInsert.stage;
  health?: number;
  products?: string[];
};

export async function createClient(input: NewClientInput): Promise<Result<{ id: string }>> {
  if (!input.name.trim()) return { ok: false, error: "Name is required" };
  if (!input.contactName.trim()) return { ok: false, error: "Contact is required" };

  const exists = await db.select({ id: clients.id }).from(clients).where(eq(clients.name, input.name));
  if (exists.length > 0) return { ok: false, error: "Client with that name already exists" };

  const [row] = await db
    .insert(clients)
    .values({
      name: input.name.trim(),
      initials: initialsOf(input.name),
      contactName: input.contactName.trim(),
      contactRole: input.contactRole?.trim() || null,
      industry: input.industry?.trim() || null,
      size: input.size ?? "Mid-market",
      employees: input.employees ?? null,
      devCount: input.devCount ?? null,
      arrCents: input.arr ? parseMoney(input.arr) : 0,
      stage: input.stage ?? "Lead",
      health: input.health ?? 50,
      products: input.products ?? [],
      gradient: "",
      lastActivityAt: Date.now(),
    })
    .returning({ id: clients.id });

  revalidateTag("clients", "default");
  revalidateTag("dashboard-kpis", "default");
  revalidatePath("/clients");
  revalidatePath("/");
  revalidatePath("/today");
  return { ok: true, data: { id: row.id } };
}

export type ClientPatch = Partial<NewClientInput>;

export async function updateClient(id: string, patch: ClientPatch): Promise<Result> {
  const set: Partial<typeof clients.$inferInsert> = {};
  if (patch.name !== undefined) {
    set.name = patch.name.trim();
    set.initials = initialsOf(patch.name);
  }
  if (patch.contactName !== undefined) set.contactName = patch.contactName.trim();
  if (patch.contactRole !== undefined) set.contactRole = patch.contactRole.trim() || null;
  if (patch.industry !== undefined) set.industry = patch.industry.trim() || null;
  if (patch.size !== undefined) set.size = patch.size;
  if (patch.employees !== undefined) set.employees = patch.employees;
  if (patch.arr !== undefined) set.arrCents = parseMoney(patch.arr);
  if (patch.stage !== undefined) set.stage = patch.stage;
  if (patch.health !== undefined) set.health = patch.health;
  if (patch.products !== undefined) set.products = patch.products;
  set.lastActivityAt = Date.now();

  await db.update(clients).set(set).where(eq(clients.id, id));
  revalidateTag("clients", "default");
  revalidateTag("dashboard-kpis", "default");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export type DecisionMaker = {
  name: string;
  role: string;
  stance: "champion" | "neutral" | "blocker";
};

export type DiscoveryPatch = {
  goals?: string;
  painPoints?: string;
  currentStack?: string[];
  decisionMakers?: DecisionMaker[];
  budgetSignal?: string;
  timelineSignal?: string;
  source?: "referral" | "cold_inbound" | "event" | "linkedin" | "warm_intro" | "other" | "";
  notes?: string;
};

export async function updateClientDiscovery(
  id: string,
  patch: DiscoveryPatch,
): Promise<Result> {
  const set: Partial<typeof clients.$inferInsert> = {};
  if (patch.goals !== undefined) set.goals = patch.goals.trim() || null;
  if (patch.painPoints !== undefined) set.painPoints = patch.painPoints.trim() || null;
  if (patch.currentStack !== undefined) {
    set.currentStack = patch.currentStack
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (patch.decisionMakers !== undefined) {
    set.decisionMakers = patch.decisionMakers
      .filter((dm) => dm.name.trim())
      .map((dm) => ({
        name: dm.name.trim(),
        role: dm.role.trim(),
        stance: dm.stance,
      }))
      .slice(0, 8);
  }
  if (patch.budgetSignal !== undefined)
    set.budgetSignal = patch.budgetSignal.trim() || null;
  if (patch.timelineSignal !== undefined)
    set.timelineSignal = patch.timelineSignal.trim() || null;
  if (patch.source !== undefined) {
    set.source = patch.source ? patch.source : null;
  }
  if (patch.notes !== undefined) set.notes = patch.notes.trim() || null;
  set.lastActivityAt = Date.now();

  await db.update(clients).set(set).where(eq(clients.id, id));
  revalidateTag("clients", "default");
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}

export async function deleteClient(id: string): Promise<Result> {
  await db.delete(clients).where(eq(clients.id, id));
  revalidateTag("clients", "default");
  revalidateTag("pipeline", "default");
  revalidateTag("dashboard-kpis", "default");
  revalidatePath("/clients");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { ok: true };
}
