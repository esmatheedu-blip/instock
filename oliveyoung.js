// api/oliveyoung.js
// 올리브영 "공식" API는 없어서, 비공식 공개 프록시(daiso-mcp, https://github.com/hmmhmmhm/daiso-mcp)를
// 경유해서 상품을 검색합니다. 이 엔드포인트는 올리브영이 아니라 제3자가 운영하므로
// 언제든 응답이 늦어지거나(503), 응답 형식이 바뀌거나, 중단될 수 있습니다.
// 프론트에서 직접 mcp.aka.page를 호출하면 CORS에 걸릴 수 있어 여기서 한 번 감싸줍니다.

export default async function handler(req, res) {
  const { keyword, size = '6' } = req.query;

  if (!keyword || !String(keyword).trim()) {
    return res.status(400).json({ success: false, error: 'keyword가 필요해요' });
  }

  const upstream = `https://mcp.aka.page/api/oliveyoung/products?keyword=${encodeURIComponent(keyword)}&size=${encodeURIComponent(size)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(upstream, { signal: controller.signal });
    clearTimeout(timeout);

    if (!r.ok) {
      return res.status(502).json({ success: false, error: `업스트림 오류 (${r.status})` });
    }

    const data = await r.json();

    // 응답 스키마가 공식 문서화돼있지 않아서, 흔히 나올 수 있는 형태들을 방어적으로 처리합니다.
    const rawList =
      data.products || data.items || data.data ||
      (Array.isArray(data) ? data : []) || [];

    const products = rawList.slice(0, Number(size) || 6).map(p => ({
      name: p.goodsName || p.name || p.title || '',
      price: p.priceToPay ?? p.price ?? null,
      image: p.imageUrl || p.image || '',
      inStock: p.inStock ?? p.in_stock ?? null,
      goodsNumber: p.goodsNumber || p.id || '',
    })).filter(p => p.name);

    return res.status(200).json({
      success: true,
      totalCount: data.totalCount ?? products.length,
      products,
    });
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    return res.status(500).json({
      success: false,
      error: timedOut ? '검색 시간이 초과됐어요' : '검색에 실패했어요',
    });
  }
}
