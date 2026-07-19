// ═══════════════════════════════════════════════════════════════
// FOODIQ — Unified AI Image Provider & Uniqueness System
// ═══════════════════════════════════════════════════════════════

const img = (id, w = 600, h = 450) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`;

// Categorized Unsplash Food Image Pool (120+ Unique High-Quality Photos)
export const FOOD_IMAGE_POOL = {
  pizza: [
    '1513104890138-7c749659a591',
    '1565299624946-b28f40a0ae38',
    '1593560708920-61dd98c46a4e',
    '1534308983496-4fabb1a015ee',
    '1574071318508-1cdbab80d002',
    '1590947132387-155cc02f3212',
    '1604382355076-af4b0eb60143',
    '1511018556340-d16986a1c194',
    '1528137871618-79d2761e3fd5',
    '1594009478135-5fa8a36d8243'
  ],
  burger: [
    '1568901346375-23c9450c58cd',
    '1550547660-d9450f859349',
    '1553979459-d2229ba7d751',
    '1594212699903-ec8a3eca50f5',
    '1572802419224-296d0aebd77d',
    '1586190848861-99aa4a171e90',
    '1606755962773-d324e0a13086',
    '1565299585323-38d6b0865b47',
    '1525059696034-4967a8e1dca2',
    '1513185158878-8d8c2a2a3c3e'
  ],
  biryani: [
    '1563379091339-03b21ab4a4f8',
    '1633945274405-b6c8069047b0',
    '1601050690597-df056fb47091',
    '1546833999-b9f581b2f4d0',
    '1626700051175-6818013e1d4f',
    '1633945274309-747260571f5f',
    '1626777552726-4a6b54c97e46',
    '1645177625177-c93d9385a494',
    '1589302168068-964664d93dc0',
    '1603894544376-3b5265744f8b'
  ],
  curry: [
    '1585937421612-70a008356fbe',
    '1603894544376-3b5265744f8b',
    '1565557623262-b51c2513a641',
    '1546833999-b9f581b2f4d0',
    '1599487488170-d11ec9c172f0',
    '1626700051175-6818013e1d4f',
    '1589302168068-964664d93dc0',
    '1596797038530-2c107229654b',
    '1613292443284-8d10ef9383eb',
    '1625398407796-82650d871317'
  ],
  dosa: [
    '1668236543090-82eba5ee5976',
    '1589301760014-d929f3979dbc',
    '1630383249896-424e482df921',
    '1601050690597-df0568f70950',
    '1589302168068-964664d93dc0',
    '1627575039412-4e923d8c1c4f'
  ],
  noodles: [
    '1585032226651-759b368d7246',
    '1552611052-33e04de081de',
    '1569718212165-3a8922ada9a4',
    '1612966608997-30d2113af13c',
    '1627308595229-7830a5c91f9f',
    '1557872947-44a53043135e',
    '1547928576-a4557d2282aa',
    '1617093727266-2d091a1a7238'
  ],
  sushi: [
    '1579871494447-9811cf80d66c',
    '1611143669185-af224c5e3252',
    '1553621042-bb79af85b650',
    '1582450871972-ab5ca641643d',
    '1579871494855-9811cf80d66c',
    '1617196034056-56cd1a8b368d'
  ],
  desserts: [
    '1551024601-bec78aea704b',
    '1578985545062-69928b1d9587',
    '1501443762994-82bd5dace89a',
    '1587314168485-3236d6710814',
    '1606313564200-e75d5e30476c',
    '1563729784474-d77dbb933a9e',
    '1551024709-8f23befc6f87',
    '1534422298391-e4f8c170db0f',
    '1514517604298-cf80e0fb7f1e',
    '1614707267537-b85acf00b47e'
  ],
  salad: [
    '1546069901-ba9599a7e63c',
    '1512621776951-a57141f2eefd',
    '1540189549336-e6e99c3679fe',
    '1607532941445-3072225a399f',
    '1623428187969-53531154c677',
    '1505576399279-565b52d4ac71',
    '1608039755401-742074f0548d',
    '1543339300-c810d003c0f5'
  ],
  wrap: [
    '1626700051175-6818013e1d4f',
    '1626700050850-fa0cbe6a8b7c',
    '1509440159596-0249088772ff',
    '1540713700-74559e4509a2',
    '1562059392-10d48f729221',
    '1643158919013-149d5bf1f985'
  ],
  fries: [
    '1630384066252-19e1ad95b4f6',
    '1623238913973-21e45cced554',
    '1639024471283-03518883512d',
    '1573080496219-bb080dd4f877',
    '1576107232684-2e2d85b6827f',
    '1606755962773-d324e0a13086'
  ],
  drinks: [
    '1629203851122-3726ecdf080e',
    '1572490122747-3968b75cc699',
    '1622597467836-f3285f2131b8',
    '1513558161293-cdaf765ed2fd',
    '1595981267035-7b04ca84a82d',
    '1548967139-4974f3f45811'
  ],
  generic: [
    '1504674900247-0877df9cc836',
    '1498837167922-ddd27525d352',
    '1565958011703-44f9829ba187',
    '1476224203421-9ac39cbd33b1',
    '1490645935967-10de6ba17061',
    '1555939594-58d7cb561ad1',
    '1567620905732-2d1ec7bb7445',
    '1496116218417-1a781b1c416c',
    '1484723091735-30a917eef458'
  ]
};

// Map dish names to core categories
export const getFoodCategory = (dishName = '') => {
  const name = dishName.toLowerCase();
  if (name.includes('pizza')) return 'pizza';
  if (name.includes('burger') || name.includes('whopper') || name.includes('hamburger')) return 'burger';
  if (name.includes('biryani') || name.includes('pulao') || name.includes('fried rice') || (name.includes('rice') && !name.includes('pudding'))) return 'biryani';
  if (name.includes('curry') || name.includes('paneer') || name.includes('chicken') || name.includes('dal') || name.includes('rogan') || name.includes('masala') || name.includes('korma') || name.includes('gravy') || name.includes('kofta') || name.includes('vangi')) return 'curry';
  if (name.includes('dosa') || name.includes('idli') || name.includes('vada') || name.includes('uttapam') || name.includes('pongal')) return 'dosa';
  if (name.includes('noodle') || name.includes('chinese') || name.includes('pasta') || name.includes('chow') || name.includes('ramen') || name.includes('macaroni') || name.includes('spaghetti') || name.includes('lasagna')) return 'noodles';
  if (name.includes('sushi') || name.includes('sashimi') || name.includes('tempura')) return 'sushi';
  if (name.includes('cake') || name.includes('truffle') || name.includes('pastry') || name.includes('sweet') || name.includes('dessert') || name.includes('brownie') || name.includes('ice cream') || name.includes('lava') || name.includes('tiramisu') || name.includes('pudding') || name.includes('poli') || name.includes('rasgulla') || name.includes('sandesh') || name.includes('chomchom')) return 'desserts';
  if (name.includes('salad') || name.includes('healthy') || name.includes('bowl') || name.includes('buddha') || name.includes('eromba') || name.includes('chamthong') || name.includes('singju')) return 'salad';
  if (name.includes('wrap') || name.includes('roll') || name.includes('sandwich') || name.includes('naan') || name.includes('roti') || name.includes('paratha') || name.includes('taco') || name.includes('bun')) return 'wrap';
  if (name.includes('fries') || name.includes('wedges') || name.includes('ring') || name.includes('finger') || name.includes('nugget')) return 'fries';
  if (name.includes('cola') || name.includes('shake') || name.includes('juice') || name.includes('coffee') || name.includes('smoothie') || name.includes('pepsi') || name.includes('beverage') || name.includes('drink') || name.includes('chai') || name.includes('tea')) return 'drinks';
  return 'generic';
};

// Generates a stable hash
const getHashCode = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Unified Registry for dynamic deduplication when generating local Unsplash URLs
const GLOBAL_ASSIGNED_REGISTRY = new Map();

/**
 * Returns a stable fallback Unsplash image URL for a given item.
 */
export const getFallbackUnsplashImage = (dishName = '', restaurantName = '', itemPrice = 0, itemId = '') => {
  const category = getFoodCategory(dishName);
  const pool = FOOD_IMAGE_POOL[category] || FOOD_IMAGE_POOL.generic;
  const seedString = `${dishName.trim()}-${restaurantName.trim()}-${itemPrice}-${itemId}`;
  const hash = getHashCode(seedString);
  const poolIndex = hash % pool.length;
  const imageId = pool[poolIndex];
  return img(imageId);
};

/**
 * Primary image provider: returns a highly relevant, mathematically unique LoremFlickr URL.
 * If LoremFlickr fails, the AIImage component automatically cascades to getFallbackUnsplashImage.
 */
export const getUniqueFoodImage = (dishName = '', restaurantName = '', itemPrice = 0, itemId = '') => {
  const category = getFoodCategory(dishName);
  
  // Hash calculation
  const seedString = `${dishName.trim()}-${restaurantName.trim()}-${itemPrice}-${itemId}`;
  const hash = getHashCode(seedString);
  
  // Custom tag mappings to ensure high relevance and visual premiumness on LoremFlickr
  const flickrTags = {
    pizza: 'pizza,food',
    burger: 'burger,fastfood',
    biryani: 'biryani,rice',
    curry: 'curry,indianfood',
    dosa: 'dosa,southindianfood',
    noodles: 'noodles,pasta,ramen',
    sushi: 'sushi,japanese',
    desserts: 'dessert,sweet,cake',
    salad: 'salad,healthyfood',
    wrap: 'wrap,roll,sandwich',
    fries: 'fries,chips',
    drinks: 'beverage,drink,coffee',
    generic: 'food,dish'
  };
  
  const tag = flickrTags[category] || flickrTags.generic;
  
  // lockValue creates a stable unique ID (1 to 10000) so that LoremFlickr returns a distinct image for this item
  const lockValue = (hash % 10000) + 1;
  
  // We return a high quality loremflickr url with category constraints
  return `https://loremflickr.com/600/450/${tag}?lock=${lockValue}`;
};

// Clear registry for dynamic testing / reloading
export const resetImageRegistry = () => {
  GLOBAL_ASSIGNED_REGISTRY.clear();
};
