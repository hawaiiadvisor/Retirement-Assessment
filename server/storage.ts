import { assessments, type Assessment, type InsertAssessment, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentByToken(tokenHash: string): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }
  
  async getAssessmentByToken(tokenHash: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.magicTokenHash, tokenHash));
    return assessment || undefined;
  }
  
  async createAssessment(insertAssessment: InsertAssessment): Promise<Assessment> {
    const [assessment] = await db
      .insert(assessments)
      .values(insertAssessment)
      .returning();
    return assessment;
  }
  
  async updateAssessment(id: string, updates: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [assessment] = await db
      .update(assessments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return assessment || undefined;
  }
}

export const storage = new DatabaseStorage();
