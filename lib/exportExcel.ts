import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file, creating a separate sheet for each level (year).
 * @param data Array of data objects
 * @param fileName Name of the resulting Excel file (without .xlsx)
 * @param getLevel Function to extract the 'level' from a data row
 * @param mapRow Function to map a data row to the desired Excel columns
 */
export function exportToExcel<T>(
  data: T[],
  fileName: string,
  getLevel: (row: T) => string,
  mapRow: (row: T) => any
) {
  const wb = XLSX.utils.book_new();
  
  // Group data by level
  const grouped: Record<string, any[]> = {};
  
  data.forEach((row) => {
    const level = getLevel(row) || "غير محدد";
    if (!grouped[level]) {
      grouped[level] = [];
    }
    grouped[level].push(mapRow(row));
  });

  // If there's no data, create an empty sheet
  if (Object.keys(grouped).length === 0) {
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "لا توجد بيانات");
  } else {
    // Create a sheet for each level
    Object.keys(grouped).forEach((level) => {
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(grouped[level]);
      
      // Set right-to-left if desired (Excel feature, sometimes works in sheetjs)
      if(!ws['!dir']) ws['!dir'] = 'rtl';

      // Ensure sheet name is valid (max 31 chars, no forbidden chars like : \ / ? * [ ])
      const safeSheetName = level.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
      
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });
  }

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
