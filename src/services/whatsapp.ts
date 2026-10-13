// src/services/whatsapp.ts
import axios from 'axios';

export function generateUpiLink(upiId: string, shopName: string, amount: number): string {
    const note = encodeURIComponent(`Udhar payment - ${shopName}`);
    const encodedShop = encodeURIComponent(shopName);
    return `upi://pay?pa=${upiId}&pn=${encodedShop}&am=${amount}&tn=${note}&cu=INR`;
}

export async function sendWhatsAppMessage(to: string, messageText: string) {
    await axios.post(
        `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: messageText }
        },
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` } }
    );
}

export async function downloadWhatsAppAudio(mediaId: string): Promise<Buffer> {
    const mediaUrlRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` }
    });

    const audioRes = await axios.get(mediaUrlRes.data.url, {
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` },
        responseType: 'arraybuffer'
    });

    return Buffer.from(audioRes.data);
}