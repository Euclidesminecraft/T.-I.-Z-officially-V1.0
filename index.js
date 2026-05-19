import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import axios from 'axios';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const PHONE_NUMBER = process.env.PHONE_NUMBER || '258824410088';

console.log('🤖 Iniciando T.I.Z Bot + DeepSeek...');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "tiz-bot",
        dataPath: "/tmp/wwebjs_auth" // Railway precisa disso
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--no-first-run','--single-process','--disable-gpu']
    }
});

let jaPediuCodigo = false;

client.on('qr', async (qr) => {
    console.log('\n=== QR gerado ===');
    qrcode.generate(qr, { small: true });

    // AQUI é o momento certo para pedir o código
    if (!jaPediuCodigo) {
        jaPediuCodigo = true;
        try {
            // espera 2s para garantir que o puppeteer está pronto
            await new Promise(r => setTimeout(r, 2000));
            const code = await client.requestPairingCode(PHONE_NUMBER);

            console.log('\n========================================');
            console.log('CÓDIGO DE PAREAMENTO:', code);
            console.log('========================================\n');
        } catch (err) {
            console.log('ERRO ao gerar código:', err.message);
            console.log('Verifica se whatsapp-web.js >= 1.23.0 no package.json');
        }
    }
});

client.on('ready', () => console.log('✅ Bot conectado!'));
client.on('authenticated', () => console.log('✅ Autenticado'));
client.on('auth_failure', m => console.error('❌ Falha:', m));

client.on('message', async (msg) => {
    if (msg.fromMe ||!msg.body) return;
    try {
        const res = await axios.post('https://api.deepseek.com/v1/chat/completions',
            { model: 'deepseek-chat', messages: [{role:'user', content: msg.body}] },
            { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}` }, timeout: 30000 }
        );
        await msg.reply(res.data.choices[0].message.content);
    } catch (e) {
        await msg.reply('Erro DeepSeek');
    }
});

client.initialize();
