import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord } from '../types';
import { MONTH_LIST, PERIODS, exportToCSV } from '../utils';
import { Check, ClipboardList, AlertCircle, Save, CheckCircle, Info, Download, BarChart3, Users, Calendar, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

interface AttendanceTabProps {
  students: Student[];
  attendance: { [studentId: string]: { [month: string]: AttendanceRecord } };
  onSaveAttendance: (studentId: string, month: string, record: AttendanceRecord) => void;
}

export default function AttendanceTab({ students, attendance, onSaveAttendance }: AttendanceTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('nov');
  const [localAttendance, setLocalAttendance] = useState<{ [studentId: string]: { excused: number; unexcused: number; late: number; notes: string } }>({});
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  // Load attendance when selectedMonth or students changes
  useEffect(() => {
    const loaded: { [studentId: string]: { excused: number; unexcused: number; late: number; notes: string } } = {};
    students.forEach((student) => {
      const saved = attendance[student.id]?.[selectedMonth];
      loaded[student.id] = saved
        ? { excused: saved.excused, unexcused: saved.unexcused, late: saved.late, notes: saved.notes || '' }
        : { excused: 0, unexcused: 0, late: 0, notes: '' };
    });
    setLocalAttendance(loaded);
    setIsSavedIndicator(false);
  }, [selectedMonth, students, attendance]);

  // Handle teacher notes text area state updates
  const handleNotesChange = (studentId: string, notes: string) => {
    setLocalAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
    setIsSavedIndicator(false);
  };

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
      const record = recordValue as { excused: number; unexcused: number; late: number; notes: string };
      onSaveAttendance(studentId, selectedMonth, {
        studentId,
        month: selectedMonth,
        excused: record.excused,
        unexcused: record.unexcused,
        late: record.late,
        notes: record.notes
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

  // --- Attendance Analytics Computations ---
  const monthlyAggregates = MONTH_LIST.map((m) => {
    let unexcusedTotal = 0;
    let excusedTotal = 0;
    let lateTotal = 0;

    students.forEach((student) => {
      let rec;
      if (m === selectedMonth) {
        rec = localAttendance[student.id] || { excused: 0, unexcused: 0, late: 0 };
      } else {
        rec = attendance[student.id]?.[m] || { excused: 0, unexcused: 0, late: 0 };
      }
      unexcusedTotal += rec.unexcused || 0;
      excusedTotal += rec.excused || 0;
      lateTotal += rec.late || 0;
    });

    return {
      name: getMonthLabel(m),
      'អត់ច្បាប់ (Absent)': unexcusedTotal,
      'មានច្បាប់ (Excused)': excusedTotal,
      'យឺត (Late)': lateTotal,
      total: unexcusedTotal + excusedTotal + lateTotal
    };
  });

  const grandTotalUnexcused = monthlyAggregates.reduce((sum, item) => sum + item['អត់ច្បាប់ (Absent)'], 0);
  const grandTotalExcused = monthlyAggregates.reduce((sum, item) => sum + item['មានច្បាប់ (Excused)'], 0);
  const grandTotalLate = monthlyAggregates.reduce((sum, item) => sum + item['យឺត (Late)'], 0);

  // Find the peak month for infractions
  const sortedMonthsCount = [...monthlyAggregates].sort((a, b) => b.total - a.total);
  const peakMonthObj = sortedMonthsCount[0];
  const peakMonthText = peakMonthObj && peakMonthObj.total > 0 
    ? peakMonthObj.name 
    : 'គ្មានទិន្នន័យ';
  const peakMonthCount = peakMonthObj ? peakMonthObj.total : 0;

  // Identify students with irregular attendance
  const studentTotals = students.map((student) => {
    let unexcused = 0;
    let excused = 0;
    let late = 0;

    MONTH_LIST.forEach((m) => {
      let rec;
      if (m === selectedMonth) {
        rec = localAttendance[student.id] || { excused: 0, unexcused: 0, late: 0 };
      } else {
        rec = attendance[student.id]?.[m] || { excused: 0, unexcused: 0, late: 0 };
      }
      unexcused += rec.unexcused || 0;
      excused += rec.excused || 0;
      late += rec.late || 0;
    });

    return {
      student,
      unexcused,
      excused,
      late,
      total: unexcused + excused + late,
      weightedScore: unexcused * 2 + excused * 1 + late * 0.5
    };
  });

  const topIrregularStudents = studentTotals
    .filter((s) => s.total > 0)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Selector and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="px-4 py-2.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            title="បង្ហាញ ឬលាក់តារាងវិភាគវត្តមានសង្ខេបប្រចាំថ្នាក់"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 shrink-0" />
            {showSummary ? 'លាក់ការវិភាគ (Hide Analysis)' : 'បង្ហាញការវិភាគ (Show Analysis)'}
          </button>

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
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer w-full sm:w-auto shrink-0 ${
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
                រក្សាទុកវត្តមាន
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Analytics Summary Panel */}
      {showSummary && students.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-150">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm md:text-base">តារាងវិភាគ និងទំនោរវត្តមានសិស្សប្រចាំឆ្នាំ (Attendance Trend & Analysis)</h3>
                <p className="text-xs text-gray-400 mt-0.5">ទិន្នន័យបូកសរុបទូទាំងថ្នាក់សម្រាប់ខែនិមួយៗ ដើម្បីងាយស្រួលតាមដានសិស្សដែលមានភាពមិនទៀងទាត់</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                សរុប៖ {students.length} នាក់
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Area */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">តារាងប្រៀបធៀបករណីអវត្តមាន និងយឺតតាមខែ (Monthly Pattern)</h4>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-sans">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>អត់ច្បាប់</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>មានច្បាប់</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>យឺត</span>
                </div>
              </div>
              
              <div className="w-full h-64 md:h-72 bg-slate-50/40 p-4 rounded-xl border border-gray-105">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyAggregates}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const absent = payload.find(p => p.name === 'អត់ច្បាប់ (Absent)')?.value || 0;
                          const excused = payload.find(p => p.name === 'មានច្បាប់ (Excused)')?.value || 0;
                          const late = payload.find(p => p.name === 'យឺត (Late)')?.value || 0;
                          const monthSum = Number(absent) + Number(excused) + Number(late);
                          return (
                            <div className="bg-white/95 backdrop-blur-md text-[11px] text-slate-800 p-3 rounded-xl border border-slate-205 shadow-xl font-sans text-left min-w-[150px] leading-relaxed">
                              <p className="font-bold border-b border-slate-100 pb-1 mb-1.5 text-indigo-950">
                                {label}
                              </p>
                              <div className="space-y-1">
                                <p className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-rose-500"></span>អត់ច្បាប់ (Absent)</span>
                                  <strong className="font-mono text-rose-600 text-xs">{absent}</strong>
                                </p>
                                <p className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-emerald-500"></span>មានច្បាប់ (Excused)</span>
                                  <strong className="font-mono text-emerald-600 text-xs">{excused}</strong>
                                </p>
                                <p className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-xs bg-amber-500"></span>យឺត (Late)</span>
                                  <strong className="font-mono text-amber-600 text-xs">{late}</strong>
                                </p>
                                <div className="border-t border-slate-100 pt-1 mt-1.5 flex items-center justify-between text-indigo-950 font-bold">
                                  <span>ករណីសរុប (Total cases):</span>
                                  <span className="font-mono text-xs">{monthSum}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="អត់ច្បាប់ (Absent)" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="មានច្បាប់ (Excused)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="យឺត (Late)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insights and Alert Cards Area */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">សូចនាករសង្ខេប & ការប្រុងប្រយ័ត្ន (Insights & Alerts)</h4>
              
              {/* Quick stats mini-grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-rose-50/60 border border-rose-100 rounded-xl text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-rose-700 block text-nowrap">អត់ច្បាប់</span>
                  <span className="text-base font-black text-rose-600 font-mono mt-0.5">{grandTotalUnexcused}</span>
                  <span className="text-[8px] text-rose-500/85">សរុប</span>
                </div>
                <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-emerald-700 block text-nowrap">មានច្បាប់</span>
                  <span className="text-base font-black text-emerald-600 font-mono mt-0.5">{grandTotalExcused}</span>
                  <span className="text-[8px] text-emerald-500/85 font-sans">សរុប</span>
                </div>
                <div className="p-2 bg-amber-50/60 border border-amber-100 rounded-xl text-center flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-amber-700 block text-nowrap">យឺត</span>
                  <span className="text-base font-black text-amber-600 font-mono mt-0.5">{grandTotalLate}</span>
                  <span className="text-[8px] text-amber-500/85 font-sans">សរុប</span>
                </div>
              </div>

              {/* Peak Month Alert Card */}
              <div className="p-3 bg-indigo-50/30 border border-indigo-100/60 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold leading-none">ខែមានអវត្តមានខ្ពស់ជាងគេ</span>
                  <span className="text-xs font-extrabold text-indigo-950 mt-1 block font-sans">
                    {peakMonthCount > 0 ? `ខែ ${peakMonthText} (${peakMonthCount} ករណី)` : 'គ្មានទិន្នន័យអវត្តមាន'}
                  </span>
                </div>
              </div>

              {/* Attendance Pattern/Alert list */}
              <div className="p-3 bg-slate-50 border border-gray-105 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>សិស្សមានអវត្តមានច្រើនជាងគេ (Irregular List)</span>
                </div>
                
                {topIrregularStudents.length === 0 ? (
                  <p className="text-[10px] text-gray-400 font-medium italic">ពុំទាន់មានសិស្សដែលមានករណីអវត្តមាន ឬយឺតឡើយ។</p>
                ) : (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {topIrregularStudents.map(({ student, unexcused, excused, late }) => (
                      <div key={student.id} className="flex items-center justify-between p-1.5 bg-white border border-gray-100 rounded-lg text-[10.5px]">
                        <div className="truncate pr-2">
                          <strong className="text-slate-800 font-sans block">{student.nameKh}</strong>
                          <span className="text-[9px] text-gray-400">{student.id}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono font-bold shrink-0">
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-xs border border-rose-100" title="អត់ច្បាប់">
                            A:{unexcused}
                          </span>
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-xs border border-emerald-100" title="មានច្បាប់">
                            E:{excused}
                          </span>
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-xs border border-amber-100" title="យឺត">
                            L:{late}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-6 py-4 text-center bg-violet-50/10 min-w-[240px]">យោបល់ និងការសង្កេតគ្រូប្រចាំខែ (Teacher's Monthly Notes)</th>
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

                      {/* TEACHER'S OBSERVATIONS (notes) */}
                      <td className="px-4 py-3 bg-violet-50/5 text-center min-w-[240px]">
                        <textarea
                          placeholder="បញ្ចូលយោបល់គ្រូ ឬការសង្កេតឥរិយាបថសិស្សសម្រាប់ខែនេះ..."
                          value={record.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="w-full text-xs border border-gray-200 focus:border-indigo-500 p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans h-14 bg-white shadow-3xs resize-y transition-all"
                        />
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
