const boundaries = (n) => Math.max(Math.min(n, 255), 0);

export function color(c, amt) {
  let col = c;
  let usePound = false;

  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }

  const num = parseInt(col, 16);

  const r = boundaries((num >> 16) + amt);

  let b = boundaries(((num >> 8) & 0x00ff) + amt);

  let g = boundaries((num & 0x0000ff) + amt);

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
}
