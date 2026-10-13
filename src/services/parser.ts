// src/services/parser.ts
import axios from 'axios';

export interface ParsedIntent {
    intent: 'UDHAR' | 'JAMA' | 'QUERY_SINGLE' | 'QUERY_ALL' | 'UNKNOWN';
    customer_name?: string;
    amount?: number;
}

export async function parseGujaratiInput(input: string): Promise<ParsedIntent> {
    const systemPrompt = `You are a Gujarati financial transaction extraction engine for "UdharBhai".
Parse the input and extract structured json.

Input options:
1. Credit entry: "Ramesh 500 udhar diyo" -> {"intent": "UDHAR", "customer_name": "Ramesh", "amount": 500}
2. Payment entry: "Patel 200 jama mili" or "Patel ne pandarsau (1500) jama" -> {"intent": "JAMA", "customer_name": "Patel", "amount": 200}
3. Balance query: "Ramesh nu ketlu baki che?" -> {"intent": "QUERY_SINGLE", "customer_name": "Ramesh"}
4. All balance query: "Sab nu ketlu udhar che?" -> {"intent": "QUERY_ALL"}

Rules:
- Normalize spoken Gujarati numbers (e.g., pandarsau -> 1500, dedh so -> 150, ek hazar -> 1000).
- Strip honorifics like 'bhai', 'kaka', 'seth' from customer_name.
- Output ONLY valid JSON matching: {"intent": "UDHAR"|"JAMA"|"QUERY_SINGLE"|"QUERY_ALL"|"UNKNOWN", "customer_name"?: string, "amount"?: number}`;

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input }
            ],
            response_format: { type: 'json_object' }
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    return JSON.parse(response.data.choices[0].message.content);
}