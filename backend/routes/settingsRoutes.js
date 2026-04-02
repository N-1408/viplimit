const express = require('express');
const router = express.Router();
const { getConsoles, updateConsoles, updateClubName } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/consoles', getConsoles);
router.put('/consoles', updateConsoles);
router.put('/club-name', updateClubName);

module.exports = router;
