import { hasXSSPattern, sanitizeText } from './validation.js';

const FOOD_MACROS_DB = [
  { keywords: ['paneer'], calories: 530, protein: 36, category: 'Clean Bulk Groceries' },
  { keywords: ['toned milk', 'milk'], calories: 600, protein: 30, category: 'Clean Bulk Groceries' },
  { keywords: ['sattu'], calories: 410, protein: 20, category: 'Clean Bulk Groceries' },
  { keywords: ['peanut butter', 'pb'], calories: 480, protein: 16, category: 'Clean Bulk Groceries' },
  { keywords: ['egg', 'eggs', 'omelette'], calories: 310, protein: 25, category: 'Clean Bulk Groceries' },
  { keywords: ['banana', 'bananas', 'dates'], calories: 560, protein: 6, category: 'Clean Bulk Groceries' },
  { keywords: ['pumpkin seed', 'pumpkin seeds', 'seeds'], calories: 170, protein: 9, category: 'Clean Bulk Groceries' },
  { keywords: ['chicken'], calories: 420, protein: 54, category: 'Clean Bulk Groceries' },
  { keywords: ['soya', 'soy'], calories: 520, protein: 42, category: 'Clean Bulk Groceries' },
  { keywords: ['oats'], calories: 380, protein: 13, category: 'Clean Bulk Groceries' },
  { keywords: ['curd', 'dahi', 'yogurt'], calories: 260, protein: 14, category: 'Clean Bulk Groceries' },
  { keywords: ['whey', 'protein shake', 'scoop'], calories: 130, protein: 24, category: 'Clean Bulk Groceries' },
  { keywords: ['almonds', 'badam', 'nuts'], calories: 290, protein: 10, category: 'Clean Bulk Groceries' },
  { keywords: ['sprouts', 'chana', 'moong'], calories: 280, protein: 18, category: 'Clean Bulk Groceries' },
  { keywords: ['bread', 'roti', 'chapati'], calories: 320, protein: 10, category: 'Clean Bulk Groceries' },
  { keywords: ['rice', 'chawal'], calories: 350, protein: 7, category: 'Clean Bulk Groceries' },
  { keywords: ['thali', 'mess', 'lunch', 'dinner', 'breakfast'], calories: 760, protein: 24, category: 'Mess/Dining' },
  { keywords: ['canteen', 'biryani', 'rajma', 'chole', 'dosa', 'idli', 'poha', 'roll', 'paratha', 'maggi', 'tea', 'chai', 'coffee'], calories: 540, protein: 16, category: 'Mess/Dining' },
];

const CATEGORY_KEYWORDS = [
  {
    category: 'Transport',
    keywords: ['auto', 'rickshaw', 'metro', 'bus', 'cab', 'uber', 'ola', 'rapido', 'train', 'ticket', 'fuel', 'petrol', 'shuttle', 'fare'],
  },
  {
    category: 'Academic & Misc',
    keywords: [
      'book', 'notebook', 'pen', 'pencil', 'print', 'printout', 'xerox', 'photocopy',
      'lab', 'manual', 'file', 'sheet', 'stationary', 'stationery', 'assignment',
      'exam', 'fee', 'recharge', 'wifi', 'laundry', 'soap', 'shampoo', 'haircut', 'misc',
    ],
  },
  {
    category: 'Mess/Dining',
    keywords: [
      'mess', 'canteen', 'thali', 'lunch', 'dinner', 'breakfast', 'biryani',
      'cafe', 'restaurant', 'dhaba', 'dosa', 'idli', 'poha', 'samosa', 'chai', 'coffee', 'roll', 'paratha',
    ],
  },
  {
    category: 'Clean Bulk Groceries',
    keywords: [
      'paneer', 'milk', 'sattu', 'egg', 'eggs', 'peanut', 'butter', 'banana',
      'dates', 'pumpkin', 'seeds', 'oats', 'chicken', 'soya', 'curd', 'dahi',
      'whey', 'protein', 'almonds', 'chana', 'sprouts', 'bread', 'rice', 'dal', 'fruit',
    ],
  },
];

