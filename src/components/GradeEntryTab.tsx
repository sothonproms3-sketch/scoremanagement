import React, { useState, useEffect } from 'react';
import { Student, SubjectScores, AcademicPeriod } from '../types';
import { PERIODS, SUBJECT_NAMES, SUB_SUBJECTS, calculateRecordMetrics, computeParentSubjectAverages, exportToCSV } from '../utils';
import { Save, CheckCircle, Info, HelpCircle, FileSpreadsheet, Keyboard, Download, Copy, LayoutGrid, ListChecks } from 'lucide-react';

interface GradeEntryTabProps {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
  onSaveScores: (studentId: string, period: AcademicPeriod, s: SubjectScores) => void;
}

export default function GradeEntryTab({ students, scores, onSaveScores }: GradeEntryTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>('nov');
  const [localScores, setLocalScores] = useState<{ [studentId: string]: SubjectScores }>({});
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [entryMode, setEntryMode] = useState<'direct' | 'detailed'>('direct');

  // Determine previous academic period based on selection
  const currentIndex = PERIODS.findIndex((p) => p.value === selectedPeriod);
  const hasPreviousPeriod = currentIndex > 0;
  const prevPeriod = hasPreviousPeriod ? PERIODS[currentIndex - 1] : null;
  const prevPeriodLabel = prevPeriod ? prevPeriod.labelKh : '';

  // Copy previous scores for a single student
  const handleCopyPreviousScoresForStudent = (studentId: string) => {
    if (!prevPeriod) return;
    const prevScores = scores[studentId]?.[prevPeriod.value];
    if (prevScores) {
      setLocalScores((prev) => ({
        ...prev,
        [studentId]: { ...prevScores }
      }));
      setIsSavedIndicator(false);
    }
  };

  // Copy previous scores for all students
  const handleCopyPreviousScoresForAll = () => {
    if (!prevPeriod) return;
    
    // Check if we have any scores to copy
    const hasAnyPrevScores = students.some(s => !!scores[s.id]?.[prevPeriod.value]);
    if (!hasAnyPrevScores) {
      alert(`មិនទាន់មានទិន្នន័យពិន្ទុសម្រាប់ខែមុន (${prevPeriodLabel}) ឡើយទេ។`);
      return;
    }

    if (window.confirm(`តើអ្នកពិតជាចង់ចម្លងពិន្ទុពីខែមុន (${prevPeriodLabel}) សម្រាប់សិស្សទាំងអស់មែនទេ? (ពិន្ទុគណនាបច្ចុប្បន្នដែលមិនទាន់រក្សាទុកនឹងត្រូវជំនួស)`)) {
      setLocalScores((prev) => {
        const nextScores = { ...prev };
        students.forEach((student) => {
          const prevScores = scores[student.id]?.[prevPeriod.value];
          if (prevScores) {
            nextScores[student.id] = { ...prevScores };
          }
        });
        return nextScores;
      });
      setIsSavedIndicator(false);
    }
  };

  const hasPreviousScores = (studentId: string): boolean => {
    if (!prevPeriod) return false;
    return !!scores[studentId]?.[prevPeriod.value];
  };

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
      if (value === "") {
        setLocalScores(prev => {
          const updated = { ...prev[studentId] };
          delete updated[subject];
          const synced = computeParentSubjectAverages(updated);
          return {
            ...prev,
            [studentId]: synced
          };
        });
        setIsSavedIndicator(false);
        return;
      }
      numVal = 0;
    }
    
    // Bounds check to avoid invalid grades (should be between 0 and 10)
    if (numVal < 0) numVal = 0;
    if (numVal > 10) numVal = 10;

    setLocalScores(prev => {
      const updated = {
        ...prev[studentId],
        [subject]: numVal
      };
      const synced = computeParentSubjectAverages(updated);
      return {
        ...prev,
        [studentId]: synced
      };
    });
    
    setIsSavedIndicator(false);
  };

  const hasSubScores = (studentId: string, parent: 'khmer' | 'math' | 'social'): boolean => {
    const record = localScores[studentId];
    if (!record) return false;
    if (parent === 'khmer') {
      return record.khmerReading !== undefined || record.khmerDictation !== undefined || record.khmerComposition !== undefined;
    }
    if (parent === 'math') {
      return record.mathNumbers !== undefined || record.mathMeasurement !== undefined || record.mathGeometry !== undefined || record.mathAlgebra !== undefined || record.mathStatistics !== undefined;
    }
    if (parent === 'social') {
      return record.socialCivics !== undefined || record.socialGeography !== undefined || record.socialHistory !== undefined || record.socialArts !== undefined;
    }
    return false;
  };

  // Quick helper to fill default average values or standard mock scoring
  const handleFillDemoScores = () => {
    if (window.confirm('តើអ្នកចង់បំពេញពិន្ទុ និងមុខវិជ្ជារងគំរូស្វ័យប្រវត្តសម្រាប់សិស្សទាំងអស់មែនទេ? (ពិន្ទុគណនាចន្លោះពី ៥ ដល់ ១០)')) {
      const demo: { [studentId: string]: SubjectScores } = {};
      students.forEach((student) => {
        const baseKhmerReading = Math.round((5 + Math.random() * 5) * 10) / 10;
        const baseKhmerDictation = Math.round((4.5 + Math.random() * 5.5) * 10) / 10;
        const baseKhmerComposition = Math.round((5 + Math.random() * 5) * 10) / 10;

        const baseMathNumbers = Math.round((5 + Math.random() * 5) * 10) / 10;
        const baseMathMeasurement = Math.round((5 + Math.random() * 5) * 10) / 10;
        const baseMathGeometry = Math.round((4 + Math.random() * 6) * 10) / 10;
        const baseMathAlgebra = Math.round((5 + Math.random() * 5) * 10) / 10;
        const baseMathStatistics = Math.round((5.5 + Math.random() * 4.5) * 10) / 10;

        const baseSocialCivics = Math.round((6 + Math.random() * 4) * 10) / 10;
        const baseSocialGeography = Math.round((5 + Math.random() * 5) * 10) / 10;
        const baseSocialHistory = Math.round((5.5 + Math.random() * 4.5) * 10) / 10;
        const baseSocialArts = Math.round((7 + Math.random() * 3) * 10) / 10;

        const record: SubjectScores = {
          khmerReading: baseKhmerReading,
          khmerDictation: baseKhmerDictation,
          khmerComposition: baseKhmerComposition,

          mathNumbers: baseMathNumbers,
          mathMeasurement: baseMathMeasurement,
          mathGeometry: baseMathGeometry,
          mathAlgebra: baseMathAlgebra,
          mathStatistics: baseMathStatistics,

          socialCivics: baseSocialCivics,
          socialGeography: baseSocialGeography,
          socialHistory: baseSocialHistory,
          socialArts: baseSocialArts,

          science: Math.round((5 + Math.random() * 5) * 10) / 10,
          artsPE: Math.round((6 + Math.random() * 4) * 10) / 10,
          lifeSkills: Math.round((7 + Math.random() * 3) * 10) / 10,
          foreignLanguage: Math.round((5 + Math.random() * 5) * 10) / 10,

          // Will be correctly calculated by computeParentSubjectAverages
          khmer: 0,
          math: 0,
          social: 0
        };

        demo[student.id] = computeParentSubjectAverages(record);
      });
      setLocalScores(demo);
      setIsSavedIndicator(false);
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
      // Core Parent & Subs
      'ភាសាខ្មែរ រួម (Khmer Avg)',
      'ខ្មែរ_រៀនអាន (Khmer Reading)',
      'ខ្មែរ_សរសេរតាមអាន (Khmer Dictation)',
      'ខ្មែរ_តែងសេចក្តី (Khmer Composition)',
      'គណិតវិទ្យា រួម (Math Avg)',
      'គណិត_ចំនួន (Math Numbers)',
      'គណិត_រង្វាស់រង្វាល់ (Math Measurement)',
      'គណិត_ធរណីមាត្រ (Math Geometry)',
      'គណិត_ពីជគណិត (Math Algebra)',
      'គណិត_ស្ថិតិ (Math Statistics)',
      'វិទ្យាសាស្ត្រ (Science)',
      'សិក្សាសង្គម រួម (Social Avg)',
      'សង្គម_សីលធម៌-ពលរដ្ឋ (Social Civics)',
      'សង្គម_ភូមិវិទ្យា (Social Geography)',
      'សង្គម_ប្រវត្តិវិទ្យា (Social History)',
      'សង្គម_សិល្បៈ (Social Arts)',
      // Direct fields
      'អប់រំកាយនិងកីឡា (Physical Education)',
      'បំណិន (Life Skills)',
      'ភាសាបរទេស (Foreign Language)',
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
        studentS.khmer !== undefined ? studentS.khmer.toFixed(2) : '0.00',
        studentS.khmerReading !== undefined ? studentS.khmerReading : '—',
        studentS.khmerDictation !== undefined ? studentS.khmerDictation : '—',
        studentS.khmerComposition !== undefined ? studentS.khmerComposition : '—',
        studentS.math !== undefined ? studentS.math.toFixed(2) : '0.00',
        studentS.mathNumbers !== undefined ? studentS.mathNumbers : '—',
        studentS.mathMeasurement !== undefined ? studentS.mathMeasurement : '—',
        studentS.mathGeometry !== undefined ? studentS.mathGeometry : '—',
        studentS.mathAlgebra !== undefined ? studentS.mathAlgebra : '—',
        studentS.mathStatistics !== undefined ? studentS.mathStatistics : '—',
        studentS.science !== undefined ? studentS.science : '0.0',
        studentS.social !== undefined ? studentS.social.toFixed(2) : '0.00',
        studentS.socialCivics !== undefined ? studentS.socialCivics : '—',
        studentS.socialGeography !== undefined ? studentS.socialGeography : '—',
        studentS.socialHistory !== undefined ? studentS.socialHistory : '—',
        studentS.socialArts !== undefined ? studentS.socialArts : '—',
        studentS.artsPE !== undefined ? studentS.artsPE : '0.0',
        studentS.lifeSkills !== undefined ? studentS.lifeSkills : '—',
        studentS.foreignLanguage !== undefined ? studentS.foreignLanguage : '—',
        sum.toFixed(2),
        average.toFixed(2)
      ];
    });

    exportToCSV(`តារាងពិន្ទុ_រួមមុខវិជ្ជារង_ខែ_${periodLabel.replace(/\s+/g, '_')}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Selector Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 select-none">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">ជ្រើសរើសខែ ឬរដូវកាលសិក្សាចង់បញ្ចូលពិន្ទុ (Select Month / Exam Period)</label>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPeriod(p.value)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
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

        {/* Entry System Selector and Batch tools */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Entry System Mode Selection */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200/50">
            <button
              type="button"
              onClick={() => setEntryMode('direct')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                entryMode === 'direct'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-505" />
              បញ្ចូលរួម (Direct)
            </button>
            <button
              type="button"
              onClick={() => setEntryMode('detailed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                entryMode === 'detailed'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-indigo-505" />
              តាមមុខវិជ្ជារង (Detailed)
            </button>
          </div>

          <button
            onClick={handleExportScoresCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="នាំចេញពិន្ទុដែលបានបញ្ចូលសម្រាប់ខែនេះជាឯកសារ Excel រួមទាំងមុខវិជ្ជារងទាំងអស់"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            នាំចេញជា Excel
          </button>

          {hasPreviousPeriod && (
            <button
              onClick={handleCopyPreviousScoresForAll}
              className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-150 text-indigo-700 border border-indigo-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={`ចម្លងពិន្ទុពីខែមុន (${prevPeriodLabel}) សម្រាប់សិស្សទាំងអស់`}
            >
              <Copy className="w-3.5 h-3.5" />
              ចម្លងពីខែមុន
            </button>
          )}

          <button
            onClick={handleFillDemoScores}
            className="px-3.5 py-2 text-xs font-medium border border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <Keyboard className="w-3.5 h-3.5" />
            បំពេញមុខវិជ្ជារងគំរូ
          </button>

          <button
            onClick={handleSaveAll}
            className={`px-5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
              isSavedIndicator
                ? 'bg-green-600 text-white animate-pulse'
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
                រក្សាទុកពិន្ទុ
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid Sheet */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Title and Metadata info */}
        <div className="px-6 py-4 bg-indigo-50/40 border-b border-gray-105 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              សន្លឹកកិច្ចការបញ្ចូលពិន្ទុ៖{' '}
              <span className="text-indigo-700 font-extrabold underline decoration-wavy">
                {PERIODS.find((p) => p.value === selectedPeriod)?.labelKh}
              </span>
              <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-850 font-bold">
                {entryMode === 'direct' ? 'របៀបបញ្ចូលរួម (Direct Mode)' : 'របៀបបញ្ចូលតាមមុខវិជ្ជារង (Detailed Mode)'}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 border border-gray-100 rounded-lg px-2.5 py-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>ពិន្ទុចន្លោះពី <strong className="text-indigo-600 font-mono">0.0</strong> ដល់ <strong className="text-indigo-600 font-mono">10.0</strong></span>
          </div>
        </div>

        {/* Data Matrix */}
        <div className="overflow-x-auto text-[13px]">
          {students.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-base font-medium">មិនទាន់មានបញ្ជីឈ្មោះសិស្សនៅឡើយទេ។</p>
              <p className="text-xs text-gray-400 mt-1">សូមចូលទៅកាន់ផ្ទាំង &ldquo;បញ្ជីសិស្ស&rdquo; ដើម្បីចុះឈ្មោះជាមុនសិន។</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                {entryMode === 'direct' ? (
                  <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                    <th className="px-5 py-4 w-12 text-center border-r border-gray-250">ល.រ</th>
                    <th className="px-5 py-4 w-28 border-r border-gray-250">អត្តសញ្ញាណ</th>
                    <th className="px-6 py-4 border-r border-gray-250">ឈ្មោះសិស្ស</th>
                    <th className="px-4 py-4 w-16 text-center border-r border-gray-250">ភេទ</th>
                    {SUBJECT_NAMES.map((sub) => (
                      <th key={sub.value} className="px-3 py-4 text-center min-w-[130px] bg-slate-50/40 border-r border-gray-250">
                        {sub.labelKh}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-center text-indigo-600 font-bold bg-indigo-50/30 border-r border-gray-200">សរុប</th>
                    <th className="px-6 py-4 text-center text-indigo-700 font-extrabold bg-indigo-50/50">មធ្យមភាគ</th>
                  </tr>
                ) : (
                  <>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                      <th rowSpan={2} className="px-3 py-3 w-12 text-center border-r border-gray-250">ល.រ</th>
                      <th rowSpan={2} className="px-3 py-3 w-28 border-r border-gray-250">អត្តសញ្ញាណ</th>
                      <th rowSpan={2} className="px-4 py-3 min-w-[180px] border-r border-gray-250">ឈ្មោះសិស្ស</th>
                      <th rowSpan={2} className="px-2 py-3 w-16 text-center border-r border-gray-250">ភេទ</th>
                      
                      {/* Sub-subject Parent Columns */}
                      <th colSpan={3} className="px-2 py-2 text-center bg-emerald-50/60 text-emerald-900 border-r border-gray-250 font-extrabold text-[11px]">ភាសាខ្មែរ (Khmer)</th>
                      <th colSpan={5} className="px-2 py-2 text-center bg-indigo-50/60 text-indigo-900 border-r border-gray-250 font-extrabold text-[11px]">គណិតវិទ្យា (Math)</th>
                      <th rowSpan={2} className="px-3 py-3 text-center bg-slate-50/40 border-r border-gray-250 font-bold text-gray-800 min-w-[90px]">វិទ្យាសាស្ត្រ</th>
                      <th colSpan={4} className="px-2 py-2 text-center bg-amber-50/60 text-amber-900 border-r border-gray-250 font-extrabold text-[11px]">សិក្សាសង្គម (Social)</th>
                      <th rowSpan={2} className="px-3 py-3 text-center bg-slate-50/40 border-r border-gray-250 font-bold text-gray-800 min-w-[110px]">អប់រំកាយ/កីឡា</th>
                      <th rowSpan={2} className="px-3 py-3 text-center bg-slate-50/40 border-r border-gray-250 font-bold text-gray-800 min-w-[90px]">បំណិន</th>
                      <th rowSpan={2} className="px-3 py-3 text-center bg-slate-50/40 border-r border-gray-250 font-bold text-gray-800 min-w-[110px]">ភាសាបរទេស</th>
                      
                      <th rowSpan={2} className="px-4 py-3 text-center text-indigo-600 font-bold bg-indigo-50/30 border-r border-gray-200">សរុប</th>
                      <th rowSpan={2} className="px-4 py-3 text-center text-indigo-700 font-extrabold bg-indigo-50/50">មធ្យមភាគ</th>
                    </tr>
                    <tr className="bg-slate-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-250">
                      {/* Khmer Subs */}
                      <th className="px-1 py-2 text-center bg-emerald-50/20 text-emerald-800 border-r border-gray-200">រៀនអាន</th>
                      <th className="px-1 py-2 text-center bg-emerald-50/20 text-emerald-800 border-r border-gray-200">សរសេរអាន</th>
                      <th className="px-1 py-2 text-center bg-emerald-50/20 text-emerald-800 border-r border-gray-250">តែងសេចក្តី</th>
                      {/* Math Subs */}
                      <th className="px-1 py-2 text-center bg-indigo-50/15 text-indigo-805 border-r border-gray-200">ចំនួន</th>
                      <th className="px-1 py-2 text-center bg-indigo-50/15 text-indigo-805 border-r border-gray-200">រង្វាស់រង្វាល់</th>
                      <th className="px-1 py-2 text-center bg-indigo-50/15 text-indigo-805 border-r border-gray-200">ធរណីមាត្រ</th>
                      <th className="px-1 py-2 text-center bg-indigo-50/15 text-indigo-805 border-r border-gray-200">ពីជគណិត</th>
                      <th className="px-1 py-2 text-center bg-indigo-50/15 text-indigo-805 border-r border-gray-200">ស្ថិតិ</th>
                      {/* Social Subs */}
                      <th className="px-1 py-2 text-center bg-amber-50/20 text-amber-808 border-r border-gray-200">សីលធម៌-ពល</th>
                      <th className="px-1 py-2 text-center bg-amber-50/20 text-amber-808 border-r border-gray-200">ភូមិវិទ្យា</th>
                      <th className="px-1 py-2 text-center bg-amber-50/20 text-amber-808 border-r border-gray-200">ប្រវត្តិវិទ្យា</th>
                      <th className="px-1 py-2 text-center bg-amber-50/20 text-amber-808 border-r border-gray-200">សិល្បៈ</th>
                    </tr>
                  </>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans">
                {students.map((student, index) => {
                  const studentS = localScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
                  const { sum, average } = calculateRecordMetrics(studentS);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-3 py-3 text-center font-mono font-bold text-xs text-gray-400 border-r border-gray-100">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono font-medium text-gray-400 border-r border-gray-100 select-all">
                        {student.id}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-800 whitespace-nowrap border-r border-gray-100">
                        <div className="flex items-center justify-between gap-2 group">
                          <div>
                            <span className="font-sans text-xs font-bold text-gray-900 block">{student.nameKh}</span>
                            <span className="block font-mono text-[9px] text-gray-400 uppercase font-normal mt-0.5">{student.nameEn}</span>
                          </div>
                          {hasPreviousPeriod && (
                            <button
                              type="button"
                              onClick={() => handleCopyPreviousScoresForStudent(student.id)}
                              disabled={!hasPreviousScores(student.id)}
                              className={`p-1 px-1.5 rounded-lg border text-[9px] flex items-center gap-0.5 transition-all md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 shrink-0 ${
                                hasPreviousScores(student.id)
                                  ? 'bg-indigo-50 hover:bg-indigo-100 border-indigo-150 text-indigo-750 cursor-pointer'
                                  : 'bg-gray-50 border-gray-100 text-gray-350 cursor-not-allowed'
                              }`}
                              title={
                                hasPreviousScores(student.id)
                                  ? `ចម្លងពិន្ទុពីខែមុន (${prevPeriodLabel}) របស់សិស្សនេះ`
                                  : `មិនមានពិន្ទុខែមុនទេ`
                              }
                            >
                              <Copy className="w-2.5 h-2.5 text-indigo-550" />
                              <span className="font-sans font-medium">ចម្លង</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center whitespace-nowrap border-r border-gray-100">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.gender === 'ស្រី'
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {student.gender}
                        </span>
                      </td>

                      {/* RENDERING DIRECT MODE FOR SUBJECTS */}
                      {entryMode === 'direct' ? (
                        <>
                          {SUBJECT_NAMES.map((sub) => {
                            const scoreVal = studentS[sub.value];
                            const isCalculated = (sub.value === 'khmer' && hasSubScores(student.id, 'khmer')) ||
                                                 (sub.value === 'math' && hasSubScores(student.id, 'math')) ||
                                                 (sub.value === 'social' && hasSubScores(student.id, 'social'));

                            return (
                              <td key={sub.value} className="px-2 py-2 text-center bg-slate-50/10 border-r border-gray-100">
                                <div className="relative inline-block">
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    disabled={isCalculated}
                                    value={scoreVal === 0 && !scores[student.id]?.[selectedPeriod] && !isCalculated ? '' : (typeof scoreVal === 'number' ? scoreVal.toFixed(1).replace('.0', '') : '')}
                                    placeholder={isCalculated ? "ស្វ័យប្រវត្ត" : "—"}
                                    onChange={(e) => handleScoreChange(student.id, sub.value, e.target.value)}
                                    className={`w-16 sm:w-20 text-center font-mono font-bold py-1.5 border border-gray-200 focus:border-indigo-500 rounded-lg text-xs focus:outline-none transition-all focus:ring-2 focus:ring-indigo-100 ${
                                      isCalculated 
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 cursor-not-allowed font-black'
                                        : 'bg-white'
                                    }`}
                                    title={isCalculated ? "ពិន្ទុនេះត្រូវបានគណនាដោយស្វ័យប្រវត្តពីមុខវិជ្ជារង" : `បញ្ចូលពិន្ទុសម្រាប់ ${sub.labelKh}`}
                                  />
                                  {isCalculated && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </>
                      ) : (
                        /* RENDERING DETAILED MODE FOR SUBJECTS AND SUB-SUBJECTS */
                        <>
                          {/* Khmer Sub-subjects */}
                          <td className="px-1 py-1 bg-emerald-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.khmerReading !== undefined ? studentS.khmerReading : ''}
                              onChange={(e) => handleScoreChange(student.id, 'khmerReading', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-emerald-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-emerald-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.khmerDictation !== undefined ? studentS.khmerDictation : ''}
                              onChange={(e) => handleScoreChange(student.id, 'khmerDictation', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-emerald-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-emerald-50/10 border-r border-gray-200/90 text-center border-double border-r-2">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.khmerComposition !== undefined ? studentS.khmerComposition : ''}
                              onChange={(e) => handleScoreChange(student.id, 'khmerComposition', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-emerald-550 rounded-lg text-xs font-bold"
                            />
                          </td>

                          {/* Math Sub-subjects */}
                          <td className="px-1 py-1 bg-indigo-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.mathNumbers !== undefined ? studentS.mathNumbers : ''}
                              onChange={(e) => handleScoreChange(student.id, 'mathNumbers', e.target.value)}
                              className="w-11 text-center font-mono py-1.5 border border-gray-200 focus:border-indigo-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-indigo-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.mathMeasurement !== undefined ? studentS.mathMeasurement : ''}
                              onChange={(e) => handleScoreChange(student.id, 'mathMeasurement', e.target.value)}
                              className="w-11 text-center font-mono py-1.5 border border-gray-200 focus:border-indigo-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-indigo-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.mathGeometry !== undefined ? studentS.mathGeometry : ''}
                              onChange={(e) => handleScoreChange(student.id, 'mathGeometry', e.target.value)}
                              className="w-11 text-center font-mono py-1.5 border border-gray-200 focus:border-indigo-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-indigo-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.mathAlgebra !== undefined ? studentS.mathAlgebra : ''}
                              onChange={(e) => handleScoreChange(student.id, 'mathAlgebra', e.target.value)}
                              className="w-11 text-center font-mono py-1.5 border border-gray-200 focus:border-indigo-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-indigo-50/10 border-r border-gray-200/90 text-center border-double border-r-2">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.mathStatistics !== undefined ? studentS.mathStatistics : ''}
                              onChange={(e) => handleScoreChange(student.id, 'mathStatistics', e.target.value)}
                              className="w-11 text-center font-mono py-1.5 border border-gray-200 focus:border-indigo-550 rounded-lg text-xs font-bold"
                            />
                          </td>

                          {/* Science */}
                          <td className="px-2 py-1 bg-slate-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.science !== undefined ? studentS.science : ''}
                              onChange={(e) => handleScoreChange(student.id, 'science', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-gray-550 rounded-lg text-xs font-semibold"
                            />
                          </td>

                          {/* Social Sub-subjects */}
                          <td className="px-1 py-1 bg-amber-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.socialCivics !== undefined ? studentS.socialCivics : ''}
                              onChange={(e) => handleScoreChange(student.id, 'socialCivics', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-amber-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-amber-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.socialGeography !== undefined ? studentS.socialGeography : ''}
                              onChange={(e) => handleScoreChange(student.id, 'socialGeography', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-amber-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-amber-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.socialHistory !== undefined ? studentS.socialHistory : ''}
                              onChange={(e) => handleScoreChange(student.id, 'socialHistory', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-amber-550 rounded-lg text-xs font-bold"
                            />
                          </td>
                          <td className="px-1 py-1 bg-amber-50/10 border-r border-gray-200/90 text-center border-double border-r-2">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.socialArts !== undefined ? studentS.socialArts : ''}
                              onChange={(e) => handleScoreChange(student.id, 'socialArts', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-amber-550 rounded-lg text-xs font-bold"
                            />
                          </td>

                          {/* PE */}
                          <td className="px-2 py-1 bg-slate-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.artsPE !== undefined ? studentS.artsPE : ''}
                              onChange={(e) => handleScoreChange(student.id, 'artsPE', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-gray-550 rounded-lg text-xs font-semibold"
                            />
                          </td>

                          {/* Life Skills */}
                          <td className="px-2 py-1 bg-slate-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.lifeSkills !== undefined ? studentS.lifeSkills : ''}
                              onChange={(e) => handleScoreChange(student.id, 'lifeSkills', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-gray-550 rounded-lg text-xs font-semibold"
                            />
                          </td>

                          {/* Foreign Language */}
                          <td className="px-2 py-1 bg-slate-50/10 border-r border-gray-150 text-center">
                            <input
                              type="number" step="0.1" min="0" max="10" placeholder="—"
                              value={studentS.foreignLanguage !== undefined ? studentS.foreignLanguage : ''}
                              onChange={(e) => handleScoreChange(student.id, 'foreignLanguage', e.target.value)}
                              className="w-12 text-center font-mono py-1.5 border border-gray-200 focus:border-gray-550 rounded-lg text-xs font-semibold"
                            />
                          </td>
                        </>
                      )}

                      {/* Sum Cell */}
                      <td className="px-4 py-3.5 text-center bg-indigo-50/20 text-indigo-700 font-mono font-bold text-xs border-r border-gray-100">
                        {sum.toFixed(1)}
                      </td>

                      {/* Average Cell */}
                      <td className="px-4 py-3.5 text-center bg-indigo-50/40 text-indigo-950 font-mono font-extrabold text-sm whitespace-nowrap">
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
