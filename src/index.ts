// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { getShopByPhone, createShop, recordTransaction, getCustomerBalance, getAllPendingUdhar } from './services/db';
import { transcribeAudioBuffer } from './services/stt';
import { parseGujaratiInput } from './services/parser';
import { sendWhatsAppMessage, downloadWhatsAppAudio, generateUpiLink } from './services/whatsapp';

const app = express();
app.use(express.json());

// Onboarding Session state in-memory (for simple 1-day build)
const onboardingState: Record<string, { step: 'NAME' | 'UPI'; shopName?: string }> = {};

app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Instant ACK

    try {
        const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
        const message = entry?.messages?.[0];
        if (!message) return;

        const from = message.from; // Sender phone number
        let shop = await getShopByPhone(from);

        // --- ONBOARDING FLOW ---
        if (!shop) {
            if (!onboardingState[from]) {
                onboardingState[from] = { step: 'NAME' };
                await sendWhatsAppMessage(from, "🙏 *UdharBhai (ઉધરભાઈ) ma swagat che!*\n\nTamari dukan nu naam lakho:");
                return;
            }

            if (onboardingState[from].step === 'NAME' && message.type === 'text') {
                onboardingState[from].shopName = message.text.body;
                onboardingState[from].step = 'UPI';
                await sendWhatsAppMessage(from, "✅ Dukan nu naam save thagyu.\n\nHave tamaro *UPI ID* aapoji (e.g. 9876543210@paytm, shop@okicici):");
                return;
            }

            if (onboardingState[from].step === 'UPI' && message.type === 'text') {
                const upiId = message.text.body.trim();
                shop = await createShop(from, onboardingState[from].shopName!, upiId);
                delete onboardingState[from];
                await sendWhatsAppMessage(from, `🎉 *Setup Complete!*\n\nDukan: ${shop.shop_name}\nUPI: ${shop.upi_id}\n\nHave tame Voice Note ya Text ma Udhar/Jama entry kari sako che!\nExample: *"Ramesh 500 udhar"*`);
                return;
            }
            return;
        }

        // --- INPUT TRANSCRIPTION ---
        let inputText = '';
        if (message.type === 'audio' || message.type === 'voice') {
            const audioBuffer = await downloadWhatsAppAudio(message.audio.id);
            inputText = await transcribeAudioBuffer(audioBuffer);
        } else if (message.type === 'text') {
            inputText = message.text.body;
        }

        if (!inputText) return;

        // --- PARSE INTENT & EXECUTE ---
        const parsed = await parseGujaratiInput(inputText);

        switch (parsed.intent) {
            case 'UDHAR': {
                if (!parsed.customer_name || !parsed.amount) break;
                const result = await recordTransaction(shop.id, parsed.customer_name, parsed.amount, 'UDHAR');

                await sendWhatsAppMessage(
                    from,
                    `✅ *${result.customerName} bhai* ne *₹${parsed.amount}* udhar liya.\n📊 Total Udhar: *₹${result.newBalance}*`
                );
                break;
            }

            case 'JAMA': {
                if (!parsed.customer_name || !parsed.amount) break;
                const result = await recordTransaction(shop.id, parsed.customer_name, parsed.amount, 'JAMA');

                await sendWhatsAppMessage(
                    from,
                    `✅ *${result.customerName} bhai* e *₹${parsed.amount}* jama kariya.\n📊 Baaki Udhar: *₹${result.newBalance}*`
                );
                break;
            }

            case 'QUERY_SINGLE': {
                if (!parsed.customer_name) break;
                const balance = await getCustomerBalance(shop.id, parsed.customer_name);
                if (balance === null) {
                    await sendWhatsAppMessage(from, `🔍 ${parsed.customer_name} bhai nu koi account nathi milyu.`);
                } else {
                    await sendWhatsAppMessage(from, `📊 *${parsed.customer_name} bhai* nu total udhar: *₹${balance}* che.`);
                }
                break;
            }

            case 'QUERY_ALL': {
                const list = await getAllPendingUdhar(shop.id);
                if (list.length === 0) {
                    await sendWhatsAppMessage(from, "🎉 Koi udhar baki nathi!");
                } else {
                    let summary = "📊 *Baki Udhar List:*\n\n";
                    list.forEach((item) => {
                        summary += `• ${item.name}: *₹${item.total_balance}*\n`;
                    });
                    await sendWhatsAppMessage(from, summary);
                }
                break;
            }

            default:
                await sendWhatsAppMessage(from, "🙏 Samajh na aavyu. Kripya farithi bolo ya lakho.\nExample: *'Ramesh 500 udhar'*");
        }
    } catch (error) {
        console.error('Webhook Error:', error);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 UdharBhai server running on port ${PORT}`));