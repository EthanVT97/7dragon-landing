<<<<<<< HEAD
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
=======
<<<<<<< HEAD
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'fs';
>>>>>>> 98c95114a949d873ae957bb4ed25891dc258c24b

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
<<<<<<< HEAD
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
=======
const port = process.env.PORT || 10000;

// Enable request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
        "https://fonts.gstatic.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "https://fonts.googleapis.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      manifestSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable CORS with WebSocket support
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
=======
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 10000;

// Trust proxy - required when behind a reverse proxy (Heroku, Render, etc)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'https://xnujjoarvinvztccwrye.supabase.co'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Enable CORS
app.use(cors());
>>>>>>> origin/main

// Compression
app.use(compression());

<<<<<<< HEAD
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Check if dist directory exists
const distPath = join(__dirname, 'dist');
console.log(`Checking dist directory: ${distPath}`);
try {
  if (!existsSync(distPath)) {
    console.error('Error: dist directory does not exist');
    process.exit(1);
  }
} catch (err) {
  console.error('Error checking dist directory:', err);
  process.exit(1);
}

// Serve static files from the Vue app build directory with proper MIME types
app.use(express.static(distPath, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set proper MIME types
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    
    // Log served files
    console.log(`Serving static file: ${path}`);
  }
}));

// Add logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode}`);
  next();
});

// Handle SPA routing - this should be after static file serving
app.get('*', (req, res) => {
  // Don't serve index.html for asset requests
  if (req.url.includes('/assets/')) {
    res.status(404).send('Not found');
    return;
  }
  
  console.log('Serving index.html for path:', req.url);
  res.sendFile(join(distPath, 'index.html'), err => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
=======
// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// API endpoints for analytics
app.get('/api/analytics', (req, res) => {
    // Implement analytics data retrieval
    res.json({
        userEngagement: {/* data */},
        responseTimes: {/* data */},
        popularTopics: {/* data */},
        satisfaction: {/* data */}
    });
});

// Broadcast message endpoint
app.post('/api/broadcast', (req, res) => {
    // Implement broadcast message handling
    const { target, type, message, scheduleTime } = req.body;
    // Process broadcast message
    res.json({ success: true });
});

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
>>>>>>> origin/main
});

// Error handling middleware
app.use((err, req, res, next) => {
<<<<<<< HEAD
  console.error('Application error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Static files being served from: ${distPath}`);
=======
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
>>>>>>> 98c95114a949d873ae957bb4ed25891dc258c24b
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
<<<<<<< HEAD
=======
>>>>>>> origin/main
>>>>>>> 98c95114a949d873ae957bb4ed25891dc258c24b
});
