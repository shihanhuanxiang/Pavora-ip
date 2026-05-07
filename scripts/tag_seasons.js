const fs = require('fs');
const fPath = './src/modules/narrative/constants/outfitsV2_F.json';
const mPath = './src/modules/narrative/constants/outfitsV2_M.json';

const getSeasonF = (o) => {
  const p = o.pillars;
  const outer = (p.layer_outer || '').toLowerCase();
  const top = (p.top || '').toLowerCase();
  const bottom = (p.bottom || '').toLowerCase();
  const inner = (p.layer_inner || '').toLowerCase();
  const allText = JSON.stringify(p).toLowerCase();

  // 1. layer_outer 有厚重大衣 (wool coat, puffer, trench coat) 或材質是 wool/cashmere 且有 outer -> winter
  // 或是 top 是 turtleneck/cashmere 且是冬天的
  if (outer.includes('wool coat') || outer.includes('puffer') || outer.includes('trench coat') || outer.includes('camel coat') || 
      ((outer.includes('wool') || outer.includes('cashmere')) && !allText.includes('shorts'))) {
    return 'winter';
  }
  if (top.includes('turtleneck') || (top.includes('cashmere') && !allText.includes('shorts'))) {
    return 'winter';
  }

  // 2. top 或 bottom 是細肩帶/無袖/shorts/mini skirt -> summer
  const summerKws = ['spaghetti strap', 'sleeveless', 'short sleeve', 'shorts', 'mini skirt', 'mini shorts', 'linen', 'tank', 'sports bra', 'racerback', 'kaftan', 'sundress', 'bedsheet', 'micro shorts', 'micro skirt', 'tennis skirt', 'camisole', 'strapless'];
  if (summerKws.some(kw => allText.includes(kw))) {
    return 'summer';
  }

  // 3. layer_outer 是 blazer/cardigan/bomber/hoodie/light jacket -> spring_autumn
  const springKws = ['blazer', 'cardigan', 'bomber', 'hoodie', 'light jacket', 'jacket', 'vest', 'pullover', 'wrap', 'harrington', 'varsity', 'overshirt', 'track jacket'];
  if (springKws.some(kw => outer.includes(kw) || top.includes(kw))) {
    return 'spring_autumn';
  }

  return 'all';
};

const getSeasonM = (o) => {
  const p = o.pillars;
  const outer = (p.layer_outer || '').toLowerCase();
  const top = (p.top || '').toLowerCase();
  const bottom = (p.bottom || '').toLowerCase();
  const inner = (p.layer_inner || '').toLowerCase();
  const allText = JSON.stringify(p).toLowerCase();

  if (outer.includes('wool coat') || outer.includes('puffer') || outer.includes('trench coat') || outer.includes('camel coat') ||
      ((outer.includes('wool') || outer.includes('cashmere')) && !allText.includes('shorts'))) {
    return 'winter';
  }
  if (top.includes('turtleneck') || (top.includes('cashmere') && !allText.includes('shorts'))) {
    return 'winter';
  }

  const summerKws = ['shorts', 'linen', 'short sleeve', 'tank', 'kaftan', 'bowling shirt', 'hawaiian', 'bathrobe', 'basketball jersey', 'jersey shorts'];
  if (summerKws.some(kw => allText.includes(kw))) {
    return 'summer';
  }

  const springKws = ['blazer', 'cardigan', 'bomber', 'hoodie', 'light jacket', 'jacket', 'vest', 'overshirt', 'pullover', 'harrington', 'varsity', 'utility jacket', 'flannel', 'track jacket'];
  if (springKws.some(kw => outer.includes(kw) || top.includes(kw))) {
    return 'spring_autumn';
  }

  return 'all';
};

const fData = JSON.parse(fs.readFileSync(fPath, 'utf8'));
const mData = JSON.parse(fs.readFileSync(mPath, 'utf8'));

fs.writeFileSync(fPath, JSON.stringify(fData.map(o => {
  const { season, ...rest } = o; // Remove existing season if it exists to avoid duplication or order issues
  const newSeason = getSeasonF(o);
  
  // Reorder to put season at the top if possible, or just add it
  return { outfit_id: o.outfit_id, season: newSeason, ...rest };
}), null, 2));

fs.writeFileSync(mPath, JSON.stringify(mData.map(o => {
  const { season, ...rest } = o;
  const newSeason = getSeasonM(o);
  return { outfit_id: o.outfit_id, season: newSeason, ...rest };
}), null, 2));

console.log('Season tagging complete.');
