import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord } from '../types';
import { MONTH_LIST, PERIODS, exportToCSV } from '../utils';
import { Check, ClipboardList, AlertCircle, Save, CheckCircle, Info, Download } from 'lucide-react';
import { LineChart, Line, Tooltip } from 'recharts';

interface AttendanceTabProps {
  students: Student[];
  attendance: { [studentId: string]: { [month: string]: AttendanceRecord } };
  onSaveAttendance: (studentId: string, month: string, record: AttendanceRecord) => void;
}

export default function AttendanceTab({ students, attendance, onSaveAttendance }: AttendanceTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('nov');
  const [localAttendance, setLocalAttendance] = useState<{ [studentId: string]: { excused: number; unexcused: number; late: number } }>({});
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Load attendance when selectedMonth or students changes
  useEffect(() => {
    const loaded: { [studentId: string]: { excused: number; unexcused: number; late: number } } = {};
    students.forEach((student) => {
      const saved = attendance[student.id]?.[selectedMonth];
      loaded[student.id] = saved
        ? { excused: saved.excused, unexcused: saved.unexcused, late: saved.late }
        : { excused: 0, unexcused: 0, late: 0 };
    });
    setLocalAttendance(loaded);
    setIsSavedIndicator(false);
  }, [selectedMonth, students, attendance]);

  // Handle cell number change
  const handleCountChange = (studentId: string, field: 'excused' | 'unexcused' | 'late', value: string) => {
    let num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      num = 0;
    }

    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: num
      }
    }));
    setIsSavedIndicator(false);
  };

  // Quick increment/decrement helper
  const adjustCount = (studentId: string, field: 'excused' | 'unexcused' | 'late', amount: number) => {
    const current = localAttendance[studentId]?.[field] || 0;
    const newVal = Math.max(0, current + amount);
    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: newVal
      }
    }));
    setIsSavedIndicator(false);
  };

  // Perform save operation
  const handleSaveAll = () => {
    Object.entries(localAttendance).forEach(([studentId, recordValue]) => {
      const record = recordValue as { excused: number; unexcused: number; late: number };
      onSaveAttendance(studentId, selectedMonth, {
        studentId,
        month: selectedMonth,
        excused: record.excused,
        unexcused: record.unexcused,
        late: record.late
      });
    });
    setIsSavedIndicator(true);
    setTimeout(() => {
      setIsSavedIndicator(false);
    }, 4000);
  };

  // Helper for matching month abbreviation with label Khmer
  const getMonthLabel = (m: string) => {
    return PERIODS.find((p) => p.value === m)?.labelKh || m;
  };

  // Get consistent 6-month sequence ending with current month
  const getTrendMonths = (currentMonthKey: string): string[] => {
    const currentIdx = MONTH_LIST.indexOf(currentMonthKey);
    if (currentIdx === -1) return MONTH_LIST.slice(-6);
    
    if (currentIdx < 5) {
      return MONTH_LIST.slice(0, 6);
    } else {
      return MONTH_LIST.slice(currentIdx - 5, currentIdx + 1);
    }
  };

  // Helper to construct trend data for Recharts sparkline
  const getTrendDataForStudent = (studentId: string) => {
    const trendMonths = getTrendMonths(selectedMonth);
    return trendMonths.map((m) => {
      let rec;
      if (m === selectedMonth) {
        rec = localAttendance[studentId] || { excused: 0, unexcused: 0, late: 0 };
      } else {
        rec = attendance[studentId]?.[m] || { excused: 0, unexcused: 0, late: 0 };
      }
      return {
        monthKey: m,
        monthLabel: getMonthLabel(m),
        excused: rec.excused || 0,
        unexcused: rec.unexcused || 0,
        late: rec.late || 0
      };
    });
  };

  const handleExportAttendanceCSV = () => {
    const monthLabel = PERIODS.find((p) => p.value === selectedMonth)?.labelKh || selectedMonth;
    const headers = [
      'ល.រ (No)',
      'អត្តសញ្ញាណ (ID)',
      'ឈ្មោះខ្មែរ (Khmer Name)',
      'ឈ្មោះឡាតាំង (Latin Name)',
      'ភេទ (Gender)',
      'ច្បាប់ (Excused)',
      'ឥតច្បាប់ (Unexcused)',
      'យឺត (Late)'
    ];

    const rows = students.map((student, index) => {
      const att = localAttendance[student.id] || { excused: 0, unexcused: 0, late: 0 };
      return [
        index + 1,
        student.id,
        student.nameKh,
        student.nameEn,
        student.gender,
        att.excused,
        att.unexcused,
        att.late
      ];
    });

    exportToCSV(`របាយការណ៍វត្តមាន_ខែ_${monthLabel}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Selector and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">ជ្រើសរើសខែដើម្បីកត់ត្រាវត្តមាន (Pick Month)</label>
          <div className="flex flex-wrap gap-2">
            {MONTH_LIST.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-700'
                }`}
              >
                ខែ {getMonthLabel(m)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleExportAttendanceCSV}
            className="px-4 py-2.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="នាំចេញវត្តមានសិស្សសម្រាប់ខែនេះជាឯកសារ Excel"
          >
            <Download className="w-4 h-4" />
            នាំចេញជា Excel/CSV
          </button>

          <button
            onClick={handleSaveAll}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isSavedIndicator
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
            }`}
          >
          {isSavedIndicator ? (
            <>
              <CheckCircle className="w-4 h-4" />
              កត់ត្រាវត្តមានរួចរាល់!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              រក្សាទុកវត្តមាន (Save Attendance)
            </>
          )}
        </button>
      </div>
    </div>

      {/* Grid Sheet */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Helper title */}
        <div className="px-6 py-4 bg-indigo-50/40 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">
              តារាងវត្តមានប្រចាំ៖{' '}
              <span className="text-indigo-700 font-extrabold underline decoration-wavy">
                ខែ {getMonthLabel(selectedMonth)}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-gray-100 rounded-lg px-2.5 py-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>កត់ត្រាស្រង់ចំនួនថ្ងៃអវត្តមាន និងយឺតសរុបប្រចាំខែ</span>
          </div>
        </div>

        {/* Form spreadsheet table */}
        <div className="overflow-x-auto">
          {students.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p>មិនទាន់មានសិស្សចុះឈ្មោះក្នុងប្រព័ន្ធឡើយ។</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 w-16 text-center">ល.រ</th>
                  <th className="px-6 py-4 w-32">អត្តសញ្ញាណ</th>
                  <th className="px-6 py-4">ឈ្មោះសិស្ស</th>
                  <th className="px-6 py-4 w-20 text-center">ភេទ</th>
                  <th className="px-6 py-4 text-center bg-green-50/10 min-w-[200px]">មានច្បាប់ (Excused Absence - P)</th>
                  <th className="px-6 py-4 text-center bg-rose-50/10 min-w-[200px]">អត់ច្បាប់ (Unexcused Absence - A)</th>
                  <th className="px-6 py-4 text-center bg-amber-50/10 min-w-[200px]">យឺត (Late Arrival - L)</th>
                  <th className="px-6 py-4 text-center bg-indigo-50/10 min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>ទំនោរវត្តមាន ៦ខែ (6-Month Trend)</span>
                      <div className="flex items-center gap-2 text-[9px] font-normal tracking-tight normal-case">
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>អត់ច្បាប់</span>
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>មានច្បាប់</span>
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>យឺត</span>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((student, idx) => {
                  const record = localAttendance[student.id] || { excused: 0, unexcused: 0, late: 0 };

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-4 py-3 text-center font-mono font-bold text-xs text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs font-medium text-gray-400">
                        {student.id}
                      </td>
                      <td className="px-6 py-3 font-bold text-gray-800 whitespace-nowrap">
                        {student.nameKh}
                        <span className="block font-mono text-[10px] text-gray-400 uppercase font-normal">{student.nameEn}</span>
                      </td>
                      <td className="px-6 py-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          student.gender === 'ស្រី'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {student.gender}
                        </span>
                      </td>

                      {/* EXCUSED DAYS */}
                      <td className="px-6 py-3 bg-green-50/5 text-center">
                        <div className="flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'excused', -1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={record.excused}
                            onChange={(e) => handleCountChange(student.id, 'excused', e.target.value)}
                            className="w-16 text-center font-mono font-bold border border-gray-200 py-1 rounded-lg focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'excused', 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* UNEXCUSED DAYS */}
                      <td className="px-6 py-3 bg-rose-50/5 text-center">
                        <div className="flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'unexcused', -1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={record.unexcused}
                            onChange={(e) => handleCountChange(student.id, 'unexcused', e.target.value)}
                            className="w-16 text-center font-mono font-bold border border-gray-200 py-1 rounded-lg focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'unexcused', 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* LATE DAYS */}
                      <td className="px-6 py-3 bg-amber-50/5 text-center">
                        <div className="flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'late', -1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={record.late}
                            onChange={(e) => handleCountChange(student.id, 'late', e.target.value)}
                            className="w-16 text-center font-mono font-bold border border-gray-200 py-1 rounded-lg focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => adjustCount(student.id, 'late', 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* 6-MONTH TREND SPARKLINE */}
                      <td className="px-4 py-3 bg-indigo-50/5 text-center min-w-[150px]">
                        <div className="inline-flex justify-center items-center bg-white p-1 rounded-lg border border-gray-100 shadow-3xs">
                          <LineChart
                            width={130}
                            height={34}
                            data={getTrendDataForStudent(student.id)}
                            margin={{ top: 2, right: 3, left: 3, bottom: 2 }}
                          >
                            <Line
                              type="monotone"
                              dataKey="unexcused"
                              stroke="#ef4444"
                              strokeWidth={1.5}
                              dot={{ r: 1.5, strokeWidth: 0, fill: '#ef4444' }}
                              activeDot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="excused"
                              stroke="#10b981"
                              strokeWidth={1.5}
                              dot={{ r: 1.5, strokeWidth: 0, fill: '#10b981' }}
                              activeDot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="late"
                              stroke="#f59e0b"
                              strokeWidth={1.5}
                              dot={{ r: 1.5, strokeWidth: 0, fill: '#f59e0b' }}
                              activeDot={{ r: 4 }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const d = payload[0].payload;
                                  return (
                                    <div className="bg-slate-950/95 text-[10px] text-white px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-lg font-sans text-left leading-relaxed z-50">
                                      <p className="font-bold border-b border-slate-800 pb-0.5 mb-1 text-slate-200">
                                        ខែ {d.monthLabel}
                                      </p>
                                      <div className="space-y-0.5">
                                        <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>អត់ច្បាប់: <strong className="font-mono text-rose-300">{d.unexcused}</strong></p>
                                        <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>មានច្បាប់: <strong className="font-mono text-emerald-300">{d.excused}</strong></p>
                                        <p className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>យឺត: <strong className="font-mono text-amber-300">{d.late}</strong></p>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </LineChart>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Tip indicator */}
        <div className="p-5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 bg-gray-50/30">
          <span className="flex items-center gap-1"><Info className="w-4 h-4 text-indigo-500" /> ចុចបូក (+) ឬដក (-) ដើម្បីលៃតម្រូវបានរហ័ស ឬវាយបញ្ចូលផ្ទាល់ក្នុងប្រអប់លេខ។</span>
          <span>ចំនួនសិស្ស៖ {students.length} នាក់</span>
        </div>
      </div>
    </div>
  );
}
