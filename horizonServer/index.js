const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'sessions.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const getSessions = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
};
const saveSessions = (sessions) => fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2));

const getLocalIP = () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
};

app.get('/api/my-ip', (req, res) => {
    res.json({ ip: getLocalIP() });
});

app.get('/api/sessions', (req, res) => {
    res.json(getSessions());
});

app.get('/api/sessions/:id', (req, res) => {
    const { id } = req.params;
    const sessions = getSessions();
    const session = sessions.find(s => s.id === id);
    if (session) return res.json(session);
    res.status(404).json({ error: "Session not found" });
});

app.post('/api/session/start', (req, res) => {
    const { sessionId, title, interval } = req.body;
    console.log('--- START SESSION ---', sessionId);
    
    const sessions = getSessions();
    const newSession = {
        id: sessionId || Date.now().toString(),
        title: title || `Запис від ${new Date().toLocaleString('uk-UA')}`,
        interval: interval || 1,
        status: 'recording',
        startTime: new Date().toISOString(),
        endTime: null,
        dataPoints: []
    };
    
    sessions.push(newSession);
    saveSessions(sessions);
    res.json({ success: true, sessionId: newSession.id });
});

app.post('/api/session/data', (req, res) => {
    const { sessionId, data } = req.body;
    console.log(`--- DATA for ${sessionId} ---`, data);
    
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        console.log('Session not found, creating a dummy recording session');
        const newSession = {
            id: sessionId,
            title: `Запис (авто) від ${new Date().toLocaleString('uk-UA')}`,
            interval: 60,
            status: 'recording',
            startTime: new Date().toISOString(),
            endTime: null,
            dataPoints: [{ timestamp: new Date().toISOString(), ...data }]
        };
        sessions.push(newSession);
        saveSessions(sessions);
        return res.json({ success: true, note: 'Session created on data' });
    }
    
    session.dataPoints.push({
        timestamp: new Date().toISOString(),
        ...data
    });
    
    saveSessions(sessions);
    res.json({ success: true });
});

app.post('/api/session/end', (req, res) => {
    const { sessionId } = req.body;
    console.log('--- END SESSION ---', sessionId);
    
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }
    
    session.status = 'completed';
    session.endTime = new Date().toISOString();
    saveSessions(sessions);
    
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Horizon backend listening on port ${PORT}`);
});
