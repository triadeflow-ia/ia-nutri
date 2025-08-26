// services\mediaService.js

import axios from "axios";
import fs from "fs";
import path from "path";
import pdf from 'pdf-parse';
import { __dirname } from '../app.js';
import { config } from '../config/index.js';
import * as openaiService from './openaiService.js';

export async function fetchMediaUrl(mediaId) {
  try {
    const url = `https://graph.facebook.com/v19.0/${mediaId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${config.whatsapp.graphApiToken}`
      }
    });
    console.log("Media URL response:", response.data);
    return response.data.url;
  } catch (error) {
    console.error("Error fetching media URL:", error);
    throw error;
  }
}

export async function downloadImage(url) {
  const imagePath = path.join(__dirname, 'temp_image.jpg');
  const writer = fs.createWriteStream(imagePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      Authorization: `Bearer ${config.whatsapp.graphApiToken}`
    }
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(imagePath));
    writer.on('error', reject);
  });
}

export async function processImage(imageUrl, caption) {
  try {
    const imagePath = await downloadImage(imageUrl);
    console.log("Image downloaded to:", imagePath);
    const description = await openaiService.describeImage(imagePath, caption);
    fs.unlinkSync(imagePath);
    return description;
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

export async function downloadPdf(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${config.whatsapp.graphApiToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}

export async function extractTextFromPdf(pdfContent) {
  try {
    const data = await pdf(pdfContent);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

export async function downloadAudio(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${config.whatsapp.graphApiToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw error;
  }
}

export async function downloadFile(url, filename) {
  const filePath = path.join(__dirname, 'temp', filename);
  const writer = fs.createWriteStream(filePath);

  // Certifica-se de que o diretório temp existe
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    headers: {
      Authorization: `Bearer ${config.whatsapp.graphApiToken}`
    }
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

export async function cleanupTempFiles() {
  const tempDir = path.join(__dirname, 'temp');
  
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const hourAgo = Date.now() - (60 * 60 * 1000);
      
      // Remove arquivos mais antigos que 1 hora
      if (stats.mtimeMs < hourAgo) {
        fs.unlinkSync(filePath);
        console.log(`Removed old temp file: ${file}`);
      }
    }
  }
}

// Executar limpeza a cada hora
setInterval(cleanupTempFiles, 60 * 60 * 1000);