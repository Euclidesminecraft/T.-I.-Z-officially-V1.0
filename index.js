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

// QR ainda aparece mas vamos ignorar
client.on('qr', (qr) => {
    console.log('\n=== QR gerado (ignorar, usando código) ===');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot conectado! Pronto para responder.');
});

client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('message', async (msg) => {
    if (msg.fromMe || msg.isStatus) return;

    try {
        const prompt = msg.body;
        console.log(`📩 Mensagem: ${prompt}`);

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}` }
            }
        );

        const reply = response.data.choices[0].message.content;
        await msg.reply(reply);
        console.log(`✅ Respondido`);

    } catch (e) {
        console.error('Erro DeepSeek:', e.message);
        await msg.reply('Erro ao conectar com DeepSeek.');
    }
});

// INICIA E GERA CÓDIGO DE PAREAMENTO
client.initialize();

setTimeout(async () => {
    try {
        console.log('\n🔄 Gerando código de pareamento...');
        const code = await client.requestPairingCode(PHONE_NUMBER);

        console.log('\n========================================');
        console.log('=== CÓDIGO DE PAREAMENTO WHATSAPP ===');
        console.log(`Número: ${PHONE_NUMBER}`);
        console.log(`Código: ${code}`);
        console.log('========================================');
        console.log('WhatsApp > Aparelhos conectados >');
        console.log('Conectar com número de telefone');
        console.log('========================================\n');

    } catch (err) {
        console.log('Erro ao gerar código:', err.message);
    }
}, 10000);
