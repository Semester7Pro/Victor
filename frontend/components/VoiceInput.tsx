"use client";

import { useState, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  authToken: string;
  language: string; // Added language prop
}

export default function VoiceInput({
  onTranscript,
  authToken,
  language,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribe(blob, stream);
      };

      recorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const transcribe = async (blob: Blob, stream: MediaStream) => {
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("audio", blob);
    formData.append("language", language);

    try {
      const res = await fetch("http://localhost:8000/voice/transcribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription failed.");
      }

      const data = await res.json();
      onTranscript(data.transcript);
    } catch (err) {
      setError("Transcription failed.");
    } finally {
      setIsProcessing(false);
      stream.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Voice Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`h-10 w-10 flex items-center justify-center shrink-0 rounded-lg transition-all duration-200 ${
          isRecording
            ? "bg-destructive hover:bg-destructive/90 border border-destructive text-destructive-foreground"
            : isProcessing
            ? "bg-muted border border-border cursor-not-allowed opacity-50"
            : "bg-background border border-border hover:bg-primary/10 hover:border-primary"
        }`}
        title={isRecording ? "Stop Recording" : "Start Voice Input"}
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <div className="relative">
            <MicOff className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
          </div>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>

      {/* Status/Error Display */}
      {(isRecording || isProcessing || error) && (
        <div className="absolute bottom-12 right-0 bg-card/95 backdrop-blur-xl rounded-lg shadow-2xl border border-border px-4 py-2 min-w-48 z-50">
          {isRecording && (
            <div className="text-sm text-destructive flex items-center gap-2">
              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
              Recording...
            </div>
          )}
          {isProcessing && (
            <div className="text-sm text-primary flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Transcribing...
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}

      {/* Voice wave animation when recording (inline with input) */}
      {isRecording && (
        <div className="flex gap-0.5 ml-2">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-1 h-4 bg-destructive rounded-full animate-voice-wave"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}