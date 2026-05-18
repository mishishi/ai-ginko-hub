-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_project_id ON favorites(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at_ts ON projects(created_at_ts);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
