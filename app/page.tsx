"use client";

import { useState, useRef } from "react";
import CodePreview from "./components/CodePreview";
import { Mic, Square, Hourglass, Play, History } from "lucide-react";
import Toast from "./components/Toast";

interface ComponentLog {
  id: string;
  timestamp: string;
  description: string;
  code: string;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [componentHistory, setComponentHistory] = useState<ComponentLog[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [showToast, setShowToast] = useState(false);

  async function handleSpeech() {
    if (isRecording) {
      setIsGenerating(true);
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
      return;
    }

    try {
      setIsRecording(true);
      setError("");
      setCode("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          console.log("Sending audio file...");
          const transcribeRes = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const transcribeData = await transcribeRes.json();

          if (!transcribeRes.ok) {
            throw new Error(transcribeData.error || "Transcription failed");
          }

          console.log("Transcription:", transcribeData);
          const { text } = transcribeData;

          const codeRes = await fetch("/api/generate-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });

          const codeData = await codeRes.json();

          if (!codeRes.ok) {
            throw new Error(codeData.error || "Code generation failed");
          }

          // Add new component to history
          const newLog: ComponentLog = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString(),
            description: text,
            code: codeData.generatedCode,
          };

          setComponentHistory((prev) => [newLog, ...prev]);
          setCode(codeData.generatedCode);
        } catch (error: unknown) {
          console.error("Error:", error);
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError("An unknown error occurred");
          }
          setCode("");
        } finally {
          setIsGenerating(false);
        }
      };

      mediaRecorder.start();
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
      setCode("");
      setIsRecording(false);
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Speech-to-React Component
          </h1>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Describe the React component you want to create using your voice.
            Try saying something like &ldquo;Create a button that changes color
            when clicked&rdquo; or &ldquo;Make a counter component with
            increment and decrement buttons&rdquo;
          </p>
        </div>

        <div className="flex justify-center mb-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}
          <button
            onClick={handleSpeech}
            className={`px-6 py-3 text-lg font-semibold rounded-lg flex items-center gap-2 ${
              isGenerating
                ? "bg-slate-700 cursor-not-allowed"
                : isRecording
                ? "bg-red-500/80 hover:bg-red-500"
                : "bg-blue-500/80 hover:bg-blue-500"
            }`}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Hourglass className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <Square className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {isGenerating
              ? "Generating Code..."
              : isRecording
              ? "Stop Recording"
              : "Start Speaking"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Preview
            </h2>
            {code ? (
              <CodePreview code={code} />
            ) : (
              <div className="text-slate-500 text-center py-12">
                Component preview will appear here
              </div>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Component History
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {componentHistory.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setCode(log.code)}
                  className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/80 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-slate-400">
                      {log.timestamp}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        navigator.clipboard.writeText(log.code);
                        setShowToast(true);
                      }}
                      className="text-xs px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 
                                 text-blue-300 rounded flex items-center gap-1 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          width="14"
                          height="14"
                          x="8"
                          y="8"
                          rx="2"
                          ry="2"
                        />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                      Copy Code
                    </button>
                  </div>
                  <div className="font-medium text-slate-200">
                    {log.description}
                  </div>
                </div>
              ))}
              {componentHistory.length === 0 && (
                <div className="text-slate-500 text-center py-8">
                  No components generated yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toast
        message="Code copied to clipboard!"
        isVisible={showToast}
        onHide={() => setShowToast(false)}
      />
    </div>
  );
}
