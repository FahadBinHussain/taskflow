import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy";

// Create neon client function
const sql: NeonQueryFunction<boolean, boolean> = neon(connectionString);

export const db = drizzle(sql, { schema });
