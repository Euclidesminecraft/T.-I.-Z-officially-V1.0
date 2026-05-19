import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import axios from 'axios';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const PHONE_NUMBER = process.env.PHONE_NUMBER || '258824410088';

if (!DEEPSEEK_KEY) {
    console.error('❌ FALTA DEEPSEEK_API_KEY nas Variables!');
    process.exit(1);
}

console.log('🤖 Iniciando T.I.Z Bot + DeepSeek...');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth', clientId: 'tiz-bot' }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let pairingRequested = false;

client.on('qr', async (qr) => {
    console.log('\n=== QR gerado (usaremos código) ===');
    qrcode.generate(qr, { small: true });

    // Gera código logo no QR - mais estável
    if (!pairingRequested) {
        pairingRequested = true;
        try {
            const code = await client.requestPairingCode(PHONE_NUMBER);
            console.log('\n========================================');
            console.log('CÓDIGO DE PAREAMENTO:', code);
            console.log('Número:', PHONE_NUMBER);
            console.log('WhatsApp > Aparelhos > Conectar com número');
            console.log('========================================\n');
        } catch (err) {
            console.error('Erro ao gerar código:', err.message);
        }
    }
});

client.on('ready', () => {
    console.log('\n✅ Bot conectado e pronto!');
});

client.on('authenticated', () => console.log('✅ Autenticado'));
client.on('auth_failure', (m) => console.error('❌ Auth falhou:', m));
client.on('disconnected', (r) => console.log('⚠️ Desconectado:', r));

client.on('message', async (msg) => {
    if (msg.fromMe || msg.isStatus ||!msg.body) return;

    try {
        console.log(`📩 De ${msg.from}: ${msg.body.substring(0,50)}`);

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: msg.body }],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const reply = response.data.choices[0]?.message?.content || 'Sem resposta';
        await msg.reply(reply);
        console.log('✅ Respondido');

    } catch (error) {
        console.error('Erro DeepSeek:', error.response?.data || error.message);
        await msg.reply('Desculpe, erro ao conectar com a IA. Tente novamente.');
    }
});

client.initialize().catch(err => {
    console.error('Erro ao iniciar:', err);
    process.exit(1);
});

// Keep alive para Railway
process.on('SIGTERM', async () => {
    await client.destroy();
    process.exit(0);
});
