export interface Project {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  url: string;
  repoUrl?: string;
  createdAt: string;
  featured?: boolean;
  viewCount?: number;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}
