// src/types.ts

/**
 * Supabase Database Models
 */
export interface Shop {
    id: string;
    phone_number: string;
    shop_name: string;
    upi_id: string;
    created_at?: string;
}

export interface Customer {
    id: string;
    shop_id: string;
    name: string;
    phone_number?: string | null;
    total_balance: number;
    created_at?: string;
}

export interface LedgerEntry {
    id: string;
    shop_id: string;
    customer_id: string;
    type: 'UDHAR' | 'JAMA';
    amount: number;
    created_at?: string;
}

/**
 * NLU & Parser Interfaces
 */
export type IntentType = 'UDHAR' | 'JAMA' | 'QUERY_SINGLE' | 'QUERY_ALL' | 'UNKNOWN';

export interface ParsedIntent {
    intent: IntentType;
    customer_name?: string;
    amount?: number;
}

/**
 * Onboarding Session State
 */
export interface OnboardingSession {
    step: 'NAME' | 'UPI';
    shopName?: string;
}

/**
 * WhatsApp Webhook Event Payloads (Meta Cloud API Standard)
 */
export interface WhatsAppTextMessage {
    type: 'text';
    text: {
        body: string;
    };
}

export interface WhatsAppAudioMessage {
    type: 'audio' | 'voice';
    audio: {
        id: string;
        mime_type?: string;
    };
}

export interface WhatsAppMessageBase {
    from: string;
    id: string;
    timestamp: string;
}

export type WhatsAppIncomingMessage = WhatsAppMessageBase &
    (WhatsAppTextMessage | WhatsAppAudioMessage | { type: string });

export interface WhatsAppWebhookPayload {
    object: string;
    entry?: Array<{
        id: string;
        changes?: Array<{
            value?: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    profile: {
                        name: string;
                    };
                    wa_id: string;
                }>;
                messages?: WhatsAppIncomingMessage[];
            };
            field: string;
        }>;
    }>;
}

/**
 * Sarvam AI STT API Response
 */
export interface SarvamSttResponse {
    transcript: string;
    language_code?: string;
    confidence?: number;
}