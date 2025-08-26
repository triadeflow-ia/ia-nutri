// routes\audio.js

import express from 'express';
import path from 'path';
import fs from 'fs';
import { __dirname } from '../app.js';

const router = express.Router();

// Rota para servir arquivos de áudio
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'audio_responses', filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/ogg; codecs=opus');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Arquivo não encontrado');
  }
});

export default router;