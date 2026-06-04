import React, { useState, useEffect } from 'react';
import { Student, SubjectScores, AcademicPeriod } from '../types';
import { PERIODS, SUBJECT_NAMES, calculateRecordMetrics, exportToCSV } from '../utils';
import { Save, CheckCircle, Info, HelpCircle, FileSpreadsheet, Keyboard, Download } from 'lucide-react';

interface GradeEntryTabProps {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
  onSaveScores: (studentId: string, period: AcademicPeriod, s: SubjectScores) => void;
}

export default function GradeEntryTab({ students, scores, onSaveScores }: GradeEntryTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>('nov');
  const [localScores, setLocalScores] = useState<{ [studentId: string]: SubjectScores }>({});
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);

  // Load scores when students or period changes
  useEffect(() => {
    const freshScores: { [studentId: string]: SubjectScores } = {};
    students.forEach((student) => {
      const saved = scores[student.id]?.[selectedPeriod];
      freshScores[student.id] = saved
        ? { ...saved }
        : { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
    });
    setLocalScores(freshScores);
    setIsSavedIndicator(false);
  }, [selectedPeriod, students, scores]);

  // Handle score change in a cell
  const handleScoreChange = (studentId: string, subject: keyof SubjectScores, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) {
      numVal = 0;
    }
    
    // Bounds check to avoid invalid grades (should be between 0 and 10)
    if (numVal < 0) numVal = 0;
    if (numVal > 10) numVal = 10;

    // We can allow fractional entry like 8.5
    setLocalScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: numVal
      }
    }));
    
    setIsSavedIndicator(false);
  };

  // Quick helper to fill default average values or standard mock scoring
  const handleFillDemoScores = () => {
    if (window.confirm('តើអ្នកចង់បំពេញពិន្ទុគំរូស្វ័យប្រវត្តសម្រាប់សិស្សទាំងអស់មែនទេ? ( grades between 5 and 10 )')) {
      const demo: { [studentId: string]: SubjectScores } = {};
      students.forEach((student) => {
        demo[student.id] = {
          khmer: Math.round((5 + Math.random() * 5) * 10) / 10,
          math: Math.round((5 + Math.random() * 5) * 10) / 10,
          science: Math.round((5 + Math.random() * 5) * 10) / 10,
          social: Math.round((5 + Math.random() * 5) * 10) / 10,
          artsPE: Math.round((6 + Math.random() * 4) * 10) / 10,
        };
      });
      setLocalScores(demo);
    }
  };

  // Save changes to parent state (and subsequently LocalStorage)
  const handleSaveAll = () => {
    Object.entries(localScores).forEach(([studentId, subjectScoresValue]) => {
      const subjectScores = subjectScoresValue as SubjectScores;
      onSaveScores(studentId, selectedPeriod, subjectScores);
    });
    setIsSavedIndicator(true);
    setTimeout(() => {
      setIsSavedIndicator(false);
    }, 4000);
  };

  const handleExportScoresCSV = () => {
    const periodLabel = PERIODS.find(p => p.value === selectedPeriod)?.labelKh || selectedPeriod;
    const headers = [
      'ល.រ (No)',
      'អត្តសញ្ញាណ (ID)',
      'ឈ្មោះខ្មែរ (Khmer Name)',
      'ឈ្មោះឡាតាំង (Latin Name)',
      'ភេទ (Gender)',
      'ភាសាខ្មែរ',
      'គណិតវិទ្យា',
      'វិទ្យាសាស្ត្រ',
      'សិក្សាសង្គម',
      'អប់រំកាយ/សិល្បៈ',
      'សរុប (Total)',
      'មធ្យមភាគ (Average)'
    ];

    const rows = students.map((student, index) => {
      const studentS = localScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
      const { sum, average } = calculateRecordMetrics(studentS);
      return [
        index + 1,
        student.id,
        student.nameKh,
        student.nameEn,
        student.gender,
        studentS.khmer,
        studentS.math,
        studentS.science,
        studentS.social,
        studentS.artsPE,
        sum.toFixed(1),
        average.toFixed(2)
      ];
    });

    exportToCSV(`តារាងពិន្ទុ_ខែ_${periodLabel}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Selector Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">ជ្រើសរើសខែ ឬរដូវកាលសិក្សាចង់បញ្ចូលពិន្ទុ (Select Month / Exam Period)</label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  selectedPeriod === p.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-700'
                }`}
              >
                {p.labelKh} {p.isExam && '🏆'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Batch Options */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportScoresCSV}
            className="px-4 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="នាំចេញពិន្ទុដែលបានបញ្ចូលសម្រាប់ខែនេះជាឯកសារ Excel"
          >
            <Download className="w-3.5 h-3.5" />
            នាំចេញជា Excel/CSV
          </button>

          <button
            onClick={handleFillDemoScores}
            className="px-4 py-2 text-xs font-medium border border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            បំពេញគំរូ (Auto-fill)
          </button>

          <button
            onClick={handleSaveAll}
            className={`px-5 py-2 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isSavedIndicator
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md'
            }`}
          >
            {isSavedIndicator ? (
              <>
                <CheckCircle className="w-4 h-4" />
                រក្សាទុកជោគជ័យ!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                រក្សាទុកពិន្ទុ (Save Scores)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Sheet */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Title and Metadata info */}
        <div className="px-6 py-4 bg-indigo-50/40 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900">
              សន្លឹកកិច្ចការបញ្ចូលពិន្ទុ៖{' '}
              <span className="text-indigo-700 font-extrabold underline decoration-wavy">
                {PERIODS.find((p) => p.value === selectedPeriod)?.labelKh}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 border border-gray-100 rounded-lg px-2.5 py-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>បញ្ចូលពិន្ទជាទសភាគចន្លោះពី <strong className="text-indigo-600 font-mono">0.0</strong> ដល់ <strong className="text-indigo-600 font-mono">10.0</strong></span>
          </div>
        </div>

        {/* Data Matrix */}
        <div className="overflow-x-auto">
          {students.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-base font-medium">មិនទាន់មានបញ្ជីឈ្មោះសិស្សនៅឡើយទេ។</p>
              <p className="text-xs text-gray-400 mt-1">សូមចូលទៅកាន់ផ្ទាំង &ldquo;បញ្ជីសិស្ស&rdquo; ដើម្បីចុះឈ្មោះជាមុនសិន។</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4 w-16 text-center">ល.រ</th>
                  <th className="px-6 py-4">អត្តសញ្ញាណ</th>
                  <th className="px-6 py-4">ឈ្មោះសិស្ស</th>
                  <th className="px-6 py-4 w-20 text-center">ភេទ</th>
                  {SUBJECT_NAMES.map((sub) => (
                    <th key={sub.value} className="px-4 py-4 text-center min-w-[120px] bg-slate-50/40">
                      {sub.labelKh}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-indigo-600 font-bold bg-indigo-50/30">សរុប</th>
                  <th className="px-6 py-4 text-center text-indigo-700 font-extrabold bg-indigo-50/50">មធ្យមភាគ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((student, index) => {
                  const studentS = localScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
                  const { sum, average } = calculateRecordMetrics(studentS);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-xs text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-mono font-medium text-gray-400">
                        {student.id}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-gray-800 whitespace-nowrap">
                        {student.nameKh}
                        <span className="block font-mono text-[10px] text-gray-400 uppercase font-normal mt-0.5">{student.nameEn}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          student.gender === 'ស្រី'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {student.gender}
                        </span>
                      </td>

                      {/* Subject Cells */}
                      {SUBJECT_NAMES.map((sub) => {
                        const scoreVal = studentS[sub.value];
                        return (
                          <td key={sub.value} className="px-3 py-2 text-center bg-slate-50/10">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={scoreVal === 0 && !scores[student.id]?.[selectedPeriod] ? '' : scoreVal}
                              placeholder="0.0"
                              onChange={(e) => handleScoreChange(student.id, sub.value, e.target.value)}
                              className="w-20 text-center font-mono font-semibold py-1.5 border border-gray-200 focus:border-indigo-500 rounded-lg text-sm focus:outline-none bg-white transition-all focus:ring-2 focus:ring-indigo-100"
                            />
                          </td>
                        );
                      })}

                      {/* Sum Cell */}
                      <td className="px-6 py-3.5 text-center bg-indigo-50/20 text-indigo-700 font-mono font-bold text-sm">
                        {sum.toFixed(1)}
                      </td>

                      {/* Average Cell */}
                      <td className="px-6 py-3.5 text-center bg-indigo-50/40 text-indigo-950 font-mono font-extrabold text-sm">
                        {average.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Saved auto reminder */}
        <div className="p-5 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 bg-gray-50/30">
          <span className="flex items-center gap-1"><HelpCircle className="w-4 h-4 text-gray-400" /> រាល់ពេលកែប្រែរួច សូមកុំភ្លេចចុចប៊ូតុង &ldquo;រក្សាទុកពិន្ទុ&rdquo; នៅផ្នែកខាងលើ ដើម្បីកត់ត្រាទុកក្នុងប្រព័ន្ធ។</span>
          <span>ចំនួនសិស្ស៖ {students.length} នាក់</span>
        </div>
      </div>
    </div>
  );
}
