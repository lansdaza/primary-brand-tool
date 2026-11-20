// Recording a canvas animation as a video file.
// Where the browser can encode H.264 (WebCodecs), each frame is drawn, encoded and put in an MP4 one at a time, so
// the file is frame-exact however slow the drawing is, and it plays everywhere social platforms expect. Elsewhere the
// browser's own recorder captures the canvas in real time; that file is an MP4 only if the browser records MP4, and
// is named for what it really is.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const AVC = ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.42001f'];
const tick = () => new Promise((ok) => setTimeout(ok, 0));

async function avcConfig(width, height, fps) {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;
  for (const codec of AVC) {
    const config = { codec, width, height, bitrate: Math.round(width * height * fps * 0.16), framerate: fps, avc: { format: 'avc' } };
    try { if ((await VideoEncoder.isConfigSupported(config)).supported) return config; } catch { /* try the next profile */ }
  }
  return null;
}

// draw(i) paints frame i (0 … frames-1) onto canvas. progress(share) reports 0 to 1. signal stops it.
export async function recordCanvas(canvas, { frames, fps = 30, draw, progress = () => {}, signal } = {}) {
  const { width, height } = canvas;
  const config = await avcConfig(width, height, fps);
  if (config) {
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({ target, video: { codec: 'avc', width, height, frameRate: fps }, fastStart: 'in-memory' });
    let failed = null;
    const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { failed = e; } });
    encoder.configure(config);
    for (let i = 0; i < frames; i++) {
      if (signal?.aborted) { encoder.close(); throw Object.assign(new Error('stopped'), { code: 'stopped' }); }
      if (failed) throw failed;
      draw(i);
      const frame = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      while (encoder.encodeQueueSize > 6) await new Promise((ok) => setTimeout(ok, 4));
      if (i % 3 === 0) { progress(i / frames); await tick(); }
    }
    await encoder.flush(); encoder.close();
    if (failed) throw failed;
    muxer.finalize();
    progress(1);
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ext: 'mp4', exact: true };
  }
  // The browser's recorder, in real time: each frame is drawn at its moment.
  const mime = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m));
  if (!mime) throw Object.assign(new Error('This browser cannot record video.'), { code: 'unsupported' });
  draw(0);
  const rec = new MediaRecorder(canvas.captureStream(fps), { mimeType: mime, videoBitsPerSecond: 12e6 }), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((ok) => { rec.onstop = ok; });
  rec.start();
  const t0 = performance.now(), length = frames / fps;
  await new Promise((ok) => { const step = () => { const t = (performance.now() - t0) / 1000; if (signal?.aborted) return ok(); draw(Math.min(frames - 1, Math.round(t * fps))); progress(Math.min(1, t / length)); if (t >= length) ok(); else requestAnimationFrame(step); }; step(); });
  rec.stop(); await done;
  if (signal?.aborted) throw Object.assign(new Error('stopped'), { code: 'stopped' });
  const type = mime.split(';')[0];
  return { blob: new Blob(chunks, { type }), ext: type === 'video/mp4' ? 'mp4' : 'webm', exact: false };
}
