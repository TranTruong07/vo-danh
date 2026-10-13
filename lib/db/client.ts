import "server-only";
import { MongoClient } from "mongodb";

const state = globalThis as typeof globalThis & { mongodbClient?: Promise<MongoClient> };

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) throw new Error("Chưa cấu hình MONGODB_URI.");
  if (!state.mongodbClient) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
    state.mongodbClient = client.connect().catch(async error => {
      state.mongodbClient = undefined;
      await client.close();
      throw error;
    });
  }
  return state.mongodbClient;
}

export async function getDatabase() {
  return (await getMongoClient()).db(process.env.MONGODB_DB_NAME?.trim() || undefined);
}
