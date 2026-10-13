// src/config.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
    port: number;
    supabase: {
        url: string;
        serviceRoleKey: string;
    };
    sarvam: {
        apiKey: string;
    };
    groq: {
        apiKey: string;
    };
    whatsapp: {
        apiToken: string;
        phoneNumberId: string;
    };
}

// Ensure required environment variables are present before startup
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SARVAM_API_KEY',
    'GROQ_API_KEY',
    'WHATSAPP_API_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`❌ Missing required environment variable: ${envVar}`);
    }
}

export const config: Config = {
    port: parseInt(process.env.PORT || '3000', 10),
    supabase: {
        url: process.env.SUPABASE_URL!,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    sarvam: {
        apiKey: process.env.SARVAM_API_KEY!,
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY!,
    },
    whatsapp: {
        apiToken: process.env.WHATSAPP_API_TOKEN!,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    },
};