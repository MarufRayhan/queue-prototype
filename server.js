const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Connect to Upstash using environment variable
const redis = new Redis(process.env.REDIS_URL);

// Test Redis connection
redis
  .ping()
  .then(() => {
    console.log("✅ Connected to Upstash Redis!");
  })
  .catch((err) => {
    console.error("❌ Redis connection failed:", err);
  });

// Store metrics
let metrics = {
  totalServed: 0,
  serviceTimes: [],
  averageWaitTime: 3.5,
};

// Queue state
let currentServingNumber = 0;
let queueCounter = 0;
let activeQueues = new Map();

// Initialize Redis
async function initRedis() {
  await redis.flushdb();
  console.log("Redis initialized - Queue cleared");
}

// Calculate real average service time
function calculateAverageServiceTime() {
  if (metrics.serviceTimes.length === 0) return 3.5;
  const sum = metrics.serviceTimes.reduce((a, b) => a + b, 0);
  return (sum / metrics.serviceTimes.length / 1000 / 60).toFixed(1);
}

// Get queue statistics
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

// API: Join queue
app.post("/api/queue/join", async (req, res) => {
  const startTime = Date.now();
  queueCounter++;

  const customerData = {
    number: queueCounter,
    timestamp: startTime,
    estimatedWait: 0,
  };

  // Add to Redis
  await redis.zadd("queue", startTime, JSON.stringify(customerData));

  // Get position
  const allQueue = await redis.zrange("queue", 0, -1);
  const position =
    allQueue.findIndex((item) => {
      try {
        return JSON.parse(item).number === queueCounter;
      } catch {
        return false;
      }
    }) + 1;

  customerData.estimatedWait =
    position * parseFloat(calculateAverageServiceTime());

  activeQueues.set(queueCounter, startTime);

  // Emit update
  io.emit("queue-joined", {
    number: queueCounter,
    queueLength: await redis.zcard("queue"),
  });

  const responseTime = Date.now() - startTime;
  console.log(
    `✅ Customer ${queueCounter} joined. Position: ${position}. Response time: ${responseTime}ms`
  );

  res.json({
    success: true,
    number: queueCounter,
    position: position,
    estimatedWait: customerData.estimatedWait,
    responseTime,
  });
});

// API: Call next customer
app.post("/api/queue/next", async (req, res) => {
  const startTime = Date.now();

  // Get next customer
  const next = await redis.zpopmin("queue");

  if (next && next.length > 0) {
    let customerData;
    try {
      customerData = JSON.parse(next[0]);
    } catch {
      res.json({ success: false, message: "Invalid queue data" });
      return;
    }

    currentServingNumber = customerData.number;

    // Calculate wait time
    const waitTime = Date.now() - customerData.timestamp;
    metrics.serviceTimes.push(waitTime);
    metrics.totalServed++;

    // Keep only last 50
    if (metrics.serviceTimes.length > 50) {
      metrics.serviceTimes.shift();
    }

    activeQueues.delete(customerData.number);

    // Get stats and emit
    const stats = await getQueueStats();
    io.emit("customer-called", {
      number: currentServingNumber,
      stats,
      actualWaitTime: Math.round(waitTime / 1000 / 60),
    });

    const responseTime = Date.now() - startTime;
    console.log(
      `📢 Called customer ${currentServingNumber}. Response time: ${responseTime}ms`
    );

    res.json({
      success: true,
      number: currentServingNumber,
      stats,
      responseTime,
    });
  } else {
    res.json({
      success: false,
      message: "Queue is empty",
      responseTime: Date.now() - startTime,
    });
  }
});

// API: Get queue status
app.get("/api/queue/status", async (req, res) => {
  const startTime = Date.now();
  const stats = await getQueueStats();

  res.json({
    ...stats,
    responseTime: Date.now() - startTime,
  });
});

// API: Get performance metrics
app.get("/api/metrics", async (req, res) => {
  const startTime = Date.now();

  res.json({
    averageResponseTime: Date.now() - startTime,
    averageServiceTime: calculateAverageServiceTime(),
    totalServed: metrics.totalServed,
    activeCustomers: activeQueues.size,
    queueLength: await redis.zcard("queue"),
  });
});

// API: Clear queue (for testing)
app.post("/api/queue/clear", async (req, res) => {
  await redis.flushdb();
  queueCounter = 0;
  currentServingNumber = 0;
  metrics.totalServed = 0;
  metrics.serviceTimes = [];
  activeQueues.clear();

  io.emit("queue-cleared");

  res.json({ success: true, message: "Queue cleared" });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("👤 Client connected:", socket.id);

  // Send initial stats
  getQueueStats().then((stats) => {
    socket.emit("initial-stats", stats);
  });

  socket.on("disconnect", () => {
    console.log("👤 Client disconnected:", socket.id);
  });
});

// Initialize and start
initRedis()
  .then(() => {
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Queue server running on http://localhost:${PORT}`);
      console.log(`📡 Ready to accept connections...`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize:", err);
  });
