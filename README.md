# Nordic Queue System

A real-time queue management system built to demonstrate understanding the core concept learnt from interview, React performance optimizations, specifically focusing on `useMemo` optimization and real-time updates.

## 🌟 Features

- **Real-time Queue Management**: Live updates using Socket.IO
- **Multi-language Support**: English, Finnish (Suomi), and Swedish (Svenska)
- **Staff Dashboard**: Complete queue management interface for staff
- **Display Board**: Public display for showing current serving numbers
- **Performance Monitoring**: Visual comparison of `useMemo` vs no optimization
- **Redis Integration**: Persistent queue storage with Upstash Redis

## 🛠 Tech Stack

### Frontend

- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Socket.IO Client** - Real-time communication

### Backend

- **Node.js & Express** - Server runtime and framework
- **Socket.IO** - Real-time bidirectional communication
- **Redis (Upstash)** - Queue persistence and data storage
- **CORS** - Cross-origin resource sharing

### Performance optimization using useMemo (Addressing Interview Question)

The performance page demonstrates the React optimization discussed in the interview:

````javascript
// WITHOUT useMemo - Recalculates every render
const waitTime = position * 3.5;

// WITH useMemo - Caches calculation
const waitTime = useMemo(() => position * 3.5, [position]);

### About Server-Side Rendering (SSR) (Addressing Interview Question)
- Next.js provides SSR capabilities, which would benefit the queue system in production:
Current Implementation: Using client-side rendering ('use client') for real-time updates via WebSockets.
Production SSR Implementation Would Provide:

- Digital displays get pre-rendered HTML (crucial for low-powered devices)
- First Contentful Paint under 100ms
- SEO benefits for public-facing queue status pages
- Fallback if JavaScript fails to load

Why not fully implemented: Focused on demonstrating real-time updates and useMemo optimization within the time constraint and theory behind SSR.

### Why Redis?

Redis was chosen for queue management because:

1. **Speed**: In-memory storage provides ~1ms response times vs 10-50ms for PostgreSQL
2. **Built-in Data Structures**:
   - Sorted Sets (ZADD, ZPOPMIN) perfect for queue ordering
3. **Simplicity**: No schema migrations, just key-value operations
4. **Real-time**: Supports Pub/Sub pattern natively



## 📋 Prerequisites

- Node.js (v16 or higher)
- Redis instance (or Upstash Redis account)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/MarufRayhan/queue-prototype.git
cd nordic-queue
````

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if separate)
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
REDIS_URL=your_redis_connection_string
PORT=3001
```

### 4. Start the Application

#### Development Mode

```bash
# Start the backend server
npm run server

# In another terminal, start the frontend
npm run dev
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

The application will be available at:

- **Customer Interface**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📱 Application Structure

### Customer Flow

1. **Join Queue**: Customers take a number and receive their position
2. **Real-time Updates**: Live position updates and estimated wait times
3. **Notifications**: Real-time notifications when it's their turn

### Staff Management

1. **Dashboard Overview**: Current serving number, queue length, and statistics
2. **Call Next**: Call the next customer in queue
3. **Queue Management**: Clear queue and monitor performance
4. **Analytics**: View service statistics and performance metrics

## 🌐 Multi-language Support

The system supports three languages:

- **English (EN)**: Default language
- **Finnish (FI)**: Suomi
- **Swedish (SV)**: Svenska

Language switching is available in real-time without page reload.

## 📊 API Endpoints

### Queue Management

- `POST /api/queue/join` - Join the queue
- `POST /api/queue/next` - Call next customer
- `GET /api/queue/status` - Get current queue status
- `POST /api/queue/clear` - Clear entire queue

### WebSocket Events

- `initial-stats` - Initial queue statistics
- `customer-called` - When a customer is called
- `queue-joined` - When someone joins the queue
- `queue-cleared` - When queue is cleared

## 📁 Project Structure

```
nordic-queue/
├── src/
│   └── app/
│       ├── page.tsx              # Customer interface
│       ├── layout.tsx            # App layout
│       ├── globals.css           # Global styles
│       ├── staff/
│       │   └── page.tsx          # Staff dashboard
│       ├── display/
│       │   └── page.tsx          # Public display board
│       └── performance/
│           └── page.tsx          # Performance monitoring
├── server.js                     # Backend server
├── LanguageContext.tsx           # Language context provider
├── translations.ts               # Multi-language translations
├── package.json                  # Dependencies and scripts
└── README.md                     # Project documentation
```

## ⚡ Performance Features

- **React Optimization**: Uses `useMemo` for expensive calculations
- **Real-time Metrics**: Built-in performance monitoring
- **Efficient Updates**: Optimized Socket.IO event handling
- **Redis Caching**: Fast queue operations with persistent storage

### Socket.IO Configuration

WebSocket connections are configured for localhost development. Update `server.js` for production:

```javascript
const io = new Server(server, {
  cors: {
    origin: "your-production-domain.com",
    methods: ["GET", "POST"],
  },
});
```

## 🚀 Deployment

### Frontend (Vercel)

```bash
npm run build
```

### Backend (Railway/Heroku)

Ensure your `server.js` includes:

```javascript
const PORT = process.env.PORT || localhost;
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed**

   - Check your Redis URL in `.env`
   - Ensure Redis server is running
   - Verify network connectivity

2. **Socket.IO Connection Issues**

   - Check CORS configuration
   - Verify port numbers match
   - Ensure backend server is running

3. **Build Errors**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

---

Built with ❤️ for learning the efficient queue management.
