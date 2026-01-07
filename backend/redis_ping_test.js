const { createClient } = require('redis');
require('dotenv').config();

(async () => {
    console.log('🔄 Connecting to Redis...');

    const client = createClient({
        username: 'default',
        password: process.env.REDIS_PASSWORD,
        socket: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT)
        }
    });

    client.on('error', (err) => console.log('❌ Redis Client Error', err));

    try {
        await client.connect();
        console.log('✅ Connected!');

        console.log('📤 Sending PING...');
        const reply = await client.ping();
        console.log(`📥 Received: ${reply}`); // Should print 'PONG'

        await client.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
})();
