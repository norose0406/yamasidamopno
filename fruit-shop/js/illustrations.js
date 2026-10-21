// 商品イラスト（インラインSVG）。外部画像を使わずに果物を描く。
(function (root) {
  const LEAF = '#5f9e4f';
  const STEM = '#7a5230';

  function gradient(id, [light, dark]) {
    return (
      '<defs><radialGradient id="' + id + '" cx="35%" cy="30%" r="75%">' +
      '<stop offset="0%" stop-color="' + light + '"/>' +
      '<stop offset="100%" stop-color="' + dark + '"/>' +
      '</radialGradient></defs>'
    );
  }

  function grape(id) {
    const rows = [[42, 54, 66, 78], [48, 60, 72], [54, 66], [60]];
    const ys = [46, 59, 72, 85];
    let berries = '';
    rows.forEach((row, i) => {
      row.forEach((x) => {
        berries += '<circle cx="' + x + '" cy="' + ys[i] + '" r="8" fill="url(#' + id + ')"/>';
      });
    });
    return (
      '<path d="M60 38c0-10 2-16 6-20" stroke="' + STEM + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M65 25c10-10 24-8 30 0-10 6-22 6-30 0z" fill="' + LEAF + '"/>' +
      berries
    );
  }

  function kiwi(id) {
    let seeds = '';
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const x = (68 + Math.cos(a) * 15).toFixed(1);
      const y = (72 + Math.sin(a) * 13).toFixed(1);
      seeds += '<ellipse cx="' + x + '" cy="' + y + '" rx="1.6" ry="2.6" fill="#2b2112" transform="rotate(' + ((a * 180) / Math.PI + 90).toFixed(0) + ' ' + x + ' ' + y + ')"/>';
    }
    return (
      '<ellipse cx="44" cy="54" rx="26" ry="32" fill="#8a6a3f" transform="rotate(-20 44 54)"/>' +
      '<ellipse cx="40" cy="44" rx="8" ry="12" fill="#fff" opacity=".12" transform="rotate(-20 40 44)"/>' +
      '<ellipse cx="68" cy="72" rx="32" ry="28" fill="#8a6a3f"/>' +
      '<ellipse cx="68" cy="72" rx="29" ry="25" fill="url(#' + id + ')"/>' +
      '<ellipse cx="68" cy="72" rx="9" ry="7" fill="#f4f7d8"/>' +
      seeds
    );
  }

  function corn(id) {
    let kernels = '';
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 50 + col * 7 + (row % 2) * 3.5;
        const y = 30 + row * 8;
        kernels += '<rect x="' + x + '" y="' + y + '" width="6" height="7" rx="2.5" fill="url(#' + id + ')"/>';
      }
    }
    return (
      '<ellipse cx="64" cy="64" rx="17" ry="40" fill="#d9a400" opacity=".35"/>' +
      kernels +
      '<path d="M62 106C40 96 30 70 36 44c6 22 16 42 28 56z" fill="#6aa84f"/>' +
      '<path d="M66 106c22-10 32-36 26-62-6 22-16 42-28 56z" fill="#4f8f3a"/>' +
      '<path d="M64 106c0-6 1-14 3-20" stroke="#4f8f3a" stroke-width="4" stroke-linecap="round"/>'
    );
  }

  const DRAW = { grape, kiwi, corn };

  // 同じ商品のイラストが一覧・詳細・カートに同時に出るので、scope でグラデーションIDを分ける。
  function illustration(product, scope) {
    const id = 'g-' + (scope || 'x') + '-' + product.id;
    const draw = DRAW[product.art.type] || grape;
    return (
      '<svg viewBox="0 0 120 120" role="img" aria-label="' + product.name + 'のイラスト">' +
      gradient(id, product.art.colors) +
      draw(id, product.art.colors) +
      '</svg>'
    );
  }

  root.illustration = illustration;
})(typeof self !== 'undefined' ? self : this);
