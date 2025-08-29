// import React, { useMemo, useState, useEffect } from 'react';
// import '../../css/MatchingClothes.css';
// import { getUserStyle } from '../../api/UserApi';

// export default function MatchingClothes({
//   clothingItems,
//   onSelectShirt,
//   onSelectPants,
//   onSelectHat,     // ← חדש (אופציונלי)
//   onSelectShoes    // ← חדש (אופציונלי)
// }) {
//   const [message, setMessage] = useState('');
//   const [style, setStyle] = useState(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const s = await getUserStyle();
//         setStyle(s);
//       } catch (e) {
//         console.error('Failed to load style', e);
//       }
//     })();
//   }, []);

//   // ========= Helpers =========
//   const toArray = (v) => Array.isArray(v) ? v : [v].filter(Boolean);
//   const getTokens = (item) =>
//     [...toArray(item?.type), ...toArray(item?.style), ...toArray(item?.tags)]
//       .filter(Boolean)
//       .map((t) => String(t).toLowerCase());

//   const matchByKeywords = (item, keywords) => {
//     const tokens = getTokens(item);
//     return tokens.some((t) => keywords.some((k) => t.includes(k)));
//   };

//   const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

//   // ========= Color helpers (expanded & smart) =========
//   const KNOWN_COLORS = {
//     black:  ['black','שחור','charcoal','graphite','anthracite'],
//     white:  ['white','לבן','ivory','off white','off-white','cream'],
//     gray:   ['gray','grey','אפור','charcoal','slate','graphite'],
//     blue:   ['blue','כחול','indigo','royal blue'],
//     lightblue: ['light blue','sky blue','תכלת','aqua','cyan','turquoise','teal'],
//     navy:   ['navy','נייבי','כחול כהה'],
//     red:    ['red','אדום','burgundy','maroon','wine','oxblood','garnet'],
//     green:  ['green','ירוק','olive','khaki','sage','mint','army','forest'],
//     yellow: ['yellow','צהוב','mustard','gold'],
//     pink:   ['pink','ורוד','fuchsia','magenta','rose','blush'],
//     purple: ['purple','סגול','lilac','lavender','violet','mauve'],
//     beige:  ['beige','בז','בז\'','cream','ivory','sand','stone'],
//     brown:  ['brown','חום','tan','camel','taupe','mocha','walnut','chocolate','espresso','lisbon brown','coffee'],
//     orange: ['orange','כתום','coral','salmon','peach','apricot'],
//     denim:  ['denim','דנים','ג׳ינס','גינס','indigo denim'],
//   };

//   const NEUTRALS = new Set(['black','white','gray','beige','denim','brown','navy']);

//   const COLOR_COMPATIBILITY = {
//     black: 'all',
//     white: 'all',
//     gray:  'all',
//     beige: 'all',
//     denim: 'all',
//     navy:  'all',
//     brown: ['white','beige','blue','lightblue','denim','pink','green','black'],
//     blue:  ['white','beige','brown','gray','pink','yellow','orange','denim','navy','lightblue','black'],
//     lightblue: ['white','beige','brown','navy','denim','black','blue'],
//     red:   ['white','black','denim','beige','navy','pink'],
//     green: ['white','black','beige','brown','denim','pink'],
//     yellow:['white','black','navy','blue','denim','brown'],
//     pink:  ['white','black','gray','navy','denim','brown','blue','green','purple'],
//     purple:['white','black','gray','pink','navy','denim'],
//     orange:['white','black','navy','blue','denim','brown'],
//   };

