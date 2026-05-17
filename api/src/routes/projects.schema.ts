import { z } from 'zod';

export const createProjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'name is required'),
  description: z.string().min(1, 'description is required'),
  tags: z.array(z.string()).min(1, 'tags must be a non-empty array'),
  url: z.string().url('url must be a valid URL'),
  thumbnail: z.string().url('thumbnail must be a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('repoUrl must be a valid URL').optional().or(z.literal('')),
  createdAt: z.string().optional(),
  featured: z.boolean().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
