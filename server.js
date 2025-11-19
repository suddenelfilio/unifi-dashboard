// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Get API key from environment variable (REQUIRED)
const API_KEY = process.env.UNIFI_API_KEY;
const API_BASE_URL = process.env.UNIFI_API_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

if (!API_KEY) {
    console.error('❌ ERROR: UNIFI_API_KEY environment variable is required!');
    console.error('   Please set UNIFI_API_KEY in your environment or .env file');
    process.exit(1);
}

if (!API_BASE_URL) {
    console.error('❌ ERROR: UNIFI_API_URL environment variable is required!');
    console.error('   Please set UNIFI_API_URL in your environment or .env file');
    process.exit(1);
}

console.log(`✓ Using API URL: ${API_BASE_URL}`);
console.log(`✓ API Key configured: Yes`);

// Proxy endpoints
app.get('/api/sites', async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: 'Server API key not configured' });
        }

        const response = await fetch(`${API_BASE_URL}/sites`, {
            headers: {
                'X-API-KEY': API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `API request failed: ${response.statusText}`
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching sites:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sites/:siteId/devices', async (req, res) => {
    try {
        const { siteId } = req.params;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server API key not configured' });
        }

        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/devices`, {
            headers: {
                'X-API-KEY': API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `API request failed: ${response.statusText}`
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sites/:siteId/clients', async (req, res) => {
    try {
        const { siteId } = req.params;

        if (!API_KEY) {
            return res.status(500).json({ error: 'Server API key not configured' });
        }

        const response = await fetch(`${API_BASE_URL}/sites/${siteId}/clients`, {
            headers: {
                'X-API-KEY': API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `API request failed: ${response.statusText}`
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 UniFi Dashboard BFF running on http://localhost:${PORT}`);
    console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
