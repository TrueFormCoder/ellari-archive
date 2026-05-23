const BF_RITUAL_MAP = {"R.01": "invocation-crown", "R.02": "mirror-seal", "R.03": "mirror-seal", "R.04": "shadowlight-shield", "R.05": "shadowlight-shield", "R.06": "memory-unbinding", "R.07": "mirror-circuit", "R.08": "spiral-release", "R.09": "dna-flame", "R.10": "void-mirror", "R.11": "mirror-seal", "R.12": "winged-threshold", "R.13": "invocation-crown", "R.14": "mirror-audit", "R.15": "winged-threshold", "R.16": "mirror-audit", "R.17": "linebreaker-axis", "Zakhor": "memory-spiral", "MIRROR™": "mirror-circuit"};
const BF_SIGILS = ["mirror-seal", "dna-flame", "shadowlight-shield", "spiral-release", "void-mirror", "memory-spiral", "winged-threshold", "linebreaker-axis", "invocation-crown", "memory-unbinding", "mirror-audit", "mirror-circuit"];

function getSigilId(ritualStr) {
  // Extract ritual number from strings like "R.09 — DNA Flame Alignment"
  const match = (ritualStr||'').match(/R\.\d+|R\.\d\d|MIRROR™|Zakhor/);
  if (!match) return null;
  return BF_RITUAL_MAP[match[0]] || null;
}
function renderSigil(ritualStr, stroke='#c9c4cf', size=80) {
  const id = getSigilId(ritualStr);
  if (!id) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" style="overflow:visible">
    <use href="#sig-${id}" stroke="${stroke}" fill="none"/>
  </svg>`;
}
