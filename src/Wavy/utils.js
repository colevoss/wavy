// export function sampleRate(buffer) {
//   return buffer.sampleRate;
// }

// export function msToSample(ms, buffer) {
//   const samplesPerMs = sampleRate(buffer) / 1000;

//   return Math.floor(ms * samplesPerMs);
// }

// export function beginningSample(startMs = 0, buffer) {
//   return msToSample(startMs, buffer);
// }

// export function endSample(endMs, buffer) {
//   if (!endMs) return buffer.duration * 1000;

//   return msToSample(endMs, buffer);
// }
