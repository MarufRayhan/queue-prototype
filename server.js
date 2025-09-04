// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const next = require("next");
const Redis = require("ioredis");
const cors = require("cors");
require("dotenv").config();

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Connect to Upstash Redis
const redis = new Redis(process.env.REDIS_URL);

redis
  .ping()
  .then(() => console.log("✅ Connected to Redis"))
  .catch((err) => console.error("❌ Redis connection failed:", err));

// Queue metrics
let metrics = { totalServed: 0, serviceTimes: [], averageWaitTime: 3.5 };
let currentServingNumber = 0;
let queueCounter = 0;
let activeQueues = new Map();

// Initialize Redis
async function initRedis() {
  await redis.flushdb();
  console.log("Redis initialized - Queue cleared");
}

// Calculate average service time
function calculateAverageServiceTime() {
  if (metrics.serviceTimes.length === 0) return 3.5;
  const sum = metrics.serviceTimes.reduce((a, b) => a + b, 0);
  return (sum / metrics.serviceTimes.length / 1000 / 60).toFixed(1);
}

// Get queue stats
async function getQueueStats() {
  const queueLength = await redis.zcard("queue");
  const queueData = await redis.zrange("queue", 0, 4);
  const nextInQueue = queueData
    .map((data) => {
      try {
        return JSON.parse(data).number;
      } catch {
        return null;
      }
    })
    .filter((n) => n !== null);

  return {
    currentServing: currentServingNumber,
    queueLength,
    nextInQueue,
    averageWaitTime: calculateAverageServiceTime(),
    totalServedToday: metrics.totalServed,
  };
}

// --- API ROUTES ---

// Join queue
app.post("/api/queue/join", async (req, res) => {
  const startTime = Date.now();
  queueCounter++;

  const customerData = {
    number: queueCounter,
    timestamp: startTime,
    estimatedWait: 0,
  };
  await redis.zadd("queue", startTime, JSON.stringify(customerData));

  const allQueue = await redis.zrange("queue", 0, -1);
  const position =
    allQueue.findIndex((item) => JSON.parse(item).number === queueCounter) + 1;

  customerData.estimatedWait =
    position * parseFloat(calculateAverageServiceTime());
  activeQueues.set(queueCounter, startTime);

  io.emit("queue-joined", {
    number: queueCounter,
    queueLength: await redis.zcard("queue"),
  });

  res.json({
    success: true,
    number: queueCounter,
    position,
    estimatedWait: customerData.estimatedWait,
    responseTime: Date.now() - startTime,
  });
});

// Call next customer
app.post("/api/queue/next", async (req, res) => {
  const startTime = Date.now();
  const next = await redis.zpopmin("queue");

  if (next && next.length > 0) {
    const customerData = JSON.parse(next[0]);
    currentServingNumber = customerData.number;

    const waitTime = Date.now() - customerData.timestamp;
    metrics.serviceTimes.push(waitTime);
    metrics.totalServed++;

    if (metrics.serviceTimes.length > 50) metrics.serviceTimes.shift();
    activeQueues.delete(customerData.number);

    const stats = await getQueueStats();
    io.emit("customer-called", {
      number: currentServingNumber,
      stats,
      actualWaitTime: Math.round(waitTime / 1000 / 60),
    });

    res.json({
      success: true,
      number: currentServingNumber,
      stats,
      responseTime: Date.now() - startTime,
    });
  } else {
    res.json({
      success: false,
      message: "Queue is empty",
      responseTime: Date.now() - startTime,
    });
  }
});

// Get queue status
app.get("/api/queue/status", async (req, res) => {
  const stats = await getQueueStats();
  res.json({ ...stats, responseTime: Date.now() - req.startTime });
});

// Clear queue
app.post("/api/queue/clear", async (req, res) => {
  await redis.flushdb();
  queueCounter = 0;
  currentServingNumber = 0;
  metrics = { totalServed: 0, serviceTimes: [], averageWaitTime: 3.5 };
  activeQueues.clear();

  io.emit("queue-cleared");
  res.json({ success: true, message: "Queue cleared" });
});

// --- SOCKET.IO ---

io.on("connection", (socket) => {
  console.log("👤 Client connected:", socket.id);

  getQueueStats().then((stats) => {
    socket.emit("initial-stats", stats);
  });

  socket.on("disconnect", () => {
    console.log("👤 Client disconnected:", socket.id);
  });
});

// --- SERVE NEXT.JS FRONTEND ---

nextApp.prepare().then(() => {
  app.all("*", (req, res) => handle(req, res)); // Next.js handles frontend routes

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(
      `📡 Ready for connections at https://queue-prototype.onrender.com`
    );
  });
});

// Initialize Redis at startup
initRedis().catch((err) => console.error("Failed to initialize Redis:", err));
