import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import axios from 'axios';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const PHONE_NUMBER = process.env.PHONE_NUMBER || '258824410088';

console.log('🤖 Iniciando T.I.Z Bot + DeepSeek...');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "tiz-bot" }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--no-first-run','--single-process','--disable-gpu']
    }
});

client.on('qr', (qr) => {
    console.log('\n=== QR gerado (ignorar) ===');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('\n✅ Bot conectado! Pronto.'));
client.on('authenticated', () => console.log('✅ Autenticado!'));
client.on('auth_failure', msg => console.error('❌ Falha:', msg));

client.on('message', async (msg) => {
    if (msg.fromMe || msg.isStatus) return;
    try {
        const prompt = msg.body;
        console.log(`📩 ${prompt}`);
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions',
            { model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }] },
            { headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}` } }
        );
        await msg.reply(response.data.choices[0].message.content);
    } catch (e) {
        console.error('Erro:', e.message);
        await msg.reply('Erro ao conectar com DeepSeek.');
    }
});

client.initialize();

setTimeout(async () => {
    try {
        const code = await client.requestPairingCode(PHONE_NUMBER);
        console.log('\n========================================');
        console.log('CÓDIGO DE PAREAMENTO:', code);
        console.log(`Número: ${PHONE_NUMBER}`);
        console.log('WhatsApp > Aparelhos > Conectar com número');
        console.log('========================================\n');
    } catch (err) {
        console.log('Erro código:', err.message);
    }
}, 10000);
