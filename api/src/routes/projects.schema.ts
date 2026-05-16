import { z } from 'zod';

export const createProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  tags: z.array(z.string()).min(1, 'tags must be a non-empty array'),
  url: z.string().min(1, 'url is required'),
  thumbnail: z.string().optional(),
  repoUrl: z.string().optional(),
  createdAt: z.string().optional(),
  featured: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
