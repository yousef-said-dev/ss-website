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
  
  // Group data by level and class for summary
  const grouped: Record<string, Record<string, any[]>> = {};
  
  data.forEach((row) => {
    const level = getLevel(row) || "غير محدد";
    // For summary we need the original class, so we assume mapRow returns it or we extract it
    // But mapRow is for the sheet columns. Let's use the row directly for grouping.
    const mapped = mapRow(row);
    const cls = (row as any).class || (row as any).students?.class || "غير محدد";

    if (!grouped[level]) grouped[level] = {};
    if (!grouped[level][cls]) grouped[level][cls] = [];
    
    grouped[level][cls].push(mapped);
  });

  // 1. Create Summary Sheet
  const summaryData: any[] = [];
  Object.keys(grouped).forEach(level => {
    const levelStudents = Object.values(grouped[level]).flat();
    summaryData.push({
      "المرحلة": level,
      "الفصل": "--- إجمالي المرحلة ---",
      "العدد": levelStudents.length
    });

    Object.keys(grouped[level]).forEach(cls => {
      summaryData.push({
        "المرحلة": level,
        "الفصل": cls,
        "العدد": grouped[level][cls].length
      });
    });
  });

  if (summaryData.length > 0) {
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    if(!wsSummary['!dir']) wsSummary['!dir'] = 'rtl';
    XLSX.utils.book_append_sheet(wb, wsSummary, "ملخص عام");
  }

  // 2. Create individual sheets for each level
  if (Object.keys(grouped).length === 0) {
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "لا توجد بيانات");
  } else {
    Object.keys(grouped).forEach((level) => {
      const levelData = Object.values(grouped[level]).flat();
      const ws = XLSX.utils.json_to_sheet(levelData);
      if(!ws['!dir']) ws['!dir'] = 'rtl';
      const safeSheetName = level.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
    });
  }

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

