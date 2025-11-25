/**
 * AETHER V5 - Family Office
 * Multi-user wealth management with hierarchical permissions
 */

import { getDb } from "./db";
import { familyGroups, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function createFamilyGroup(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(familyGroups).values({
    name,
    createdBy: userId,
  });

  const familyId = Number((result as any).insertId);

  // Update creator to be family_admin
  await db.update(users)
    .set({ familyId, role: "family_admin" })
    .where(eq(users.id, userId));

  return familyId;
}

export async function getFamilyGroup(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || !user[0].familyId) return null;

  const family = await db.select().from(familyGroups).where(eq(familyGroups.id, user[0].familyId)).limit(1);
  return family[0] || null;
}

export async function getFamilyMembers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || !user[0].familyId) return [];

  const members = await db.select().from(users).where(eq(users.familyId, user[0].familyId));
  
  // Add mock net worth for each member
  return members.map(member => ({
    ...member,
    netWorth: Math.random() * 10000000, // Mock data
  }));
}

export async function getConsolidatedWealth(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const members = await getFamilyMembers(userId);
  
  const totalNetWorth = members.reduce((sum, m) => sum + (m.netWorth || 0), 0);
  
  return {
    totalNetWorth,
    totalAssets: totalNetWorth * 1.1, // Mock: assets slightly higher than net worth
    assetCount: members.length * 5, // Mock: ~5 assets per member
    yearToDateReturn: 8.3, // Mock return
  };
}

export async function inviteFamilyMember(userId: number, email: string, role: "family_admin" | "family_viewer") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!currentUser[0] || !currentUser[0].familyId) {
    throw new Error("User not in a family group");
  }

  // Check if user is admin
  if (currentUser[0].role !== "family_admin" && currentUser[0].role !== "admin") {
    throw new Error("Only family admins can invite members");
  }

  // Check if email already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser[0]) {
    // Update existing user
    await db.update(users)
      .set({ familyId: currentUser[0].familyId, role })
      .where(eq(users.id, existingUser[0].id));
  } else {
    // In production: send email invitation
    // For now, just log
    console.log(`Invitation sent to ${email} with role ${role}`);
  }

  return true;
}

export async function removeFamilyMember(userId: number, memberIdToRemove: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!currentUser[0] || !currentUser[0].familyId) {
    throw new Error("User not in a family group");
  }

  // Check if user is admin
  if (currentUser[0].role !== "family_admin" && currentUser[0].role !== "admin") {
    throw new Error("Only family admins can remove members");
  }

  // Remove member from family
  await db.update(users)
    .set({ familyId: null, role: "user" })
    .where(eq(users.id, memberIdToRemove));

  return true;
}
