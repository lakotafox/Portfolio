const TARGET_SR = 48000;
const CHUNK_SAMPLES = TARGET_SR * 3; // 3 seconds

export class Recorder {
  constructor({ onWaveform, onTimer }) {
    this.onWaveform = onWaveform;
    this.onTimer = onTimer;
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.chunks = [];
    this.mediaRecorder = null;
    this.recording = false;
    this.startTime = 0;
    this.timerInterval = null;
    this.animFrame = 0;
  }

  async start() {
    // Raw mic: echo cancellation / noise suppression are meant for voice calls —
    // they slow down mic startup and actively filter out birdsong.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    this.ctx = new AudioContext({ sampleRate: TARGET_SR });
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.source.connect(this.analyser);

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
    this.recording = true;
    this.startTime = performance.now();
    this._tick();
    this._drawWaveform();
  }

  _tick() {
    this.timerInterval = setInterval(() => {
      if (!this.recording) return;
      const elapsed = (performance.now() - this.startTime) / 1000;
      const m = Math.floor(elapsed / 60);
      const s = Math.floor(elapsed % 60);
      if (this.onTimer) this.onTimer(`${m}:${String(s).padStart(2, '0')}`, elapsed);
    }, 250);
  }

  _drawWaveform() {
    if (!this.recording || !this.analyser) return;
    const bufLen = this.analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    const draw = () => {
      if (!this.recording) return;
      this.animFrame = requestAnimationFrame(draw);
      this.analyser.getByteTimeDomainData(data);
      if (this.onWaveform) this.onWaveform(data);
    };
    this.animFrame = requestAnimationFrame(draw);
  }

  async stop() {
    this.recording = false;
    clearInterval(this.timerInterval);
    cancelAnimationFrame(this.animFrame);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        this.mediaRecorder.onstop = resolve;
        this.mediaRecorder.stop();
      });
    }

    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());

    const blob = new Blob(this.chunks, { type: 'audio/webm' });
    return this._decodeToMono(blob);
  }

  async _decodeToMono(blob) {
    const arrayBuf = await blob.arrayBuffer();
    const offCtx = new OfflineAudioContext(1, 1, TARGET_SR);
    const decoded = await offCtx.decodeAudioData(arrayBuf);
    return this._resampleToTarget(decoded);
  }

  _resampleToTarget(audioBuffer) {
    const offCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * TARGET_SR), TARGET_SR);
    const src = offCtx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(offCtx.destination);
    src.start();
    return offCtx.startRendering().then((buf) => buf.getChannelData(0));
  }
}

export async function decodeFile(file) {
  const arrayBuf = await file.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: TARGET_SR });
  const decoded = await ctx.decodeAudioData(arrayBuf);
  await ctx.close();
  const offCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * TARGET_SR), TARGET_SR);
  const src = offCtx.createBufferSource();
  src.buffer = decoded;
  src.connect(offCtx.destination);
  src.start();
  const rendered = await offCtx.startRendering();
  return rendered.getChannelData(0);
}

export function segmentAudio(samples) {
  const segments = [];
  if (samples.length <= CHUNK_SAMPLES) {
    const padded = new Float32Array(CHUNK_SAMPLES);
    padded.set(samples);
    segments.push(padded);
  } else {
    for (let i = 0; i + CHUNK_SAMPLES <= samples.length; i += CHUNK_SAMPLES) {
      segments.push(samples.slice(i, i + CHUNK_SAMPLES));
    }
    const remainder = samples.length % CHUNK_SAMPLES;
    if (remainder > TARGET_SR) {
      const last = new Float32Array(CHUNK_SAMPLES);
      last.set(samples.slice(samples.length - remainder));
      segments.push(last);
    }
  }
  return segments;
}
