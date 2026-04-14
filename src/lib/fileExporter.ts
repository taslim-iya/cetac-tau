import * as XLSX from 'xlsx';

// Export data to CSV
export function exportCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'createdAt');
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = Array.isArray(row[h]) ? row[h].join('; ') : String(row[h] || '');
      return val.includes(',') ? `"${val}"` : val;
    }).join(','))
  ].join('\n');
  download(csv, `${filename}.csv`, 'text/csv');
}

// Export to Excel
export function exportExcel(data: Record<string, any>[], filename: string, sheetName = 'Data') {
  if (data.length === 0) return;
  const clean = data.map(row => {
    const r: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      if (k !== 'id' && k !== 'createdAt') {
        r[k] = Array.isArray(v) ? v.join('; ') : v;
      }
    });
    return r;
  });
  const ws = XLSX.utils.json_to_sheet(clean);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export to JSON
export function exportJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  download(json, `${filename}.json`, 'application/json');
}

// Export all CETAC data to multi-sheet Excel
export function exportAllExcel(stores: Record<string, any[]>, filename: string) {
  const wb = XLSX.utils.book_new();
  Object.entries(stores).forEach(([name, data]) => {
    if (data.length === 0) return;
    const clean = data.map(row => {
      const r: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        if (k !== 'id' && k !== 'createdAt') {
          r[k] = Array.isArray(v) ? v.join('; ') : v;
        }
      });
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(clean);
    XLSX.utils.book_append_sheet(wb, ws, name.charAt(0).toUpperCase() + name.slice(1));
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Generate printable HTML report
export function exportHTMLReport(stores: Record<string, any[]>, title: string): string {
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
body { font-family: Inter, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; color: #171717; }
h1 { font-size: 24px; border-bottom: 2px solid #5E6AD2; padding-bottom: 8px; }
h2 { font-size: 16px; color: #5E6AD2; margin-top: 32px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; font-size: 12px; }
th { background: #f3f4f6; padding: 8px 10px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600; }
td { padding: 6px 10px; border: 1px solid #e5e7eb; }
.meta { color: #666; font-size: 12px; }
</style></head><body>
<h1>${title}</h1>
<p class="meta">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>`;

  Object.entries(stores).forEach(([name, data]) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).filter(k => k !== 'id' && k !== 'createdAt');
    html += `<h2>${name.charAt(0).toUpperCase() + name.slice(1)} (${data.length})</h2><table><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    data.forEach(row => {
      html += `<tr>${headers.map(h => {
        const val = Array.isArray(row[h]) ? row[h].join(', ') : String(row[h] || '');
        return `<td>${val}</td>`;
      }).join('')}</tr>`;
    });
    html += '</table>';
  });

  html += '</body></html>';
  return html;
}

export function exportPDF(stores: Record<string, any[]>, title: string) {
  const html = exportHTMLReport(stores, title);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (w) {
    w.onload = () => { setTimeout(() => w.print(), 500); };
  }
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
