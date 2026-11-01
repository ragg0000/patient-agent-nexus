import { useEffect, useRef, useState } from "react";
import { Mic, Pause, Play, Square, Trash2, Upload } from "lucide-react";
import type { TranscriptResult } from "@/lib/backend";
import { backendApi } from "@/lib/backend";
import { describeApiError } from "@/lib/api-client";
import { Chip, Panel, SectionCard } from "../SectionCard";
import { Button } from "@/components/ui/button";
import { ErrorPanel } from "./StatusPanels";
import { cn } from "@/lib/utils";

type RecorderState = "idle" | "recording" | "paused" | "stopped";

const ACCEPTED = ".wav,.mp3,.m4a,.webm,.ogg,audio/wav,audio/mpeg,audio/mp4,audio/webm,audio/ogg";

export function ConsultationRecorderCard({
  patientId,
  encounterId,
  onTranscript,
  onManualEntry,
}: {
  patientId: string | null;
  encounterId: string | null;
  onTranscript: (result: TranscriptResult) => void;
  onManualEntry: () => void;
}) {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [level, setLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<{ title: string; detail: string } | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  useEffect(
    () => () => {
      stopMeters();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function stopMeters() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevel(0);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission("granted");
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        blobRef.current = blob;
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
      };
      recorderRef.current = recorder;
      recorder.start();

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
        setLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      setSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setRecorderState("recording");
    } catch {
      setPermission("denied");
      setError({
        title: "Microphone unavailable",
        detail: "Microphone permission was denied or is not available in this browser. Upload an existing audio file instead, or enter the transcript manually.",
      });
    }
  }

  function pauseOrResume() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorderState === "recording") {
      recorder.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setRecorderState("paused");
    } else if (recorderState === "paused") {
      recorder.resume();
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      setRecorderState("recording");
    }
  }

  function stop() {
    recorderRef.current?.stop();
    stopMeters();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecorderState("stopped");
  }

  function cancel() {
    recorderRef.current?.stop();
    stopMeters();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current = null;
    chunksRef.current = [];
    blobRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setRecorderState("idle");
  }

  async function submit(file: File) {
    if (!patientId || !encounterId) return;
    setError(null);
    setUploading(true);
    setUploadProgress(5);
    const progressTimer = setInterval(() => setUploadProgress((p) => Math.min(90, p + 12)), 400);
    try {
      const result = await backendApi.uploadSpeech(patientId, encounterId, file);
      setUploadProgress(100);
      onTranscript(result);
    } catch (e) {
      setError(describeApiError(e));
    } finally {
      clearInterval(progressTimer);
      setUploading(false);
    }
  }

  const disabled = !patientId || !encounterId;

  return (
    <SectionCard
      id="step-consultation"
      index={6}
      title="Provider-Patient Consultation"
      subtitle="Browser recording → speech-to-text upload · English-only transcription"
    >
      <div className="mb-2.5 flex flex-wrap gap-1.5">
        <Chip tone="info">English only</Chip>
        <Chip>Patient: {patientId ?? "—"}</Chip>
        <Chip>Encounter: {encounterId ?? "—"}</Chip>
        <Chip tone={permission === "granted" ? "ok" : permission === "denied" ? "urgent" : "muted"}>
          Mic permission: {permission}
        </Chip>
      </div>

      {disabled ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-[11px] text-muted-foreground">
          Select a patient to enable recording.
        </p>
      ) : null}

      {!disabled ? (
        <div className="space-y-2.5">
          <Panel title="Recorder">
            <div className="flex flex-wrap items-center gap-1.5">
              {recorderState === "idle" || recorderState === "stopped" ? (
                <Button size="sm" variant="agent" className="text-[11px]" onClick={() => void start()}>
                  <Mic className="h-3.5 w-3.5" /> Start recording
                </Button>
              ) : null}
              {recorderState === "recording" || recorderState === "paused" ? (
                <>
                  <Button size="sm" variant="outline" className="text-[11px]" onClick={pauseOrResume}>
                    {recorderState === "recording" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {recorderState === "recording" ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" variant="urgent" className="text-[11px]" onClick={stop}>
                    <Square className="h-3.5 w-3.5" /> Stop
                  </Button>
                  <Button size="sm" variant="outline" className="text-[11px]" onClick={cancel}>
                    <Trash2 className="h-3.5 w-3.5" /> Cancel
                  </Button>
                </>
              ) : null}
              <span className="ml-auto font-mono text-sm font-semibold">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Audio level</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded bg-info transition-[width] duration-100"
                  style={{ width: `${recorderState === "recording" ? level : 0}%` }}
                />
              </div>
            </div>
          </Panel>

          {audioUrl ? (
            <Panel title="Playback before submission">
              <audio controls src={audioUrl} className="w-full" />
              <Button
                size="sm"
                variant="clinical"
                className="mt-2 text-[11px]"
                disabled={uploading || !blobRef.current}
                onClick={() => {
                  const blob = blobRef.current;
                  if (!blob) return;
                  const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("mpeg") ? "mp3" : "webm";
                  void submit(new File([blob], `consultation-${encounterId}.${ext}`, { type: blob.type }));
                }}
              >
                <Upload className="h-3.5 w-3.5" /> Upload recording for transcription
              </Button>
            </Panel>
          ) : null}

          <Panel title="Upload existing audio (WAV, MP3, M4A, WebM, OGG)">
            <input
              type="file"
              accept={ACCEPTED}
              className="w-full text-[11px]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void submit(file);
              }}
            />
          </Panel>

          {uploading ? (
            <div className="rounded-md border border-info/30 bg-info-soft px-3 py-2 text-[11px] text-info">
              Uploading and transcribing… {uploadProgress}%
            </div>
          ) : null}

          {error ? (
            <ErrorPanel title={error.title} detail={error.detail}>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onManualEntry}>
                Enter transcript manually
              </Button>
            </ErrorPanel>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
