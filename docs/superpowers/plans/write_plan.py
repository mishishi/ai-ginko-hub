#!/usr/bin/env python3
import os

path = '/Users/zhurenbao/Jason/ai-workspaces/ai-ginko-hub/docs/superpowers/plans/2026-05-16-ginko-hub-phase-2-backend-cms.md'

sections = """

## File Structure

```
ai-ginko-hub/
├── api/                          # Fastify backend (new)
│   ├── src/
│   │   ├── index.ts              # API entry, register plugins
│   │   ├── app.ts                # Fastify instance factory
│   │   ├── db/
│   │   │   ├── index.ts         # Drizzle client + SQLite connection
│   │   │   └── schema.ts        # Drizzle schema (projects, admin)
│   │   ├── routes/
│   │   │   ├── projects.ts      # GET/POST/PUT/DELETE /api/projects
│   │   │   ├── auth.ts          # POST /api/auth/login, GET /api/auth/me
│   │   │   ├── upload.ts        # POST /api/upload (presigned URL)
│   │   │   └── stats.ts         # GET /api/stats
│   │   └── middleware/
│   │       └── auth.ts           # JWT verification middleware
│   ├── drizzle.config.ts         # Drizzle config
│   └── package.json
├── src/
│   ├── admin/                    # Admin React app (new)
│   │   ├── index.tsx            # Admin entry (separate mount)
│   │   ├── AdminApp.tsx         # Admin layout + routes
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectListPage.tsx
│   │   │   └── ProjectFormPage.tsx
│   │   ├── components/
│   │   │   ├── AdminLayout.tsx
│   │   │   └── ProjectForm.tsx
│   │   └── hooks/
│   │       └── useAdminAuth.ts
│   ├── App.tsx                   # Modified: add /admin route
│   └── main.tsx                 # Modified: mount AdminApp at #admin-root
└── .env.example
```

"""

with open(path, 'a') as f:
    f.write(sections)
print('ok')
