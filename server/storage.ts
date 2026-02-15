import { assessments, type Assessment, type InsertAssessment, users, type User, type InsertUser, userAccounts, type UserAccount, type InsertUserAccount } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getUserAccountById(id: string): Promise<UserAccount | undefined>;
  getUserAccountByEmail(email: string): Promise<UserAccount | undefined>;
  createUserAccount(account: InsertUserAccount): Promise<UserAccount>;
  
  getAssessment(id: string): Promise<Assessment | undefined>;
  getAssessmentByToken(tokenHash: string): Promise<Assessment | undefined>;
  getAssessmentByEmail(email: string): Promise<Assessment | undefined>;
  getAssessmentsByUserId(userId: string): Promise<Assessment[]>;
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
  
  async getUserAccountById(id: string): Promise<UserAccount | undefined> {
    const [account] = await db.select().from(userAccounts).where(eq(userAccounts.id, id));
    return account || undefined;
  }

  async getUserAccountByEmail(email: string): Promise<UserAccount | undefined> {
    const [account] = await db.select().from(userAccounts).where(eq(userAccounts.email, email));
    return account || undefined;
  }

  async createUserAccount(account: InsertUserAccount): Promise<UserAccount> {
    const [created] = await db
      .insert(userAccounts)
      .values(account)
      .returning();
    return created;
  }
  
  async getAssessment(id: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }
  
  async getAssessmentByToken(tokenHash: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.magicTokenHash, tokenHash));
    return assessment || undefined;
  }
  
  async getAssessmentByEmail(email: string): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.customerEmail, email));
    return assessment || undefined;
  }

  async getAssessmentsByUserId(userId: string): Promise<Assessment[]> {
    return await db.select().from(assessments).where(eq(assessments.userId, userId));
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
