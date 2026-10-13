import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import type { UserModel, SessionModel, AuthAttemptModel } from "@/server/models/user";
import { DEFAULT_AVATAR, type UserProfile } from "@/server/domain/auth";

const state = globalThis as typeof globalThis & { accountIndexes?: Promise<void> };

export async function accountCollections() {
  const db = await getDatabase();
  const users = db.collection<UserModel>("users");
  const sessions = db.collection<SessionModel>("auth_sessions");
  const attempts = db.collection<AuthAttemptModel>("auth_attempts");
  state.accountIndexes ??= Promise.all([
    users.createIndex({ email: 1 }, { unique: true, name: "users_email_unique" }),
    users.createIndex({ "passwordReset.tokenHash": 1 }, { sparse: true, name: "users_reset_token" }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    sessions.createIndex({ userId: 1 }),
    attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]).then(() => {}).catch(error => { state.accountIndexes = undefined; throw error; });
  await state.accountIndexes;
  return { users, sessions, attempts };
}

export async function findUserByEmail(email: string) { return (await accountCollections()).users.findOne({ email }); }
export async function findUserById(id: ObjectId) { return (await accountCollections()).users.findOne({ _id: id }); }

export async function createUser(email: string, passwordHash: string, avatarUrl = DEFAULT_AVATAR) {
  const now = new Date();
  const user: UserModel = { _id: new ObjectId(), email, passwordHash, role: "user", authVersion: 0, fullName: "", phone: "", address: "", avatarUrl, createdAt: now, updatedAt: now };
  await (await accountCollections()).users.insertOne(user);
  return user;
}

export async function updateUserProfile(id: ObjectId, authVersion: number, profile: UserProfile) {
  return (await accountCollections()).users.findOneAndUpdate({ _id: id, authVersion }, {
    $set: { fullName: profile.fullName, phone: profile.phone, address: profile.address, avatarUrl: profile.avatarUrl, updatedAt: new Date() },
  }, { returnDocument: "after" });
}

export async function isUserAvatarReferenced(avatarUrl: string) {
  return !!await (await accountCollections()).users.findOne({ avatarUrl }, { projection: { _id: 1 } });
}

export async function changeUserPassword(user: UserModel, passwordHash: string, adminEmail: string) {
  return (await accountCollections()).users.findOneAndUpdate({
    _id: user._id, authVersion: user.authVersion, passwordHash: user.passwordHash, role: "user", email: { $ne: adminEmail },
  }, { $set: { passwordHash, updatedAt: new Date() }, $inc: { authVersion: 1 }, $unset: { passwordReset: "" } }, { returnDocument: "after" });
}

export async function provisionAdmin(email: string, passwordHash: string) {
  const now = new Date();
  return (await accountCollections()).users.findOneAndUpdate({ email }, {
    $set: { passwordHash, role: "admin", updatedAt: now },
    $setOnInsert: { createdAt: now, authVersion: 0 },
    $unset: { passwordReset: "" },
  }, { upsert: true, returnDocument: "after" });
}

export async function saveSession(session: SessionModel) { await (await accountCollections()).sessions.insertOne(session); }
export async function findSession(tokenHash: string) { return (await accountCollections()).sessions.findOne({ _id: tokenHash, expiresAt: { $gt: new Date() } }); }
export async function deleteSession(tokenHash: string) { await (await accountCollections()).sessions.deleteOne({ _id: tokenHash }); }

export async function setResetToken(userId: ObjectId, tokenHash: string, expiresAt: Date) {
  await (await accountCollections()).users.updateOne({ _id: userId }, { $set: { passwordReset: { tokenHash, expiresAt } } });
}
export async function clearResetToken(userId: ObjectId, tokenHash: string) {
  await (await accountCollections()).users.updateOne({ _id: userId, "passwordReset.tokenHash": tokenHash }, { $unset: { passwordReset: "" } });
}
export async function consumeResetToken(tokenHash: string, passwordHash: string, adminEmail: string) {
  // One atomic update consumes the token and invalidates all prior sessions, including racing requests.
  return (await accountCollections()).users.findOneAndUpdate({
    "passwordReset.tokenHash": tokenHash, "passwordReset.expiresAt": { $gt: new Date() },
    email: { $ne: adminEmail }, role: "user",
  }, { $set: { passwordHash, updatedAt: new Date() }, $inc: { authVersion: 1 }, $unset: { passwordReset: "" } }, { returnDocument: "after" });
}

export async function recordAuthAttempt(id: string, expiresAt: Date) {
  const { attempts } = await accountCollections();
  try {
    return await attempts.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt } }, { upsert: true, returnDocument: "after" });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    return attempts.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after" });
  }
}
