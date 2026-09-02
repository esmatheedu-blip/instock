export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'query 파라미터가 필요합니다' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  const prompt = `아래 화장품/뷰티 제품 이름을 보고 정보를 알려주세요.
제품명: "${query}"

반드시 아래 형식으로만 답하세요 (다른 말 금지):
NAME: 제품 전체 이름 (브랜드명 포함해서 전체 다, 입력값을 정제해서)
BRAND: 브랜드명만 (제조사/회사명)
CATEGORY: 스킨/토너/에센스/세럼/크림/로션/미스트/오일/선케어/마스크팩/클렌징/메이크업/네일/헤어케어/바디케어/향수/디퓨저/건강식품/기타 중 하나
CAPACITY: 이 제품의 일반적인 판매 용량 (예: 50ml, 30g, 200ml). 모르면 빈칸

만약 이 이름이 실제 제품이 아니거나 확신이 없으면:
NAME: (그대로 입력값)
BRAND: 
CATEGORY: 기타
CAPACITY: `;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
        })
      }
    );

    const d = await r.json();
    if (!r.ok) {
      return res.status(500).json({ error: 'Gemini error', detail: d });
    }

    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const name = text.match(/NAME:\s*(.+)/i)?.[1]?.trim() || query;
    const brand = text.match(/BRAND:\s*(.+)/i)?.[1]?.trim() || '';
    const category = text.match(/CATEGORY:\s*(.+)/i)?.[1]?.trim() || '기타';
    const capacity = text.match(/CAPACITY:\s*(.+)/i)?.[1]?.trim() || '';

    return res.status(200).json({
      success: true,
      name,
      brand,
      category,
      capacity
    });

  } catch (e) {
    return res.status(500).json({ error: 'Gemini API error', detail: e.message });
  }
}
