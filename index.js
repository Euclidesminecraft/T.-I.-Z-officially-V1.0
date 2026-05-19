import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import axios from 'axios';

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

console.log('🤖 Iniciando Bot WhatsApp + DeepSeek...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('\n=== ESCANEIA ESTE QR NO WHATSAPP ===');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('\n✅ Bot conectado! Pronto para responder.');
});

client.on('message', async msg => {
    if (msg.fromMe || msg.isStatus) return;
    
    try {
        const prompt = msg.body;
        console.log(`📩 Mensagem: ${prompt}`);
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [{role: 'user', content: prompt}]
        }, {
            headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}` }
        });
        
        const reply = response.data.choices[0].message.content;
        await msg.reply(reply);
    } catch (e) {
        console.error(e.message);
        await msg.reply('Erro ao conectar com DeepSeek.');
    }
});

client.initialize();
