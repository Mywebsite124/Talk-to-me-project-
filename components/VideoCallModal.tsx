
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GeminiLiveSession } from '../services/geminiService';

interface VideoCallModalProps {
  onClose: () => void;
  planName: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ onClose, planName }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const setupMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const session = new GeminiLiveSession();
      sessionRef.current = session;

      await session.connect({
        onMessage: (text) => setTranscription(prev => (prev + ' ' + text).slice(-200)),
        onInterrupted: () => console.log('Interrupted'),
        onError: (e) => console.error('Session Error:', e)
      });

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        session.sendAudioFrame(inputData);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      setIsConnecting(false);
    } catch (err) {
      console.error('Failed to start media:', err);
      alert('Could not access camera or microphone.');
      onClose();
    }
  }, [onClose, isMuted]);

  useEffect(() => {
    setupMedia();
    return () => {
      sessionRef.current?.close();
      audioCtxRef.current?.close();
    };
  }, [setupMedia]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        
        {/* Remote Video Placeholder (The "User") */}
        <div className="absolute inset-0 flex items-center justify-center">
            <img 
                src="https://picsum.photos/id/64/1280/720" 
                alt="Alisha" 
                className="w-full h-full object-cover opacity-60"
            />
            {isConnecting ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium">Connecting to Alisha...</p>
                </div>
            ) : (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center w-full px-8">
                    <p className="text-white/80 italic text-lg drop-shadow-md">{transcription || "Listening..."}</p>
                </div>
            )}
        </div>

        {/* Local Preview */}
        <div className="absolute top-6 right-6 w-48 aspect-[3/4] bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Top Info Overlay */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold uppercase tracking-wider text-sm">LIVE: {planName}</span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500' : 'bg-gray-800/80 hover:bg-gray-700'}`}
            >
                <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'} text-xl`}></i>
            </button>
            <button 
                onClick={onClose}
                className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105"
            >
                <i className="fa-solid fa-phone-slash text-2xl"></i>
            </button>
            <button className="w-14 h-14 bg-gray-800/80 hover:bg-gray-700 rounded-full flex items-center justify-center transition-all">
                <i className="fa-solid fa-video text-xl"></i>
            </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
