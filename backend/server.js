import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cap_table.json');
const DEFAULT_DATA_FILE = path.join(DATA_DIR, 'cap_table_default.json');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Load initial seed data as default backup
const loadSeedData = () => {
  try {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error reading cap_table.json, using fallback default:", error);
    return null;
  }
};

// Seed the default backup on start if not already there
const seedData = loadSeedData();
if (seedData && !fs.existsSync(DEFAULT_DATA_FILE)) {
  fs.writeFileSync(DEFAULT_DATA_FILE, JSON.stringify(seedData, null, 2));
}

// Get the current cap table
app.get('/api/cap-table', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      if (fs.existsSync(DEFAULT_DATA_FILE)) {
        fs.copyFileSync(DEFAULT_DATA_FILE, DATA_FILE);
      } else {
        return res.status(404).json({ error: "Cap table data file not found." });
      }
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Failed to read cap table data: " + error.message });
  }
});

// Update the cap table
app.post('/api/cap-table', (req, res) => {
  try {
    const capTableData = req.body;
    if (!capTableData || typeof capTableData !== 'object') {
      return res.status(400).json({ error: "Invalid data format." });
    }
    
    // Quick validation
    if (!Array.isArray(capTableData.shareholders) || !Array.isArray(capTableData.shareClasses)) {
      return res.status(400).json({ error: "Missing shareholders or shareClasses list." });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(capTableData, null, 2));
    res.json({ success: true, message: "Cap table saved successfully.", data: capTableData });
  } catch (error) {
    res.status(500).json({ error: "Failed to save cap table: " + error.message });
  }
});

// Reset cap table to default
app.post('/api/cap-table/reset', (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_DATA_FILE)) {
      fs.copyFileSync(DEFAULT_DATA_FILE, DATA_FILE);
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      res.json({ success: true, message: "Cap table reset to default.", data: JSON.parse(data) });
    } else {
      res.status(404).json({ error: "Default template file not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to reset cap table: " + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: "healthy", time: new Date() });
});

app.listen(PORT, () => {
  console.log(`Cap Table backend server listening on port ${PORT}`);
});
