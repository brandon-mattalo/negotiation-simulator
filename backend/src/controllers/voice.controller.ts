import { Response } from 'express';
import { Readable } from 'stream';
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
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
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

      if (!response.body) {
        res.status(500).json({ error: 'No stream in TTS response' });
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      Readable.fromWeb(response.body as any).pipe(res);
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
      // Decode base64 audio
      const buffer = Buffer.from(audio, 'base64');
      console.log(`[STT] Processing audio: ${buffer.length} bytes, mimeType: ${mimeType}`);

      // Validate audio size (min 100 bytes, max 10MB)
      if (buffer.length < 100) {
        console.error('[STT] Audio too small:', buffer.length);
        res.status(400).json({ error: 'Audio file too small (likely silence or error)' });
        return;
      }
      if (buffer.length > 10 * 1024 * 1024) {
        console.error('[STT] Audio too large:', buffer.length);
        res.status(400).json({ error: 'Audio file too large (max 10MB)' });
        return;
      }

      const type = mimeType || 'audio/webm';
      const ext = type.includes('webm') ? 'webm' : type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';

      const formData = new FormData();
      const blob = new Blob([buffer], { type });
      formData.append('file', blob, `recording.${ext}`);
      formData.append('model_id', 'scribe_v1');
      formData.append('language', 'en');

      console.log('[STT] Sending to ElevenLabs...');
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[STT] ElevenLabs error:', response.status, errorText);

        // Provide more specific error messages
        if (response.status === 401) {
          res.status(500).json({ error: 'Voice service authentication failed' });
        } else if (response.status === 429) {
          res.status(429).json({ error: 'Voice service rate limit reached. Please wait a moment and try again.' });
        } else if (response.status === 400) {
          res.status(400).json({ error: 'Audio format not supported. Please try again.' });
        } else {
          res.status(response.status).json({ error: `Transcription failed: ${errorText}` });
        }
        return;
      }

      const result = await response.json() as { text?: string };
      console.log('[STT] Success:', result.text?.substring(0, 50) || '(empty)');
      res.json({ text: result.text || '' });
    } catch (err: any) {
      console.error('[STT] Exception:', err.message || err);
      console.error('[STT] Stack:', err.stack);
      res.status(500).json({ error: `Transcription error: ${err.message || 'Unknown error'}` });
    }
  }
}

export const voiceController = new VoiceController();
