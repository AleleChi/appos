import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.string().nullable().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  industry: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Application {
  id: string;
  workspace_id: string;
  name: string;
  website_url: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}