//   const hexToBase = (hex) => {
//     try {
//       const h = hex.replace('#','');
//       const r = parseInt(h.length===3 ? h[0]+h[0] : h.slice(0,2), 16);
//       const g = parseInt(h.length===3 ? h[1]+h[1] : h.slice(2,4), 16);
//       const b = parseInt(h.length===3 ? h[2]+h[2] : h.slice(4,6), 16);
//       const max = Math.max(r,g,b), min = Math.min(r,g,b);
//       const d = max - min;
//       let H = 0;
//       if (d) {
//         switch (max) {
//           case r: H = ((g-b)/d + (g<b?6:0)); break;
//           case g: H = ((b-r)/d + 2); break;
//           default: H = ((r-g)/d + 4);
//         }
//         H *= 60;
//       }
//       if (H<15 || H>=345) return 'red';
//       if (H<45)  return 'orange';
//       if (H<70)  return 'yellow';
//       if (H<170) return 'green';
//       if (H<200) return 'lightblue';
//       if (H<255) return 'blue';
//       if (H<290) return 'purple';
//       return 'pink';
//     } catch { return ''; }
//   };

//   const resolveBaseColor = (text) => {
//     if (!text) return '';
//     const lower = String(text).toLowerCase().trim();

//     const hexMatch = lower.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i);
//     if (hexMatch) {
//       const fromHex = hexToBase(hexMatch[0]);
//       if (fromHex) return fromHex;
//     }

//     for (const [base, aliases] of Object.entries(KNOWN_COLORS)) {
//       if (aliases.some(a => lower.includes(a))) return base;
//     }

//     const parts = lower.split(/[\s\-_/]+/g);
//     for (const part of parts) {
//       for (const [base, aliases] of Object.entries(KNOWN_COLORS)) {
//         if (aliases.includes(part)) return base;
//       }
//     }

//     const PATTERNS = [
//       [/olive|khaki|army|sage|mint|forest/, 'green'],
//       [/burgundy|maroon|wine|oxblood/, 'red'],
//       [/lilac|lavender|violet|mauve/, 'purple'],
//       [/coral|salmon|peach|apricot/, 'orange'],
//       [/ivory|off ?white|cream|stone|sand/, 'beige'],
//       [/charcoal|graphite|slate/, 'gray'],
//       [/camel|tan|taupe|mocha|chocolate|espresso|walnut|coffee|lisbon/, 'brown'],
//       [/teal|turquoise|aqua|cyan/, 'lightblue'],
//       [/indigo.*denim|denim/, 'denim'],
//     ];
//     for (const [re, base] of PATTERNS) {
//       if (re.test(lower)) return base;
//     }

//     return '';
//   };

//   const getItemBaseColor = (item) => {
//     const fromBase = resolveBaseColor(item?.baseColor);
//     if (fromBase) return fromBase;

//     const direct = resolveBaseColor(item?.color);
//     if (direct) return direct;

//     const rawColors = Array.isArray(item?.colors) ? item.colors : [item?.colors].filter(Boolean);
//     for (const c of rawColors) {
//       const base = resolveBaseColor(c);
//       if (base) return base;
//     }

//     const tokens = getTokens(item);
//     for (const tok of tokens) {
//       const c = resolveBaseColor(tok);
//       if (c) return c;
//     }
//     return '';
//   };

//   const isColorMatch = (top, bottom) => {
//     const cTop = getItemBaseColor(top);
//     const cBot = getItemBaseColor(bottom);
//     if (!cTop || !cBot) return true;
//     if (cTop === cBot) return true;
//     if (NEUTRALS.has(cTop) || NEUTRALS.has(cBot)) return true;
//     const rule = COLOR_COMPATIBILITY[cTop];
//     if (!rule) return false;
//     if (rule === 'all') return true;
//     return rule.includes(cBot);
//   };

//   // ========= Style-aware scoring =========
//   const scoreItemByStyle = (item, s) => {
//     if (!s) return 0;
//     const tokens = new Set(getTokens(item));
//     const baseColor = getItemBaseColor(item);
//     let score = 0;

//     for (const k of (s.keywords || [])) if (tokens.has(String(k).toLowerCase())) score += 3;
//     for (const d of (s.disliked || [])) if (tokens.has(String(d).toLowerCase())) score -= 4;

//     if (baseColor && s.colorsFav?.includes(baseColor))   score += 2;
//     if (baseColor && s.colorsAvoid?.includes(baseColor)) score -= 6;

//     return score;
//   };

