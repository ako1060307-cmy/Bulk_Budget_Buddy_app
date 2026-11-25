import { jsPDF } from 'jspdf';
import { formatINR, getTodayISO } from './analytics';

export function exportTransactionsCSV(transactions) {
  const headers = ['Date', 'Time', 'Item', 'Category', 'Amount (INR)', 'Calories (kcal)', 'Protein (g)'];
  const escapeCSV = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((t) => [
    t.date,
    t.time || '',
    t.item,
    t.category,
    t.amount,
    t.calories || 0,
    t.protein || 0,
  ]);

  const csvContent = '\uFEFF' + [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `bulk-budget-buddy-${getTodayISO()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPDFReport({ transactions, settings, metrics, forecast }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 40;

  // Format INR using "Rs." in PDF to avoid Unicode font glyph missing issues in standard Helvetica
  const pdfINR = (val) => {
    const num = Math.round(Number(val) || 0);
    const abs = Math.abs(num).toLocaleString('en-IN');
    return num < 0 ? `-Rs. ${abs}` : `Rs. ${abs}`;
  };

  // Dark Header Banner
  doc.setFillColor(9, 13, 22);
  doc.rect(0, 0, pageWidth, 108, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 105, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Bulk Budget Buddy', margin, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('Automated Personal Expense & Clean Bulk Nutrition Report', margin, 60);
  doc.setTextColor(16, 185, 129);
  doc.text(
    `${settings.studentName} | ${settings.department} | Roll No: ${settings.rollNo}`,
    margin,
    78
  );

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, 42, { align: 'right' });
  doc.text(`Cycle: ${metrics.monthStats.monthLabel}`, pageWidth - margin, 58, { align: 'right' });

  y = 132;

  // Executive Summary Section
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Monthly Financial & Clean Bulk Summary', margin, y);
  y += 14;

  const summaryRows = [
    ['Monthly Budget', pdfINR(settings.monthlyBudget), 'Daily Burn Rate', `${pdfINR(forecast.burnRate)} / day`],
    ['Total Spent (Month)', pdfINR(metrics.totalSpent), 'Projected Month-End', pdfINR(forecast.projectedEndOfMonth)],
    ['Remaining Balance', pdfINR(metrics.remainingBalance), 'Expected Surplus/Deficit', pdfINR(forecast.expectedSurplusOrDeficit)],
    ['Safe Daily Spend', `${pdfINR(metrics.safeDailySpend)} / day`, 'Avg Daily Nutrition', `${Math.round(forecast.avgDailyCalories)} kcal | ${Math.round(forecast.avgDailyProtein)}g P`],
  ];

  summaryRows.forEach((row, idx) => {
    const rowY = y + idx * 24;
    doc.setFillColor(idx % 2 === 0 ? 248 : 241, idx % 2 === 0 ? 250 : 245, idx % 2 === 0 ? 252 : 249);
    doc.rect(margin, rowY, pageWidth - margin * 2, 22, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], margin + 8, rowY + 14);
    doc.text(row[2], pageWidth / 2 + 8, rowY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], margin + 125, rowY + 14);
    doc.text(row[3], pageWidth / 2 + 135, rowY + 14);
  });

  y += summaryRows.length * 24 + 24;

  // Category Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Category Breakdown', margin, y);
  y += 14;

  metrics.categoryTotals.forEach((cat, idx) => {
    const rowY = y + idx * 20;
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, rowY, pageWidth - margin * 2, 18, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(cat.name, margin + 8, rowY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${pdfINR(cat.value)} (${cat.pct}%)`, pageWidth - margin - 8, rowY + 12, { align: 'right' });
  });

  y += metrics.categoryTotals.length * 20 + 24;

  // Top Protein Efficiency Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Top Clean Bulk Protein Efficiency Rankings', margin, y);
  y += 14;

  doc.setFillColor(17, 24, 39);
  doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('Rank & Food Item', margin + 8, y + 13);
  doc.text('Avg Cost', margin + 245, y + 13);
  doc.text('Protein / kcal', margin + 320, y + 13);
  doc.text('Rs / 10g Protein', pageWidth - margin - 8, y + 13, { align: 'right' });
  y += 20;

  forecast.efficiencyItems.slice(0, 8).forEach((item, idx) => {
    const rowY = y + idx * 19;
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, rowY, pageWidth - margin * 2, 18, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    const label = `#${idx + 1} ${item.item}`.slice(0, 40);
    doc.text(label, margin + 8, rowY + 12);
    doc.text(pdfINR(item.avgPrice), margin + 245, rowY + 12);
    doc.text(`${item.avgProtein}g P | ${item.avgCalories} kcal`, margin + 320, rowY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(`Rs. ${item.inrPer10gProtein}`, pageWidth - margin - 8, rowY + 12, { align: 'right' });
  });

  y += Math.min(forecast.efficiencyItems.length, 8) * 19 + 26;

  // Transaction Ledger
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 40) {
      doc.addPage();
      y = 44;
    }
  };

  ensureSpace(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`4. Transaction Log (Latest ${Math.min(transactions.length, 40)} Entries)`, margin, y);
  y += 14;

  const drawLedgerHeader = () => {
    doc.setFillColor(17, 24, 39);
    doc.rect(margin, y, pageWidth - margin * 2, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('Date', margin + 6, y + 13);
    doc.text('Item', margin + 68, y + 13);
    doc.text('Category', margin + 260, y + 13);
    doc.text('Macros', margin + 375, y + 13);
    doc.text('Amount', pageWidth - margin - 6, y + 13, { align: 'right' });
    y += 20;
  };

  drawLedgerHeader();

  transactions.slice(0, 40).forEach((t, idx) => {
    if (y + 20 > pageHeight - 36) {
      doc.addPage();
      y = 40;
      drawLedgerHeader();
    }
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(margin, y, pageWidth - margin * 2, 18, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(t.date, margin + 6, y + 12);
    doc.setTextColor(15, 23, 42);
    doc.text(t.item.slice(0, 34), margin + 68, y + 12);
    doc.setTextColor(71, 85, 105);
    doc.text(t.category.slice(0, 20), margin + 260, y + 12);
    doc.text(
      t.calories > 0 || t.protein > 0 ? `${t.calories} kcal / ${t.protein}g P` : '—',
      margin + 375,
      y + 12
    );
    doc.setFont('helvetica', 'bold');
    doc.text(pdfINR(t.amount), pageWidth - margin - 6, y + 12, { align: 'right' });
    y += 18;
  });

  doc.save(`bulk-budget-buddy-report-${getTodayISO()}.pdf`);
  return formatINR(metrics.totalSpent);
}
