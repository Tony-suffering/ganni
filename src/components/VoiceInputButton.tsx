import React, { useRef, useState } from "react";

// Google Speech-to-Text APIエンドポイント
const GOOGLE_SPEECH_API_URL = "https://speech.googleapis.com/v1/speech:recognize?key=" + import.meta.env.VITE_GOOGLE_SPEECH_API_KEY;

export type VoiceInputButtonProps = {
  onResult: (text: string) => void;
  className?: string;
  recordSeconds?: number; // デフォルト10秒
};

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onResult, className, recordSeconds = 10 }) => {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    if (recording || loading) return;
    setError(null);
    setRecording(true);
    setLoading(false);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        setRecording(false);
        setLoading(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(",")[1];
            const body = {
              config: {
                encoding: "OGG_OPUS",
                sampleRateHertz: 48000,
                languageCode: "ja-JP"
              },
              audio: {
                content: base64Audio
              }
            };
            try {
              const res = await fetch(GOOGLE_SPEECH_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
              });
              if (!res.ok) {
                const errText = await res.text();
                setError(`APIリクエスト失敗: ${res.status} ${errText}`);
                setLoading(false);
                return;
              }
              const data = await res.json();
              const transcript = data?.results?.[0]?.alternatives?.[0]?.transcript || "";
              if (!transcript) {
                setError("音声認識結果がありません");
              }
              onResult(transcript);
            } catch (err: any) {
              setError("音声認識APIエラー: " + (err?.message || err));
            } finally {
              setLoading(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (err: any) {
          setError("録音データ処理エラー: " + (err?.message || err));
          setLoading(false);
        }
      };
      mediaRecorder.start();
      timeoutRef.current = setTimeout(() => stopRecording(), recordSeconds * 1000);
    } catch (err: any) {
      setError("マイクの利用が許可されていません: " + (err?.message || err));
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setRecording(false);
  };

  return (
    <div className={className ? className : "ml-2 p-2 rounded bg-gray-200 hover:bg-gray-300"}>
      {!recording && !loading && (
        <button type="button" onClick={startRecording} className="px-3 py-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 shadow-lg text-xl">
          <span role="img" aria-label="マイク">🎤</span> 録音開始
        </button>
      )}
      {recording && (
        <button type="button" onClick={stopRecording} className="px-3 py-2 rounded-full bg-red-500 text-white shadow-lg text-xl animate-pulse">
          ⏹️ 録音停止（{recordSeconds}秒まで）
        </button>
      )}
      {loading && (
        <span className="ml-2 text-primary-600 animate-pulse">認識中...</span>
      )}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default VoiceInputButton; 