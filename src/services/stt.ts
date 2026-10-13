// src/services/stt.ts
import axios from 'axios';
import FormData from 'form-data';

export async function transcribeAudioBuffer(audioBuffer: Buffer, fileName: string = 'audio.ogg'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBuffer, fileName);
    formData.append('model', 'saaras:v4');
    formData.append('mode', 'transcribe');
    formData.append('language_code', 'gu-IN');

    const response = await axios.post('https://api.sarvam.ai/speech-to-text', formData, {
        headers: {
            'api-subscription-key': process.env.SARVAM_API_KEY!,
            ...formData.getHeaders()
        }
    });

    return response.data.transcript || '';
}