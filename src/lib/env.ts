import { z } from 'zod';

const envSchema = z.object({
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_FOUNDER_NAME: z.string().optional(),
  NEXT_PUBLIC_FOUNDER_TITLE: z.string().optional(),

  // Authentication
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),

  // QR Code Security
  QR_SECRET: z.string().min(32, 'QR_SECRET must be at least 32 characters'),

  // Vercel Blob Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Cron Jobs
  CRON_SECRET: z.string().min(32, 'CRON_SECRET must be at least 32 characters'),

  // Email Notifications (Resend)
  RESEND_API_KEY: z.string().optional(),

  // Demo Seed
  SEED_DEMO: z.string().optional().transform((val) => val === 'true'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter((e) => e.code === 'invalid_type')
        .map((e) => e.path.join('.'))
        .join(', ');
      
      throw new Error(
        `Variables d'environnement manquantes ou invalides: ${missingVars}\n` +
        `Vérifiez votre fichier .env ou .env.example`
      );
    }
    throw error;
  }
}

export const env = validateEnv();
