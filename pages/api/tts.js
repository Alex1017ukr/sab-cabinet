export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });
  const k = process.env.GOOGLE_TTS_KEY;
  if (!k) return res.status(500).json({ error: 'No GOOGLE_TTS_KEY' });
  const r = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + k, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: text.slice(0, 500) },
      voice: { languageCode: 'uk-UA', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 }
    })
  });
  const d = await r.json();
  if (!r.ok || !d.audioContent) return res.status(500).json({ error: d.error?.message || 'TTS error' });
  return res.json({ audio: d.audioContent });
}