import { CATEGORIES } from '../data/presets.js';

const XSS_PATTERNS = [
  /<\s*\/?\s*script\b/i,
  /<\s*\/?\s*(?:iframe|object|embed|svg|img|style|link|meta)\b/i,
  /\bon(?:error|load|click|mouseover|focus|blur|submit)\s*=/i,
  /javascript\s*:/i,
  /data\s*:\s*text\/html/i,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function hasXSSPattern(value) {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some((regex) => regex.test(value));
}

export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon\w+\s*=/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function validateRegisterInput(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Registration payload is required.'], sanitized: null };
  }

  const rawName = typeof payload.name === 'string' ? payload.name : '';
  if (hasXSSPattern(rawName)) {
    errors.push('Full name contains unsafe HTML or script syntax.');
  }
  const cleanName = sanitizeText(rawName);
  if (!cleanName || cleanName.length < 2) {
    errors.push('Full name must be at least 2 characters.');
  } else if (cleanName.length > 80) {
    errors.push('Full name must be 80 characters or fewer.');
  }

  const rawEmail = typeof payload.email === 'string' ? payload.email : '';
  if (hasXSSPattern(rawEmail)) {
    errors.push('Email contains unsafe characters.');
  }
  const cleanEmail = normalizeEmail(rawEmail);
  if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.push('Please enter a valid email address.');
  }

  const password = typeof payload.password === 'string' ? payload.password : '';
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  } else if (password.length > 128) {
    errors.push('Password must be 128 characters or fewer.');
  }

  const monthlyBudget =
    payload.monthlyBudget === undefined || payload.monthlyBudget === ''
      ? 8000
      : Number(payload.monthlyBudget);
  const calorieGoal =
    payload.calorieGoal === undefined || payload.calorieGoal === ''
      ? 3300
      : Number(payload.calorieGoal);
  const proteinGoal =
    payload.proteinGoal === undefined || payload.proteinGoal === ''
      ? 140
      : Number(payload.proteinGoal);

  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 100) {
    errors.push('Monthly budget must be at least ₹100.');
  }
  if (!Number.isFinite(calorieGoal) || calorieGoal < 500) {
    errors.push('Daily calorie target must be at least 500 kcal.');
  }
  if (!Number.isFinite(proteinGoal) || proteinGoal < 10) {
    errors.push('Daily protein target must be at least 10g.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      name: cleanName,
      email: cleanEmail,
      password,
      monthlyBudget: Math.round(monthlyBudget),
      calorieGoal: Math.round(calorieGoal),
      proteinGoal: Math.round(proteinGoal),
    },
  };
}

export function validateLoginInput(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Login credentials are required.'], sanitized: null };
  }

  const rawEmail = typeof payload.email === 'string' ? payload.email : '';
  if (hasXSSPattern(rawEmail)) {
    errors.push('Email contains unsafe characters.');
  }
  const cleanEmail = normalizeEmail(rawEmail);
  if (!EMAIL_REGEX.test(cleanEmail)) {
    errors.push('Please enter a valid email address.');
  }

  const password = typeof payload.password === 'string' ? payload.password : '';
  if (!password) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      email: cleanEmail,
      password,
    },
  };
}

export function validateEntryInput(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') {
    return { valid: false, errors: ['Entry payload is required.'], sanitized: null };
  }

  const rawItem = typeof entry.item === 'string' ? entry.item : '';
  if (hasXSSPattern(rawItem)) {
    errors.push('Item name contains unsafe HTML or script syntax.');
  }

  const cleanItem = sanitizeText(rawItem);
  if (!cleanItem) {
    errors.push('Item name cannot be empty.');
  } else if (cleanItem.length > 120) {
    errors.push('Item name must be 120 characters or fewer.');
  }

  const amountNum = Number(entry.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    errors.push('Amount must be a positive number greater than ₹0.');
  } else if (amountNum > 1000000) {
    errors.push('Amount exceeds realistic single-entry maximum.');
  }

  const caloriesNum = entry.calories === undefined || entry.calories === '' ? 0 : Number(entry.calories);
  if (!Number.isFinite(caloriesNum) || caloriesNum < 0) {
    errors.push('Calories cannot be negative.');
  }

  const proteinNum = entry.protein === undefined || entry.protein === '' ? 0 : Number(entry.protein);
  if (!Number.isFinite(proteinNum) || proteinNum < 0) {
    errors.push('Protein cannot be negative.');
  }

  const category = CATEGORIES.includes(entry.category) ? entry.category : null;
  if (!category) {
    errors.push('Invalid expense category selected.');
  }

  const dateStr = typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    ? entry.date
    : null;
  if (entry.date !== undefined && !dateStr) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      item: cleanItem,
      amount: Math.round(amountNum),
      category,
      calories: Math.round(caloriesNum),
      protein: Math.round(proteinNum),
      ...(dateStr ? { date: dateStr } : {}),
    },
  };
}

export function validateSettingsInput(settings) {
  const errors = [];
  if (!settings || typeof settings !== 'object') {
    return { valid: false, errors: ['Settings payload is required.'], sanitized: null };
  }

  const monthlyBudget = Number(settings.monthlyBudget);
  const calorieGoal = Number(settings.calorieGoal);
  const proteinGoal = Number(settings.proteinGoal);

  if (!Number.isFinite(monthlyBudget) || monthlyBudget < 100) {
    errors.push('Monthly budget must be at least ₹100.');
  }
  if (!Number.isFinite(calorieGoal) || calorieGoal < 500) {
    errors.push('Daily calorie goal must be at least 500 kcal.');
  }
  if (!Number.isFinite(proteinGoal) || proteinGoal < 10) {
    errors.push('Daily protein goal must be at least 10g.');
  }

  const studentName = settings.studentName ? sanitizeText(String(settings.studentName)) : 'Ayush Kumar Ojha';
  const department = settings.department ? sanitizeText(String(settings.department)) : 'CSD First Year';
  const rollNo = settings.rollNo ? sanitizeText(String(settings.rollNo)) : 'BTCD26O1039';

  if (
    hasXSSPattern(String(settings.studentName || '')) ||
    hasXSSPattern(String(settings.department || '')) ||
    hasXSSPattern(String(settings.rollNo || ''))
  ) {
    errors.push('Profile fields contain unsafe HTML or script syntax.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      monthlyBudget: Math.round(monthlyBudget),
      calorieGoal: Math.round(calorieGoal),
      proteinGoal: Math.round(proteinGoal),
      studentName,
      department,
      rollNo,
    },
  };
}