//   const dressCodeBoost = (item, s) => {
//     if (!s?.dressCode) return 0;
//     const t = getTokens(item);
//     const has = (arr) => arr.some(x => t.includes(x));
//     switch (s.dressCode) {
//       case 'sport':     return has(['sport','gym','running','athletic']) ? 3 : -1;
//       case 'evening':   return has(['silk','satin','chiffon','lace','organza','dress','evening']) ? 3 : -1;
//       case 'work':      return has(['elegant','trousers','slacks','dress pants','tailored','suit']) ? 2 : 0;
//       case 'religious': return has(['modest','צנוע']) ? 2 : 0;
//       case 'everyday':  return has(['jeans','denim','tee','t-shirt','shirt']) ? 1 : 0;
//       default:          return 0;
//     }
//   };

//   const hardRulePenalty = (top, bottom) => {
//     const combined = getTokens(top).concat(getTokens(bottom));
//     const isSport = combined.some(t => String(t).includes('sport'));
//     const isSkirt = combined.some(t => t === 'skirt' || t === 'חצאית');
//     const isElegant = combined.some(t => t === 'elegant' || t === 'אלגנט');
//     return (isSport && isSkirt && isElegant) ? -100 : 0;
//   };

//   const scorePair = (top, bottom, s) => {
//     let sc = 0;
//     sc += scoreItemByStyle(top, s) + dressCodeBoost(top, s);
//     if (bottom) sc += scoreItemByStyle(bottom, s) + dressCodeBoost(bottom, s);
//     sc += isColorMatch(top, bottom) ? 2 : -5;
//     sc += hardRulePenalty(top, bottom);
//     return sc;
//   };

//   const pickBestPair = (tops, bottoms, s) => {
//     let best = null, bestScore = -Infinity;
//     for (const t of tops) for (const b of bottoms) {
//       const sc = scorePair(t, b, s);
//       if (sc > bestScore) { bestScore = sc; best = [t, b]; }
//     }
//     return best;
//   };

//   // ========= Accessories (Hats & Shoes) =========
//   const isHeadwear = (item) =>
//     matchByKeywords(item, [
//       'hat','cap','beanie','beret','bucket','visor','headwrap','headscarf','kipah','kippah',
//       'כובע','כיפה','מטפחת','כיסוי ראש'
//     ]);

//   const isFootwear = (item) =>
//     matchByKeywords(item, [
//       'shoes','sneakers','trainers','runners','loafers','oxfords','heels','pumps','boots','ankle boots','sandals','flip flops','slippers',
//       'נעל','נעליים','סניקרס','נעלי ספורט','מגפיים','סנדלים','כפכפים','עקב','נעל אלגנט'
//     ]);

//   const headwear = useMemo(() => clothingItems.filter(isHeadwear), [clothingItems]);
//   const footwear = useMemo(() => clothingItems.filter(isFootwear), [clothingItems]);

//   // affinity צבע: כובע מול העליונית; נעל מול התחתון/שמלה
//   const colorAffinity = (accessory, anchorItem) => {
//     if (!accessory || !anchorItem) return 0;
//     const cA = getItemBaseColor(accessory);
//     const cB = getItemBaseColor(anchorItem);
//     if (!cA || !cB) return 0;
//     if (cA === cB) return 2;
//     if (NEUTRALS.has(cA) || NEUTRALS.has(cB)) return 1;
//     const rule = COLOR_COMPATIBILITY[cA];
//     return rule === 'all' ? 1 : (rule?.includes(cB) ? 1 : -1);
//   };

//   const accessoryDressCodeBoost = (item, s, role /* 'hat' | 'shoes' */) => {
//     if (!s?.dressCode) return 0;
//     const t = getTokens(item);
//     const has = (...arr) => arr.some(x => t.includes(x));
//     switch (s.dressCode) {
//       case 'sport':
//         return role === 'shoes'
//           ? (has('sneakers','trainers','running','gym') ? 4 : -1)
//           : (has('cap','כובע','headscarf','מטפחת') ? 1 : 0);
//       case 'evening':
//         return role === 'shoes'
//           ? (has('heels','pumps','oxfords','loafers') ? 4 : -1)
//           : (has('beret','headscarf','מטפחת') ? 2 : 0);
//       case 'work':
//         return role === 'shoes'
//           ? (has('oxfords','loafers','boots') ? 3 : 0)
//           : (has('hat','beret') ? 1 : 0);
//       case 'religious':
//         return role === 'hat'
//           ? (has('kipah','kippah','headscarf','כיפה','מטפחת','כיסוי','headcover') ? 4 : 0)
//           : 0;
//       default:
//         return 0;
//     }
//   };

