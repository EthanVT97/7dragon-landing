import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import supportRoutes from './src/api/supportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://7dragon-chat-master.onrender.com']
      : ['http://localhost:8080'],
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 10000;

// Initialize Supabase client
const supabaseUrl = 'https://xnujjoarvinvztccwrye.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Enable request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Support routes
app.use('/api/support', supportRoutes);

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Security middleware with updated CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "https://xnujjoarvinvztccwrye.supabase.co", 
        "wss://xnujjoarvinvztccwrye.supabase.co",
        "https://*.supabase.co",
        "wss://*.supabase.co",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://www.m9asia.com",
        process.env.NODE_ENV === 'production' 
          ? 'https://7dragon-chat-master.onrender.com'
          : 'http://localhost:8080'
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://fonts.googleapis.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "https://www.m9asia.com"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      manifestSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  }
}));

// Enable CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://7dragon-chat-master.onrender.com'
    : 'http://localhost:8080',
  credentials: true
}));

// Enable compression
app.use(compression());

// Serve static files
const distPath = join(__dirname, './dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      // Set cache control headers
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
      
      // Set correct MIME types
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
    }
  }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join chat room
  socket.on('join_chat', async (sessionId) => {
    socket.join(`chat:${sessionId}`);
    console.log(`Client ${socket.id} joined chat ${sessionId}`);
  });

  // Leave chat room
  socket.on('leave_chat', (sessionId) => {
    socket.leave(`chat:${sessionId}`);
    console.log(`Client ${socket.id} left chat ${sessionId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Handle all other routes - serve index.html
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Start server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
