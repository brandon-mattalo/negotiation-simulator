import { Response } from 'express';
import { Blob } from 'buffer';
import { AuthRequest } from '../middleware/auth.middleware';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

export class VoiceController {
  async tts(req: AuthRequest, res: Response): Promise<void> {
    if (!ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'ElevenLabs API key not configured on server' });
      return;
    }

    const { text } = req.body;
    if (!text?.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (err) {
      console.error('TTS error:', err);
      res.status(500).json({ error: 'TTS request failed' });
    }
  }

  async stt(req: AuthRequest, res: Response): Promise<void> {
    if (!ELEVENLABS_API_KEY) {
      res.status(500).json({ error: 'ElevenLabs API key not configured on server' });
      return;
    }

    const { audio, mimeType } = req.body;
    if (!audio) {
      res.status(400).json({ error: 'audio (base64) is required' });
      return;
    }

    try {
      const buffer = Buffer.from(audio, 'base64');
      const type = mimeType || 'audio/webm';
      const ext = type.includes('webm') ? 'webm' : type.includes('mp4') ? 'mp4' : 'webm';

      const formData = new FormData();
      const blob = new Blob([buffer], { type });
      formData.append('file', blob, `recording.${ext}`);
      formData.append('model_id', 'scribe_v1');
      formData.append('language', 'en');

      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.status(response.status).json({ error: errorText });
        return;
      }

      const result = await response.json() as { text?: string };
      res.json({ text: result.text || '' });
    } catch (err) {
      console.error('STT error:', err);
      res.status(500).json({ error: 'STT request failed' });
    }
  }
}

export const voiceController = new VoiceController();