//   const scoreAccessory = (item, s, role, anchorItem) => {
//     if (!item) return -Infinity;
//     let sc = 0;
//     sc += scoreItemByStyle(item, s);
//     sc += accessoryDressCodeBoost(item, s, role);
//     sc += colorAffinity(item, anchorItem);
//     return sc;
//   };

//   const pickBestAccessory = (list, s, role, anchorItem, minGain = 2) => {
//     if (!list?.length) return null;
//     let best = null, bestScore = -Infinity;
//     for (const it of list) {
//       const sc = scoreAccessory(it, s, role, anchorItem);
//       if (sc > bestScore) { bestScore = sc; best = it; }
//     }
//     return bestScore >= minGain ? best : null;
//   };

//   // ========= Rulesets =========
//   // Casual (jeans + shirt)
//   const isShirt = (item) =>
//     matchByKeywords(item, [
//       'shirt','t-shirt','tee','top','blouse','button-down','henley','polo','jersey',
//       'overshirt','camisole','tank','chemise','crewneck','v-neck',
//       'חולצה','טישירט','טי-שירט','טופ','מכופתרת'
//     ]);
//   const isJeans = (item) => matchByKeywords(item, ['jeans','denim','ג׳ינס','גינס']);

//   const shirts = useMemo(() => clothingItems.filter(isShirt), [clothingItems]);
//   const jeans  = useMemo(() => clothingItems.filter(isJeans),  [clothingItems]);

//   const handlePickMatchingPair = () => {
//     if (!jeans.length)  return setMessage('לא נמצאו מכנסי ג׳ינס בארון.');
//     if (!shirts.length) return setMessage('לא נמצאו חולצות בארון.');
//     const pair = pickBestPair(shirts, jeans, style);
//     if (!pair) return setMessage('נמצאו חולצות וג׳ינסים אך בלי התאמה מספקת. הוסיפו תגיות צבע/סגנון.');
//     const [top, bottom] = pair;
//     setMessage('');
//     onSelectPants?.(bottom);
//     onSelectShirt?.(top);

//     // אביזרים (אופציונלי)
//     const hat   = pickBestAccessory(headwear, style, 'hat',   top,    2);
//     const shoes = pickBestAccessory(footwear, style, 'shoes', bottom, 3);
//     onSelectHat?.(hat || null);
//     onSelectShoes?.(shoes || null);
//   };

//   // Elegant (no jeans)
//   const isElegantPants = (item) =>
//     matchByKeywords(item, [
//       'trousers','slacks','dress pants','tailored pants','suit pants','elegant',
//       'מכנס מחויט','מכנס מחוייט','מכנסי בד','מכנס אלגנט','מכנס חליפה'
//     ]);
//   const isSkirt = (item) =>
//     matchByKeywords(item, [
//       'skirt','pencil skirt','midi skirt','maxi skirt',
//       'חצאית','עיפרון','מידי','מקסי'
//     ]);
//   const isElegantTop = (item) =>
//     matchByKeywords(item, [
//       'blouse','button-down','silk','satin','camisole','top',
//       'חולצה אלגנטית','מכופתרת','משי','סאטן','טופ אלגנטי'
//     ]);

//   const elegantBottoms = useMemo(
//     () => clothingItems.filter((it) => (isElegantPants(it) || isSkirt(it)) && !isJeans(it)),
//     [clothingItems]
//   );
//   const elegantTops = useMemo(
//     () => clothingItems.filter(isElegantTop),
//     [clothingItems]
//   );

