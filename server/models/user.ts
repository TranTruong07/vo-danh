import type { ObjectId } from "mongodb";
import type { UserProfile, UserRole } from "@/server/domain/auth";

export interface UserModel extends Partial<UserProfile> {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  authVersion: number;
  createdAt: Date;
  updatedAt: Date;
  passwordReset?: { tokenHash: string; expiresAt: Date };
}

export interface SessionModel {
  _id: string; // SHA-256 of the opaque cookie token; never store the raw token.
  userId: ObjectId;
  authVersion: number;
  adminConfigHash?: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthAttemptModel {
  _id: string;
  count: number;
  expiresAt: Date;
}
