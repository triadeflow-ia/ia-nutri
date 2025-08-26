// services\audioService.js

import fs from "fs";
import path from "path";
import { openai } from '../config/openai.js';
import { __dirname } from '../app.js';

export async function transcribeAudio(audioContentBuffer) {
  const tempAudioPath = path.join(__dirname, `temp_audio_${Date.now()}.ogg`);
  fs.writeFileSync(tempAudioPath, audioContentBuffer);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempAudioPath),
      model: "whisper-1",
      response_format: "json",
      language: "pt"
    });

    const transcriptionText = transcription.text.trim();
    fs.unlinkSync(tempAudioPath);

    // Caso a transcrição esteja vazia ou com muito barulho
    if (!transcriptionText || transcriptionText.length < 5) {
      throw new Error("Transcrição com muito ruído ou não detectada");
    }

    return {
      transcription: transcriptionText,
      language: "pt-BR"
    };
  } catch (error) {
    console.error("Erro ao transcrever o áudio com Whisper:", error);
    if (fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    return null;
  }
}

export async function textToSpeech(text) {
  const voice = 'onyx';
  const model = "tts-1";

  try {
    const response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: "opus"
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("Erro ao converter texto para áudio (OpenAI):", error);
    throw error;
  }
}

export async function validateAudioFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Validar tamanho do arquivo (máximo 25MB para WhatsApp)
    if (fileSizeInMB > 25) {
      return {
        isValid: false,
        error: "Arquivo de áudio muito grande (máximo 25MB)"
      };
    }
    
    // Validar extensão
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.ogg', '.mp3', '.aac', '.m4a', '.amr', '.opus'];
    
    if (!validExtensions.includes(ext)) {
      return {
        isValid: false,
        error: "Formato de áudio não suportado"
      };
    }
    
    return {
      isValid: true,
      size: fileSizeInMB,
      extension: ext
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

export async function saveAudioFile(buffer, filename) {
  const audioDir = path.join(__dirname, 'audio_responses');
  
  // Criar diretório se não existir
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, buffer, 'binary');
  
  return filePath;
}

export async function cleanupOldAudioFiles(hoursToKeep = 24) {
  const audioDir = path.join(__dirname, 'audio_responses');
  
  if (!fs.existsSync(audioDir)) {
    return;
  }
  
  const files = fs.readdirSync(audioDir);
  const cutoffTime = Date.now() - (hoursToKeep * 60 * 60 * 1000);
  
  for (const file of files) {
    const filePath = path.join(audioDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < cutoffTime) {
      fs.unlinkSync(filePath);
      console.log(`Removed old audio file: ${file}`);
    }
  }
}

// Executar limpeza a cada 6 horas
setInterval(() => cleanupOldAudioFiles(24), 6 * 60 * 60 * 1000);