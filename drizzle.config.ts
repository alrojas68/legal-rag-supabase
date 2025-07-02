import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://postgres:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdmNsbnBheHZianhoa3l1cXBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY4MzMzMSwiZXhwIjoyMDY1MjU5MzMxfQ.aH7VexOH4bZO5bZ-KDgr808NlBk5O2qjrmUOr_LniaU@db.bjvclnpaxvbjxhkyuqps.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  },
  verbose: true,
  strict: true,
} satisfies Config; 