//   const handlePickElegantPair = () => {
//     if (!elegantBottoms.length) return setMessage('לא נמצאו מכנסיים מחוייטים או חצאיות בארון.');
//     if (!elegantTops.length)    return setMessage('לא נמצאו חולצות אלגנטיות בארון.');
//     const pair = pickBestPair(elegantTops, elegantBottoms, style);
//     if (!pair) return setMessage('נמצאו פריטי אלגנט אך בלי התאמה. הוסיפו תגיות צבע/סגנון.');
//     const [top, bottom] = pair;
//     setMessage('');
//     onSelectPants?.(bottom);
//     onSelectShirt?.(top);

//     // אביזרים (אופציונלי)
//     const hat   = pickBestAccessory(headwear, style, 'hat',   top,    2);
//     const shoes = pickBestAccessory(footwear, style, 'shoes', bottom, 3);
//     onSelectHat?.(hat || null);
//     onSelectShoes?.(shoes || null);
//   };

//   // Occasion
//   const isDress = (item) =>
//     matchByKeywords(item, [
//       'dress','evening dress','cocktail dress','midi dress','maxi dress','wrap dress','sheath dress',
//       'שמלה','שמלת ערב','שמלת קוקטייל','שמלת מידי','שמלת מקסי','שמלה אלגנטית','שמלת מעטפת','שמלת עיפרון'
//     ]) && !isJeans(item);

//   const isOccasionBottom = (item) =>
//     matchByKeywords(item, [
//       'dress pants','tailored pants','suit pants','pleated pants','wide leg',
//       'מכנס מחויט','מכנס מחוייט','מכנס חליפה','מכנסי בד','מחוייטות',
//       'pencil skirt','a-line skirt','pleated skirt','midi skirt','maxi skirt',
//       'חצאית עיפרון','חצאית a-line','חצאית פליסה','חצאית מידי','חצאית מקסי','חצאית אלגנטית'
//     ]) && !isJeans(item);

//   const isOccasionTop = (item) =>
//     matchByKeywords(item, [
//       'silk','satin','chiffon','lace','organza','שיפון','תחרה','משי','סאטן','אורגנזה',
//       'blouse','dressy top','button-down','מכופתרת','חולצה אלגנטית','טופ אלגנטי'
//     ]);

//   const dresses = useMemo(() => clothingItems.filter(isDress), [clothingItems]);
//   const occasionBottoms = useMemo(() => clothingItems.filter(isOccasionBottom), [clothingItems]);
//   const occasionTops = useMemo(() => clothingItems.filter(isOccasionTop), [clothingItems]);

//   const handlePickOccasionPair = () => {
//     if (dresses.length) {
//       let bestDress = null, bestScore = -Infinity;
//       for (const d of dresses) {
//         const sc = scoreItemByStyle(d, style) + dressCodeBoost(d, style);
//         if (sc > bestScore) { bestScore = sc; bestDress = d; }
//       }
//       setMessage('');
//       onSelectShirt?.(bestDress);
//       onSelectPants?.(null);

//       // אביזרים (שמלה כעוגן לשניהם)
//       const hat   = pickBestAccessory(headwear, style, 'hat',   bestDress, 2);
//       const shoes = pickBestAccessory(footwear, style, 'shoes', bestDress, 4); // אירוע → רף גבוה יותר
//       onSelectHat?.(hat || null);
//       onSelectShoes?.(shoes || null);
//       return;
//     }
//     if (!occasionBottoms.length) return setMessage('לא נמצאו תחתונים מתאימים לשבת/חג/אירוע.');
//     if (!occasionTops.length)    return setMessage('לא נמצאו עליוניות חגיגיות לשבת/חג/אירוע.');
//     const pair = pickBestPair(occasionTops, occasionBottoms, style);
//     if (!pair) return setMessage('נמצאו פריטי אירוע אך בלי התאמה. הוסיפו תגיות צבע/סגנון.');
//     const [top, bottom] = pair;
//     setMessage('');
//     onSelectPants?.(bottom);
//     onSelectShirt?.(top);

