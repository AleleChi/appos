import { pgTable, text, timestamp, boolean, varchar, unique } from "drizzle-orm/pg-core";

// Users table (Better Auth)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Session table (Better Auth)
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// Account table (Better Auth)
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Verification table (Better Auth)
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  owner_id: text("owner_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 255 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Workspace Members table
export const workspace_members = pgTable("workspace_members", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  user_id: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("member"), // owner, admin, developer, designer, viewer, client
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  unique().on(t.workspace_id, t.user_id)
]);

// Applications table
export const applications = pgTable("applications", {
  id: text("id").primaryKey(),
  workspace_id: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  website_url: text("website_url").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, analyzing, generated, failed
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Assets table
export const assets = pgTable("assets", {
  id: text("id").primaryKey(),
  application_id: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  cloudinary_url: text("cloudinary_url").notNull(),
  asset_type: varchar("asset_type", { length: 100 }).notNull(), // logo, screenshot, icon, splash, raw
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Audit Logs table
export const audit_logs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  event_type: varchar("event_type", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  ip_address: varchar("ip_address", { length: 100 }).notNull(),
  details: text("details").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
