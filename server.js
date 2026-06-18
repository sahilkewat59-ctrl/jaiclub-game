const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ग्लोबल गेम स्टेट
let gameState = {
    timeRemaining: 60,
    currentPeriod: "",
    gameHistory: [
        { period: "20260618100010062", winNum: 3, winSize: "Small", winColor: "Green" },
        { period: "20260618100010061", winNum: 4, winSize: "Small", winColor: "Red" }
    ],
    adminForcedNum: null
};

// लाइव टाइम के आधार पर पीरियड नंबर कैलकुलेट करना
function updatePeriod() {
    let today = new Date();
    let y = today.getFullYear();
    let m = String(today.getMonth() + 1).padStart(2, '0');
    let d = String(today.getDate()).padStart(2, '0');
    let currentMinuteIndex = today.getHours() * 60 + today.getMinutes();
    let finalSerial = String(currentMinuteIndex + 1).padStart(5, '0');
    gameState.currentPeriod = `${y}${m}${d}10001${finalSerial}`;
}

// 1-Minute Core Server Engine
setInterval(() => {
    let today = new Date();
    gameState.timeRemaining = 60 - today.getSeconds();
    updatePeriod();

    // राउंड क्लोज होने पर (न्यू मिनट स्टार्ट)
    if (gameState.timeRemaining === 60 || gameState.timeRemaining === 0) {
        let winNum = (gameState.adminForcedNum !== null) ? gameState.adminForcedNum : Math.floor(Math.random() * 10);
        let winSize = (winNum >= 5) ? "Big" : "Small";
        let winColor = "";

        if (winNum === 0) winColor = "Red/Violet";
        else if (winNum === 5) winColor = "Green/Violet";
        else if ([1, 3, 7, 9].includes(winNum)) winColor = "Green";
        else winColor = "Red";

        // इतिहास में नया रिकॉर्ड जोड़ना
        gameState.gameHistory.unshift({
            period: gameState.currentPeriod,
            winNum: winNum,
            winSize: winSize,
            winColor: winColor
        });

        // इतिहास को 15 रिकॉर्ड्स तक सीमित रखना
        if (gameState.gameHistory.length > 15) gameState.gameHistory.pop();

        // अगले राउंड के लिए एडमिन कमांड रीसेट
        gameState.adminForcedNum = null;
    }
}, 1000);

// API Endpoints
app.get('/api/game-state', (req, res) => {
    res.json(gameState);
});

app.post('/api/admin-force', (req, res) => {
    const { num } = req.body;
    if (num >= 0 && num <= 9) {
        gameState.adminForcedNum = num;
        res.json({ success: true, message: `Number ${num} Forced successfully!` });
    } else {
        res.status(400).json({ success: false, message: "Invalid Number" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
            
