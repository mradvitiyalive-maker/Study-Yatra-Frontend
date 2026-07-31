// Derives a display session label (e.g. "June", "July") for a question.
// Falls back through, in order:
//   1. An explicit q.session value, if set.
//   2. The month name parsed from q.examDate, if that's a valid date.
//   3. "January" for JEE (last-resort default), or the exam type itself
//      for NEET/CBSE — matches the previous hardcoded behavior so nothing
//      regresses for questions with neither session nor examDate set.
//
// This exists because CSV-imported questions capture exam_date but not a
// separate session column, so relying on session alone silently collapsed
// every JEE question (January, June, July shifts alike) into "January".

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function parseExamDateToMonth(raw: string): string {
  if (!raw || !raw.trim()) return '';

  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) {
    return MONTH_NAMES[direct.getMonth()];
  }

  // Fall back to DD-MM-YYYY or DD/MM/YYYY
  const match = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const [, , month] = match;
    const idx = Number(month) - 1;
    if (idx >= 0 && idx < 12) return MONTH_NAMES[idx];
  }

  return '';
}

export function deriveSessionLabel(q: { session?: string; examType?: string; examDate?: string }): string {
  if (q.session && q.session !== 'All') return q.session;

  if (q.examType === 'JEE') {
    const monthFromDate = parseExamDateToMonth(q.examDate || '');
    if (monthFromDate) return monthFromDate;
    return 'January';
  }

  return q.examType || '';
}
