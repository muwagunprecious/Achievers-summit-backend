require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ticketRoutes = require('./routes/tickets');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Basic health check and root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Achievers Summit API is live',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            root: '/',
            health: '/health',
            tickets: '/api/tickets',
            bookings: '/api/bookings'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/bookings', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack || err);

    const response = {
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };

    res.status(err.status || 500).json(response);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
        hint: 'Verify the URL starts with /api for backend calls'
    });
});

// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
        console.log(`✅ Health check: http://localhost:${PORT}/health\n`);
    });
}

module.exports = app;
