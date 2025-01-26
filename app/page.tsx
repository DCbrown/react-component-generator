"use client";

import { useState, useRef } from "react";
import CodePreview from "./components/CodePreview";

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
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  async function handleSpeech() {
    if (isRecording) {
      setIsGenerating(true);
      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        streamRef.current.getTracks().forEach((track) => track.stop());
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
        } catch (error) {
          console.error("Error:", error);
          setError(error.message);
          setCode("");
        } finally {
          setIsGenerating(false);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
      setIsRecording(false);
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Speech-to-React Component</h1>
          <p className="text-gray-400 mb-4">
            Describe the React component you want to create using your voice.
            Try saying something like &ldquo;Create a button that changes color
            when clicked&rdquo; or &ldquo;Make a counter component with
            increment and decrement buttons&rdquo;
          </p>
        </div>
        <div className="flex flex-col items-center mb-8">
          {error && (
            <div className="mb-4 p-4 bg-red-500 rounded-lg">{error}</div>
          )}
          <button
            onClick={handleSpeech}
            className={`px-6 py-3 text-lg font-bold rounded-lg ${
              isGenerating
                ? "bg-gray-500 cursor-not-allowed"
                : isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isGenerating}
          >
            {isGenerating
              ? "⏳ Generating Code..."
              : isRecording
              ? "⏹️ Stop Recording"
              : "🎤 Start Speaking"}
          </button>
          {isGenerating && (
            <div className="mt-4 text-yellow-400 animate-pulse">
              🤖 AI is processing your speech and generating code... one sec
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {code && (
              <div className="w-full">
                <CodePreview code={code} />
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-600"
                  >
                    📋 Copy Code
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Component History</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {componentHistory.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => setCode(log.code)}
                >
                  <div className="text-sm text-gray-400">{log.timestamp}</div>
                  <div className="font-medium">{log.description}</div>
                </div>
              ))}
              {componentHistory.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No components generated yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