/**
 * Parses natural text like:
 * - "Paneer 200g 90" -> item: "Paneer 200g", amount: 90, category: "Clean Bulk Groceries", calories: 530, protein: 36
 * - "Auto 40" -> item: "Auto", amount: 40, category: "Transport", calories: 0, protein: 0
 * - "₹56 Toned Milk 1L" -> item: "Toned Milk 1L", amount: 56, ...
 * Rejects/flags XSS patterns and negative/zero prices.
 */
export function parseQuickInput(rawInput) {
  const input = typeof rawInput === 'string' ? rawInput.trim() : '';
  if (!input) {
    return null;
  }

  const unsafe = hasXSSPattern(input);
  let amount = 0;
  let working = sanitizeText(input);

  // Detect explicit negative numbers like "-50"
  const negativeMatch = working.match(/(?:^|\s)(-\d+(?:\.\d+)?)(?:\s|$)/);
  if (negativeMatch) {
    return {
      item: sanitizeText(working.replace(negativeMatch[0], ' ').trim()) || 'Invalid Entry',
      amount: Math.round(parseFloat(negativeMatch[1])),
      category: 'Academic & Misc',
      calories: 0,
      protein: 0,
      error: 'Price must be greater than ₹0.',
      unsafe,
    };
  }

  // 1. Check explicit currency prefix/suffix like ₹90, rs 90, rs.90, 90rs, 90/-
  const currencyMatches = [
    ...working.matchAll(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/gi),
    ...working.matchAll(/(\d+(?:\.\d+)?)\s*(?:₹|rs\.?|inr|\/-)/gi),
  ];

  if (currencyMatches.length > 0) {
    const lastMatch = currencyMatches[currencyMatches.length - 1];
    amount = Math.round(parseFloat(lastMatch[1]));
    working = (working.slice(0, lastMatch.index) + ' ' + working.slice(lastMatch.index + lastMatch[0].length)).trim();
  } else {
    // 2. Pick the last standalone number NOT attached to a unit (like 200g, 1L, 500ml)
    const tokens = working.split(/\s+/);
    let priceTokenIdx = -1;

    for (let i = tokens.length - 1; i >= 0; i -= 1) {
      const cleaned = tokens[i].replace(/[,]/g, '');
      if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
        if (i === 0 && tokens.length > 1 && /^(egg|eggs|banana|bananas|bread|roti|rotis|slice|slices)$/i.test(tokens[1])) {
          continue;
        }
        priceTokenIdx = i;
        amount = Math.round(parseFloat(cleaned));
        break;
      }
    }

    if (priceTokenIdx !== -1) {
      tokens.splice(priceTokenIdx, 1);
      working = tokens.join(' ').trim();
    }
  }

  const item = working.replace(/\s+/g, ' ').replace(/^[-–—]+|[-–—]+$/g, '').trim() || sanitizeText(input);
  const lower = working.toLowerCase();

  let category = 'Academic & Misc';
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      category = rule.category;
      break;
    }
  }

  let calories = 0;
  let protein = 0;
  for (const food of FOOD_MACROS_DB) {
    if (food.keywords.some((kw) => lower.includes(kw))) {
      calories = food.calories;
      protein = food.protein;
      if (category === 'Academic & Misc') {
        category = food.category;
      }
      break;
    }
  }

  let error = null;
  if (unsafe) {
    error = 'Unsafe HTML/script syntax is not allowed.';
  } else if (!Number.isFinite(amount) || amount <= 0) {
    error = 'Include a valid positive price in ₹ (e.g. "Paneer 200g 90").';
  }

  return {
    item,
    amount: amount > 0 ? amount : 0,
    category,
    calories,
    protein,
    error,
    unsafe,
  };
}
