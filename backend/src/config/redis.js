const { createClient } = require("redis");
require("dotenv").config();

const redisClient = createClient({
    username: "default",
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        // ❌ tls NOT enabled (VERY IMPORTANT)
    },
});

redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error("❌ Redis connection failed:", err.message);
    }
})();

const getRedisClient = () => redisClient;

module.exports = { getRedisClient };
