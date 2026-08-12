const fs = require('fs');
const path = require('path');

function createSilentWav(durationSec = 1, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 8;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Fill with silence (128 for 8-bit unsigned PCM)
  buffer.fill(128, 44);
  return buffer;
}

const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const files = [
  '5secondes.mp3',
  'roulement_de_tambour.wav',
  'reponse_revelation.mp3',
  'podium_victoire.mp3'
];

files.forEach(f => {
  const buf = createSilentWav(1);
  fs.writeFileSync(path.join(audioDir, f), buf);
  console.log('✅ Generated placeholder audio:', f);
});
