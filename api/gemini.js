export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const image = req.body?.image;
  const mimeType = req.body?.mimeType || 'image/jpeg';
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const prompt = `이미지에서 화장품/뷰티 제품 정보를 찾아주세요.
반드시 아래 형식으로만 답하세요 (다른 말 금지):
NAME: 제품명
BRAND: 브랜드명
CATEGORY: 스킨케어/선크림/메이크업/바디케어/헤어케어/향수/미스트/클렌징/기타 중 하나`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: image } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
        })
      }
    );

    const d = await r.json();
    if (!r.ok) return res.status(500).json({ error: 'Gemini error', detail: d });

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // NAME: / BRAND: / CATEGORY: 파싱
    const name = text.match(/NAME:\s*(.+)/i)?.[1]?.trim() || '';
    const brand = text.match(/BRAND:\s*(.+)/i)?.[1]?.trim() || '';
    const category = text.match(/CATEGORY:\s*(.+)/i)?.[1]?.trim() || '기타';

    res.json({ success: true, name, brand, category });

  } catch (e) {
    res.status(500).json({ error: 'Gemini API error', detail: e.message });
  }
}
