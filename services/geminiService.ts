
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

export class GeminiLiveSession {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime = 0;
  private audioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private sources: Set<AudioBufferSourceNode> = new Set();

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async connect(callbacks: {
    onMessage?: (text: string) => void;
    onInterrupted?: () => void;
    onError?: (e: any) => void;
  }) {
    if (this.sessionPromise) return this.sessionPromise;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.audioContext.createGain();
    this.outputNode.connect(this.audioContext.destination);

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction: 'You are Alisha Rahman, a beautiful, friendly, and charming 24-year-old dating profile owner. You are talkative, flirtatious but respectful, and very interested in getting to know the person you are on a video call with. Keep your responses natural, warm, and engaging. Avoid long monologues. Respond to audio inputs with enthusiasm.',
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => console.log('Live session opened'),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) {
            callbacks.onMessage?.(message.serverContent.outputTranscription.text);
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.audioContext) {
            this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
            const audioBuffer = await this.decodeAudio(base64Audio);
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode!);
            source.addEventListener('ended', () => this.sources.delete(source));
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
          }

          if (message.serverContent?.interrupted) {
            this.stopAudio();
            callbacks.onInterrupted?.();
          }
        },
        onerror: (e) => callbacks.onError?.(e),
        onclose: () => console.log('Live session closed'),
      },
    });

    return this.sessionPromise;
  }

  private async decodeAudio(base64: string): Promise<AudioBuffer> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = this.audioContext!.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  private stopAudio() {
    this.sources.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async sendAudioFrame(data: Float32Array) {
    const session = await this.sessionPromise;
    if (!session) return;

    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    
    session.sendRealtimeInput({
      media: {
        data: btoa(binary),
        mimeType: 'audio/pcm;rate=16000',
      }
    });
  }

  close() {
    this.stopAudio();
    this.sessionPromise?.then(s => s.close());
    this.audioContext?.close();
  }
}