//     // אביזרים (אופציונלי)
//     const hat   = pickBestAccessory(headwear, style, 'hat',   top,    2);
//     const shoes = pickBestAccessory(footwear, style, 'shoes', bottom, 4);
//     onSelectHat?.(hat || null);
//     onSelectShoes?.(shoes || null);
//   };

//   // Sport
//   const hasSportStyle = (item) =>
//     matchByKeywords(item, [
//       'sport','sports','athletic','athleisure','gym','workout','training','active',
//       'running','run','jogging','fitness','yoga','pilates','cycling','tennis','basketball','soccer','football','swim',
//       'dri-fit','dry fit','quick dry','breathable','mesh','stretch','polyester','spandex',
//       'ספורט','אימון','חדר כושר','ריצה','אתלטי','נושם','דריי פיט','דריפיט','בד נושם','אלסטי'
//     ]);

//   const isTopCategory = (item) =>
//     matchByKeywords(item, [
//       't-shirt','tee','top','tank','singlet','jersey','polo','hoodie','sweatshirt',
//       'sports bra','bra',
//       'חולצה','טישירט','טי-שירט','טופ','קפוצ׳ון','סווטשירט','חזיית ספורט'
//     ]);

//   const isBottomCategory = (item) =>
//     matchByKeywords(item, [
//       'leggings','tights','joggers','track pants','sweatpants','yoga pants',
//       'running shorts','athletic shorts','shorts','skort','compression',
//       'טייץ','ג׳וגרים','טרנינג','מכנס ריצה','שורט','שורטים','סקורט'
//     ]);

//   const isSportTop = (item) => hasSportStyle(item) && isTopCategory(item);
//   const isSportBottom = (item) => hasSportStyle(item) && isBottomCategory(item);

//   const sportTops = useMemo(() => clothingItems.filter(isSportTop), [clothingItems]);
//   const sportBottoms = useMemo(() => clothingItems.filter(isSportBottom), [clothingItems]);

//   const handlePickSportPair = () => {
//     if (!sportTops.length && !sportBottoms.length)
//       return setMessage('לא נמצאו פריטי ספורט בארון (צריך תגיות/סגנון ספורט + קטגוריה מתאימה).');
//     if (!sportTops.length)
//       return setMessage('לא נמצאו טופי ספורט. הוסיפו "sport", "gym", "running" או "דריי פיט".');
//     if (!sportBottoms.length)
//       return setMessage('לא נמצאו תחתוני ספורט. הוסיפו "running shorts", "leggings", "joggers".');

//     const pair = pickBestPair(sportTops, sportBottoms, style);
//     if (!pair) return setMessage('נמצאו פריטי ספורט אך בלי התאמה. הוסיפו תגיות צבע (black/navy/blue/תכלת וכו\').');

//     const [top, bottom] = pair;
//     onSelectPants?.(bottom);
//     onSelectShirt?.(top);

//     // אביזרים (אופציונלי)
//     const hat   = pickBestAccessory(headwear, style, 'hat',   top,    1); // מצחייה/כובע ריצה
//     const shoes = pickBestAccessory(footwear, style, 'shoes', bottom, 3); // סניקרס/ריצה
//     onSelectHat?.(hat || null);
//     onSelectShoes?.(shoes || null);

//     setMessage('סט ספורט מותאם להעדפות נבחר! 💪');
//   };

//   return (
//     <div className="d-flex gap-2 justify-content-center mb-4 flex-wrap rcp-toolbar" dir="rtl">
//       <button className="matching-btn sport-btn" onClick={handlePickSportPair}>
//         לבוש ספורט
//       </button>
//       <button className="matching-btn event-btn" onClick={handlePickOccasionPair}>
//         לשבת/חג/אירוע
//       </button>
//       <button className="matching-btn elegant-btn" onClick={handlePickElegantPair}>
//         לבוש אלגנטי
//       </button>
//       <button className="matching-btn casual-btn" onClick={handlePickMatchingPair}>
//         לבוש יום יומי
//       </button>

//       {message && <div className="w-100 text-center rcp-message mt-2">{message}</div>}
//     </div>
//   );
// }
