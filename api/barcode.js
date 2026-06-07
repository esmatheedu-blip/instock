export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'no code' });

  const serviceKey = process.env.FOOD_API_KEY;
  if (!serviceKey) return res.status(500).json({ error: 'API key not set' });

  // 식품의약품안전처 유통바코드 API
  const url = `https://openapi.foodsafetykorea.go.kr/api/${serviceKey}/I2570/json/1/5/BAR_CD=${encodeURIComponent(code)}`;

  try {
    const r = await fetch(url);
    const d = await r.json();

    // API 응답 정규화
    const rows = d?.I2570?.row || [];
    const items = rows.map(item => ({
      name: item.PRDLST_NM || '',
      brand: item.BSSH_NM || '',
      category: item.PRDLST_DCNM || '',
      barcode: item.BAR_CD || code,
    }));

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: 'api error', detail: e.message });
  }
}
