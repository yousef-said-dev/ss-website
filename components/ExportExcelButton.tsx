"use client";

import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";

interface ExportExcelButtonProps<T> {
  data: T[];
  fileName: string;
  getLevel: (row: T) => string;
  mapRow: (row: T) => any;
  buttonText?: string;
  className?: string;
}

export default function ExportExcelButton<T>({ 
  data, 
  fileName, 
  getLevel, 
  mapRow,
  buttonText = "تصدير إلى Excel",
  className = "btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
}: ExportExcelButtonProps<T>) {
  
  const handleExport = () => {
    exportToExcel(data, fileName, getLevel, mapRow);
  };

  return (
    <button onClick={handleExport} className={className}>
      <Download className="w-4 h-4" />
      <span>{buttonText}</span>
    </button>
  );
}
