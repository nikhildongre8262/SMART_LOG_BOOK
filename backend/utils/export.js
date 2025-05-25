const ExcelJS = require('exceljs');

// Export to Excel with proper formatting
async function exportToExcel(data, res, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance');

  // Add headers
  const headers = Object.keys(data[0]);
  worksheet.addRow(headers);

  // Add data
  data.forEach(record => {
    worksheet.addRow(Object.values(record));
  });

  // Set column widths based on content
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = cell.value ? cell.value.toString().length : 0;
      maxLength = Math.max(maxLength, cellLength);
    });
    // Add some padding to the width
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

  // Write to response
  await workbook.xlsx.write(res);
  res.end();
}

// Simple CSV export utility (keeping for backward compatibility)
function exportToCSV(data) {
  if (!data || !data.length) return '';
  const keys = Object.keys(data[0]._doc || data[0]);
  const rows = data.map(item => {
    const obj = item._doc || item;
    return keys.map(key => '"' + (obj[key] !== undefined ? obj[key] : '') + '"').join(',');
  });
  return keys.join(',') + '\n' + rows.join('\n');
}

module.exports = { exportToCSV, exportToExcel };
