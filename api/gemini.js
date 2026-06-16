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
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `이미지에서 화장품/뷰티 제품 정보를 찾아주세요.
오늘 날짜는 ${today} 입니다.
반드시 아래 형식으로만 답하세요 (다른 말 금지):
NAME: 제품 전체 이름 (브랜드명 포함해서 전체 다)
BRAND: 브랜드명만 (제조사/회사명)
CATEGORY: 스킨/토너/에센스/세럼/크림/로션/미스트/오일/선케어/마스크팩/클렌징/메이크업/네일/헤어케어/바디케어/향수/디퓨저/건강식품/기타 중 하나
CAPACITY: 패키지에 적힌 용량 (예: 50ml, 30g, 200ml, 1.5oz). 보이지 않으면 빈칸
EXPIRY: 유통기한/사용기한/제조일+사용기간 을 YYYY-MM-DD 형식으로 변환. 보이지 않으면 빈칸
  - "EXP 2026.08.15", "유통기한: 2026-08-15" 형식이면 그대로 변환
  - "제조일 2025.05 + 12M" 같이 제조일+사용기간만 있으면 제조일에 사용기간을 더해 계산
  - 연도가 2자리(예: 26.08.15)면 2026년으로 해석
  - 월만 표기된 경우(예: 2026.08) 해당 월의 1일로 표기

예시:
NAME: 덴프스 덴마크 유산균이야기 30캡슐
BRAND: 덴프스
CATEGORY: 기타
CAPACITY: 30캡슐
EXPIRY: 2026-12-31`;
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
    // NAME / BRAND / CATEGORY / CAPACITY / EXPIRY 파싱
    const name = text.match(/NAME:\s*(.+)/i)?.[1]?.trim() || '';
    const brand = text.match(/BRAND:\s*(.+)/i)?.[1]?.trim() || '';
    const category = text.match(/CATEGORY:\s*(.+)/i)?.[1]?.trim() || '기타';
    const capacity = text.match(/CAPACITY:\s*(.+)/i)?.[1]?.trim() || '';
    let expiry = text.match(/EXPIRY:\s*(.+)/i)?.[1]?.trim() || '';

    // 날짜 형식 검증/정규화 (YYYY-MM-DD 아니면 빈값 처리)
    if (expiry) {
      const m = expiry.match(/(\d{4})[.\-\/](\d{1,2})(?:[.\-\/](\d{1,2}))?/);
      if (m) {
        const yyyy = m[1];
        const mm = m[2].padStart(2, '0');
        const dd = (m[3] || '01').padStart(2, '0');
        expiry = `${yyyy}-${mm}-${dd}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        expiry = '';
      }
    }

    res.json({ success: true, name, brand, category, capacity, expiry });
  } catch (e) {
    res.status(500).json({ error: 'Gemini API error', detail: e.message });
  }
}
