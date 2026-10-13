// src/services/db.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getShopByPhone(phone: string) {
    const { data } = await supabase.from('shops').select('*').eq('phone_number', phone).single();
    return data;
}

export async function createShop(phone: string, shopName: string, upiId: string) {
    const { data, error } = await supabase.from('shops').insert([{ phone_number: phone, shop_name: shopName, upi_id: upiId }]).select().single();
    if (error) throw error;
    return data;
}

export async function recordTransaction(shopId: string, customerName: string, amount: number, type: 'UDHAR' | 'JAMA') {
    // 1. Get or create customer
    let { data: customer } = await supabase.from('customers').select('*').eq('shop_id', shopId).ilike('name', customerName).single();

    if (!customer) {
        const { data: newCust, error } = await supabase.from('customers').insert([{ shop_id: shopId, name: customerName, total_balance: 0 }]).select().single();
        if (error) throw error;
        customer = newCust;
    }

    // 2. Add ledger entry
    await supabase.from('ledger_entries').insert([{ shop_id: shopId, customer_id: customer.id, type, amount }]);

    // 3. Update customer balance
    const balanceChange = type === 'UDHAR' ? amount : -amount;
    const newBalance = Number(customer.total_balance) + balanceChange;

    await supabase.from('customers').update({ total_balance: newBalance }).eq('id', customer.id);

    return { customerName: customer.name, newBalance };
}

export async function getCustomerBalance(shopId: string, customerName: string) {
    const { data: customer } = await supabase.from('customers').select('*').eq('shop_id', shopId).ilike('name', customerName).single();
    return customer ? customer.total_balance : null;
}

export async function getAllPendingUdhar(shopId: string) {
    const { data } = await supabase.from('customers').select('name, total_balance').eq('shop_id', shopId).gt('total_balance', 0);
    return data || [];
}