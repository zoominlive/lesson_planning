import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

let mysqlDb: any = null;
let mysqlPool: mysql.Pool | null = null;

export async function initMySQLDatabase() {
  if (mysqlDb) {
    return mysqlDb;
  }

  const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;
  
  if (!MYSQL_URL) {
    throw new Error("MYSQL_URL or DATABASE_URL must be set for MySQL connection");
  }

  console.log('[MySQL] Initializing MySQL connection...');
  
  mysqlPool = mysql.createPool(MYSQL_URL);
  
  // Test connection
  try {
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();
    console.log('[MySQL] Connection successful');
  } catch (error) {
    console.error('[MySQL] Connection failed:', error);
    throw error;
  }

  mysqlDb = drizzle(mysqlPool, { schema, mode: 'default' });
  
  return mysqlDb;
}

export { mysqlDb, mysqlPool };