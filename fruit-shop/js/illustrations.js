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

  function peach(id) {
    return (
      '<path d="M60 26c-4-8-12-12-20-10 4 6 10 10 20 10z" fill="' + LEAF + '"/>' +
      '<path d="M60 30c22-6 40 10 40 34 0 22-18 38-40 38S20 86 20 64c0-24 18-40 40-34z" fill="url(#' + id + ')"/>' +
      '<path d="M60 32c-6 14-6 40 2 66" stroke="#d9645a" stroke-width="2" fill="none" opacity=".45"/>' +
      '<ellipse cx="44" cy="50" rx="8" ry="5" fill="#fff" opacity=".35"/>'
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

  function plum(id) {
    return (
      '<path d="M60 30c0-6 2-10 5-13" stroke="' + STEM + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M64 22c8-6 18-4 22 2-8 4-16 4-22-2z" fill="' + LEAF + '"/>' +
      '<circle cx="60" cy="66" r="36" fill="url(#' + id + ')"/>' +
      '<path d="M60 31c-8 12-8 50 0 70" stroke="#000" stroke-width="1.5" fill="none" opacity=".15"/>' +
      '<ellipse cx="46" cy="52" rx="8" ry="5" fill="#fff" opacity=".3"/>'
    );
  }

  function cherry(id) {
    return (
      '<path d="M40 76C46 50 58 30 68 18M82 72C78 50 72 32 68 18" stroke="' + STEM + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M68 18c10-8 22-6 26 2-10 4-18 4-26-2z" fill="' + LEAF + '"/>' +
      '<circle cx="40" cy="82" r="18" fill="url(#' + id + ')"/>' +
      '<circle cx="82" cy="80" r="18" fill="url(#' + id + ')"/>' +
      '<ellipse cx="34" cy="76" rx="5" ry="3" fill="#fff" opacity=".45"/>' +
      '<ellipse cx="76" cy="74" rx="5" ry="3" fill="#fff" opacity=".45"/>'
    );
  }

  function kaki(id) {
    let fruits = '';
    [[38, 70], [82, 70], [60, 52]].forEach(([x, y]) => {
      fruits +=
        '<ellipse cx="' + x + '" cy="' + y + '" rx="22" ry="20" fill="url(#' + id + ')"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="22" ry="20" fill="#fff" opacity=".18"/>' +
        '<path d="M' + (x - 6) + ' ' + (y - 19) + 'l6 5 6-5" stroke="#4a3520" stroke-width="3" fill="none" stroke-linecap="round"/>';
    });
    return '<path d="M20 96h80" stroke="#c8a97e" stroke-width="4" stroke-linecap="round"/>' + fruits;
  }

  function jam(id, colors) {
    function jar(x, color) {
      return (
        '<rect x="' + (x - 13) + '" y="40" width="26" height="8" rx="2" fill="#c49a5a"/>' +
        '<rect x="' + (x - 15) + '" y="48" width="30" height="46" rx="6" fill="' + color + '"/>' +
        '<rect x="' + (x - 10) + '" y="62" width="20" height="14" rx="2" fill="#fffaf0"/>' +
        '<rect x="' + (x - 11) + '" y="52" width="4" height="34" rx="2" fill="#fff" opacity=".35"/>'
      );
    }
    return jar(32, colors[0]) + jar(60, colors[1]) + jar(88, '#a8c66c');
  }

  const DRAW = { peach, grape, plum, cherry, kaki, jam };

  // 同じ商品のイラストが一覧・詳細・カートに同時に出るので、scope でグラデーションIDを分ける。
  function illustration(product, scope) {
    const id = 'g-' + (scope || 'x') + '-' + product.id;
    const draw = DRAW[product.art.type] || plum;
    return (
      '<svg viewBox="0 0 120 120" role="img" aria-label="' + product.name + 'のイラスト">' +
      gradient(id, product.art.colors) +
      draw(id, product.art.colors) +
      '</svg>'
    );
  }

  root.illustration = illustration;
})(typeof self !== 'undefined' ? self : this);
