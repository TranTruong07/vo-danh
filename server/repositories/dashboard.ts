import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { CharacterModel } from "@/server/models/character";
import type { UserModel } from "@/server/models/user";

export async function readDashboard(since: Date) {
  const db = await getDatabase();
  const characters = db.collection<CharacterModel>("characters");
  const users = db.collection<UserModel>("users");
  const [totalCharacters, totalUsers, registrations, recent] = await Promise.all([
    characters.countDocuments(),
    users.countDocuments({ role: "user" }),
    users.aggregate<{ _id: string; count: number }>([
      { $match: { role: "user", createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+07:00" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
    characters.find({}, { projection: { name: 1, openingLine: 1, updatedAt: 1 } }).sort({ updatedAt: -1 }).limit(5).toArray(),
  ]);
  return { totalCharacters, publishedCharacters: totalCharacters, totalUsers, registrations, recent: recent.map(row => ({ id: row._id.toHexString(), name: row.name, openingLine: row.openingLine || "", published: true, updatedAt: row.updatedAt.toISOString() })) };
}
