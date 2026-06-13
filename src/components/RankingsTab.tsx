import React, { useState } from 'react';
import { Student, SubjectScores, AcademicPeriod } from '../types';
import { PERIODS, SUBJECT_NAMES, calculateRankings, getMention, getResultComments, exportToCSV, exportToWord } from '../utils';
import { Trophy, Award, Sparkles, Sliders, List, Columns, Eye, Printer, MapPin, Phone, Download, FileText } from 'lucide-react';

interface RankingsTabProps {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
}

export default function RankingsTab({ students, scores }: RankingsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>('nov');
  const [rowLayout, setRowLayout] = useState<'1row' | '2rows'>('1row');
  const [activeSubTab, setActiveSubTab] = useState<'rankList' | 'honorBoard'>('rankList');

  // Calculate all rankings and scores for each student for the selected period
  const allPeriodRankings = calculateRankings(students, scores);
  const currentPeriodRankings = allPeriodRankings[selectedPeriod] || {};

  // Sort students by rank (1, 2, 3...)
  const rankedStudentIds = Object.keys(currentPeriodRankings)
    .filter(id => currentPeriodRankings[id].rank > 0)
    .sort((a, b) => currentPeriodRankings[a].rank - currentPeriodRankings[b].rank);

  const rankedStudents = rankedStudentIds.map(id => {
    const student = students.find(s => s.id === id)!;
    const stats = currentPeriodRankings[id];
    const studentScores = scores[id]?.[selectedPeriod] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
    return {
      student,
      stats,
      scores: studentScores,
    };
  });

  // Top 3 for Honor roll podium
  const topStudents = rankedStudents.slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  const handleExportRankingsCSV = () => {
    const periodLabel = PERIODS.find(p => p.value === selectedPeriod)?.labelKh || selectedPeriod;
    const headers = [
      'ចំណាត់ថ្នាក់ (Rank)',
      'អត្តសញ្ញាណ (ID)',
      'ឈ្មោះខ្មែរ (Khmer Name)',
      'ឈ្មោះឡាតាំង (Latin Name)',
      'ភេទ (Gender)',
      'ភាសាខ្មែរ (Khmer)',
      'គណិតវិទ្យា (Math)',
      'វិទ្យាសាស្ត្រ (Science)',
      'សិក្សាសង្គម (Social)',
      'អប់រំកាយ/សិល្បៈ (Arts/PE)',
      'ពិន្ទុសរុប (Total Sum)',
      'មធ្យមភាគ (Average)',
      'និទ្ទេស (Mention)'
    ];

    const rows = rankedStudents.map((rs) => [
      rs.stats.rank,
      rs.student.id,
      rs.student.nameKh,
      rs.student.nameEn,
      rs.student.gender,
      rs.scores.khmer,
      rs.scores.math,
      rs.scores.science,
      rs.scores.social,
      rs.scores.artsPE,
      rs.stats.sum.toFixed(1),
      rs.stats.average.toFixed(2),
      getMention(rs.stats.average)
    ]);

    exportToCSV(`តារាងចំណាត់ថ្នាក់និងពិន្ទុសិស្ស_ខែ_${periodLabel}.csv`, headers, rows);
  };

  const handleExportRankingsWord = () => {
    const periodLabel = PERIODS.find(p => p.value === selectedPeriod)?.labelKh || selectedPeriod;
    
    let schoolNameVal = 'សាលាបឋមសិក្សាគំរូពញាក្រែក';
    let classNameVal = 'ថ្នាក់ទី ៥ អា';
    try {
      const saved = localStorage.getItem('khmer_primary_gradebook_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.classInfo) {
          schoolNameVal = parsed.classInfo.schoolName || schoolNameVal;
          classNameVal = parsed.classInfo.gradeClass || classNameVal;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    let tableRows = '';
    rankedStudents.forEach((rs) => {
      tableRows += `
        <tr>
          <td>${rs.stats.rank}</td>
          <td class="font-mono">${rs.student.id}</td>
          <td><b>${rs.student.nameKh}</b></td>
          <td class="font-mono" style="text-transform: uppercase;">${rs.student.nameEn}</td>
          <td>${rs.student.gender}</td>
          <td>${rs.scores.khmer.toFixed(1)}</td>
          <td>${rs.scores.math.toFixed(1)}</td>
          <td>${rs.scores.science.toFixed(1)}</td>
          <td>${rs.scores.social.toFixed(1)}</td>
          <td>${rs.scores.artsPE.toFixed(1)}</td>
          <td><b>${rs.stats.sum.toFixed(1)}</b></td>
          <td><b>${rs.stats.average.toFixed(2)}</b></td>
          <td>${getMention(rs.stats.average)}</td>
        </tr>
      `;
    });

    const docBody = `
      <div class="moul-title" style="font-size: 16px; margin-bottom: 5px; text-align: center;">ព្រះរាជាណាចក្រកម្ពុជា</div>
      <div class="moul-title" style="font-size: 13px; margin-bottom: 10px; text-align: center;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
      <center><div style="width: 100px; border-bottom: 1px dashed #404040; margin-bottom: 20px;"></div></center>
      
      <table style="border:none; margin-bottom: 10px; width: 100%;">
        <tr style="border:none;">
          <td style="border:none; text-align: left; font-size:12px;"><b>សាលាបឋមសិក្សា៖</b> ${schoolNameVal}</td>
          <td style="border:none; text-align: right; font-size:12px;"><b>ថ្នាក់រៀន៖</b> ${classNameVal}</td>
        </tr>
      </table>

      <h2 style="font-size: 14px; text-align: center; color: #1e3a8a; margin-top: 10px; margin-bottom: 20px;">
        តារាងចំណាត់ថ្នាក់ និងផលពិន្ទុប្រឡងសិស្សប្រចាំ៖ ${periodLabel}
      </h2>

      <table>
        <thead>
          <tr>
            <th>ចំណាត់ថ្នាក់</th>
            <th>អត្តសញ្ញាណ</th>
            <th>ឈ្មោះសិស្សខ្មែរ</th>
            <th>ឡាតាំង</th>
            <th>ភេទ</th>
            <th>ភាសាខ្មែរ</th>
            <th>គណិតវិទ្យា</th>
            <th>វិទ្យាសាស្ត្រ</th>
            <th>សិក្សាសង្គម</th>
            <th>សិល្បៈ/PE</th>
            <th>សរុប</th>
            <th>មធ្យមភាគ</th>
            <th>និទ្ទេស</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <table class="footer-table" style="margin-top: 50px; border:none; width: 100%;">
        <tr style="border:none;">
          <td style="border:none; text-align: center; width: 50%;">
            <p>បានឃើញ និងឯកភាព</p>
            <p><b>នាយកសាលា</b></p>
            <br/><br/><br/><br/>
            <p>.........................................</p>
          </td>
          <td style="border:none; text-align: center; width: 50%;">
            <p>ធ្វើនៅថ្ងៃព្រហស្បតិ៍ ទី០៤ ខែមិថុនា ឆ្នាំ២០២៦</p>
            <p><b>គ្រូបន្ទុកថ្នាក់</b></p>
            <br/><br/><br/><br/>
            <p><b>${students[0]?.classTeacher || 'កែវ ច័ន្ទតារា'}</b></p>
          </td>
        </tr>
      </table>
    `;

    exportToWord(`តារាងចំណាត់ថ្នាក់សិស្ស_ខែ_${periodLabel}.doc`, `ចំណាត់ថ្នាក់ប្រចាំខែ_${periodLabel}`, docBody);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('rankList')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'rankList'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            ចំណាត់ថ្នាក់ប្រចាំខែ (Rankings List)
          </button>
          <button
            onClick={() => setActiveSubTab('honorBoard')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'honorBoard'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
            តារាងកិត្តិយស (Honor Roll)
          </button>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* Period selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AcademicPeriod)}
            className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.labelKh} {p.isExam ? '(ប្រឡង)' : ''}
              </option>
            ))}
          </select>

          {/* Export CSV button */}
          <button
            onClick={handleExportRankingsCSV}
            className="bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="នាំចេញចំណាត់ថ្នាក់ជា Excel / CSV"
          >
            <Download className="w-4 h-4" />
            Excel/CSV
          </button>

          {/* Export Word button */}
          <button
            onClick={handleExportRankingsWord}
            className="bg-sky-50 hover:bg-sky-100 transition-colors text-sky-700 border border-sky-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            title="នាំចេញចំណាត់ថ្នាក់ជា Word (.doc)"
          >
            <FileText className="w-4 h-4" />
            Word (.doc)
          </button>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="bg-indigo-50 hover:bg-indigo-100 transition-colors text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            បោះពុម្ព (Print)
          </button>
        </div>
      </div>

      {/* RENDER SUB-TAB 1: RANKINGS LIST */}
      {activeSubTab === 'rankList' && (
        <div className="space-y-6">
          {/* Options and Layout selectors (1 Row vs 2 Rows) */}
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between no-print text-sm">
            <span className="text-gray-500 text-xs font-semibold flex items-center gap-1">
              <Sliders className="w-4 h-4 text-indigo-500" />
              របៀបបង្ហាញតារាងពិន្ទុ និងចំណាត់ថ្នាក់៖
            </span>
            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-100">
              <button
                onClick={() => setRowLayout('1row')}
                className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer ${
                  rowLayout === '1row'
                    ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                បង្ហាញបែប ១ជួរ (Compact - 1 Row)
              </button>
              <button
                onClick={() => setRowLayout('2rows')}
                className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer ${
                  rowLayout === '2rows'
                    ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                បង្ហាញបែប ២ជួរ (Detailed - 2 Rows)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
            {/* Header for printing */}
            <div className="hidden print:block text-center space-y-2 mb-6">
              <h1 className="font-moul text-lg text-gray-900 uppercase">ព្រះរាជាណាចក្រកម្ពុជា</h1>
              <h2 className="font-moul text-sm text-gray-900">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
              <div className="w-32 h-0.5 bg-gray-300 mx-auto mt-1" />
              <p className="font-sans text-sm font-bold text-gray-700 mt-3">
                តារាងចំណាត់ថ្នាក់ និងផលពិន្ទុប្រឡងសិស្សប្រចាំ៖{' '}
                <span className="underline font-bold">
                  {PERIODS.find((p) => p.value === selectedPeriod)?.labelKh}
                </span>
              </p>
            </div>

            <div className="overflow-x-auto">
              {rankedStudents.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-medium">មិនមានទិន្នន័យពិន្ទុសម្រាប់ខែនេះទេ។</p>
                  <p className="text-xs text-gray-400 mt-1">សូមប្រាកដថាអ្នកបានបញ្ចូលពិន្ទុក្នុងផ្ទាំង &ldquo;បញ្ចូលពិន្ទុ&rdquo; ជាមុនសិន។</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm print:text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 print:bg-gray-100 print:border-black">
                      <th className="px-4 py-4 text-center w-16">ចំណាត់ថ្នាក់</th>
                      <th className="px-4 py-4">អត្តសញ្ញាណ</th>
                      <th className="px-4 py-4">ឈ្មោះសិស្ស (សរុបប្រុស-ស្រី)</th>
                      <th className="px-4 py-4 text-center">ភេទ</th>
                      <th className="px-4 py-4 text-center bg-green-50/20">ភាសាខ្មែរ</th>
                      <th className="px-4 py-4 text-center bg-blue-50/20">គណិតវិទ្យា</th>
                      <th className="px-4 py-4 text-center bg-orange-50/20">វិទ្យាសាស្ត្រ</th>
                      <th className="px-4 py-4 text-center bg-purple-50/20">សិក្សាសង្គម</th>
                      <th className="px-4 py-4 text-center bg-rose-50/20 font-medium">អប់រំកាយ/សិល្បៈ</th>
                      <th className="px-4 py-4 text-center text-indigo-700 font-bold bg-indigo-50/30">សរុបពិន្ទុ</th>
                      <th className="px-4 py-4 text-center text-indigo-900 font-extrabold bg-indigo-50/50">មធ្យមភាគ</th>
                      <th className="px-4 py-4 text-center text-indigo-650 no-print">និទ្ទេស</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 print:divide-black">
                    {rankedStudents.map((rs, idx) => {
                      const mention = getMention(rs.stats.average);
                      const isTop3 = rs.stats.rank <= 3;

                      return (
                        <React.Fragment key={rs.student.id}>
                          {/* ROW 1: PRIMARY GENERAL SCORE ENTRY */}
                          <tr className={`hover:bg-gray-50/30 transition-colors ${
                            isTop3 ? 'bg-amber-50/20' : ''
                          }`}>
                            <td className="px-4 py-3 text-center">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs mx-auto ${
                                rs.stats.rank === 1
                                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                                  : rs.stats.rank === 2
                                  ? 'bg-slate-100 text-slate-800 ring-2 ring-slate-300'
                                  : rs.stats.rank === 3
                                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                  : 'text-gray-500'
                              }`}>
                                {rs.stats.rank}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-xs text-gray-400">
                              {rs.student.id}
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                              {rs.student.nameKh}
                              <span className="block font-mono text-[10px] text-gray-400 group-hover:text-indigo-600 transition-colors uppercase font-normal">{rs.student.nameEn}</span>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rs.student.gender === 'ស្រី'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                  : 'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {rs.student.gender}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-700">
                              {rs.scores.khmer.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-700">
                              {rs.scores.math.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-700">
                              {rs.scores.science.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-700">
                              {rs.scores.social.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-medium text-gray-700">
                              {rs.scores.artsPE.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center bg-indigo-50/10 text-indigo-700 font-mono font-bold text-sm">
                              {rs.stats.sum.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center bg-indigo-50/20 text-indigo-950 font-mono font-black text-sm">
                              {rs.stats.average.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center no-print whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                rs.stats.average >= 8.0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : rs.stats.average >= 6.5
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : rs.stats.average >= 5.0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                                {mention}
                              </span>
                            </td>
                          </tr>

                          {/* ROW 2: DETAILED SECONDARY META (EXHIBITED ONLY IF 2 ROWS MODE IS ON) */}
                          {rowLayout === '2rows' && (
                            <tr className={`bg-gray-50/30 ${isTop3 ? 'bg-amber-50/10' : ''} border-b border-gray-100`}>
                              <td colSpan={12} className="px-8 py-2 text-xs text-gray-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-1.5 gap-x-6 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>
                                      <strong>ទីកន្លែងកំណើត៖</strong> {rs.student.pob || '—'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>
                                      <strong>អាណាព្យាបាល៖</strong> {rs.student.fatherName || rs.student.motherName || '—'} {rs.student.phoneNumber ? `(${rs.student.phoneNumber})` : ''}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'honorBoard' && (
        <div className="space-y-8">
          {topStudents.length === 0 ? (
            <div className="bg-white p-12 text-center text-gray-500 rounded-2xl border border-gray-100">
              <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p>មិនមានទិន្នន័យចំណាត់ថ្នាក់ខ្ពស់សម្រាប់ខែនេះទេ។</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Traditional podium container */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden print:bg-white print:text-slate-900 print:shadow-none print:p-4 border-2 border-indigo-900/20 print:border-none">
                {/* Decorative background vectors for web */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full no-print" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 blur-3xl rounded-full no-print" />

                {/* Header Section */}
                <div className="text-center space-y-3 mb-12 max-w-2xl mx-auto border-b border-white/10 pb-6 print:border-black/25 print:mb-8">
                  <div className="inline-flex bg-amber-400/20 text-amber-300 border border-amber-400/20 px-4 py-1 rounded-full text-xs uppercase font-extrabold tracking-wider mb-2 no-print">
                    <Sparkles className="w-3.5 h-3.5 animate-spin mr-1.5 text-amber-400" /> 
                    តារាងកិត្តិយសសិស្សឆ្នើមទូទាំងថ្នាក់ (Class Honor Roll - Top 5)
                  </div>
                  <h3 className="font-moul text-lg sm:text-xl text-amber-400 print:text-indigo-950 leading-relaxed uppercase">
                    សិស្សឆ្នើមដែលមានស្នាដៃរៀនសូត្រខ្ពស់បំផុតទាំង ៥ រូប
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-indigo-200 print:text-gray-650 font-bold">
                    ប្រចាំខែ៖ <span className="text-white print:text-indigo-950 underline font-bold">{PERIODS.find((p) => p.value === selectedPeriod)?.labelKh}</span> • ថ្នាក់រៀន៖ <span className="text-white print:text-indigo-950 font-mono font-bold">{students[0]?.gradeClass || 'ថ្នាក់ទី ៥ អា'}</span> • គ្រូបន្ទុកថ្នាក់៖ <span className="text-white print:text-indigo-950 font-bold">{students[0]?.classTeacher || 'កែវ ច័ន្ទតារា'}</span>
                  </p>
                </div>

                {/* TOP 1, 2, 3 PODIUM - Grid for Podium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-4 items-end print:gap-4">
                  
                  {/* SECOND PLACE (SILVER medal) - Left */}
                  {topStudents[1] ? (
                    <div className="order-2 md:order-1 bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-4 shadow-lg hover:bg-white/10 transition-all print:text-gray-900 print:border-slate-300 print:bg-slate-50 flex flex-col justify-center items-center">
                      <div className="relative">
                        {/* Frame Wrapper */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-slate-350 via-slate-100 to-slate-400 shadow-md">
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                            <img
                              src={topStudents[1].student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[1].student.nameEn || topStudents[1].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                              alt={topStudents[1].student.nameKh}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[1].student.nameEn || topStudents[1].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                              }}
                            />
                          </div>
                        </div>
                        {/* Rank Badge */}
                        <span className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-300 text-slate-900 ring-2 ring-white font-mono font-black rounded-full flex items-center justify-center text-sm shadow-md">
                          2
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-300 print:text-slate-500 font-extrabold uppercase bg-slate-500/20 px-2 py-0.5 rounded-full">
                          ចំណាត់ថ្នាក់ទី ២
                        </span>
                        <h4 className="font-extrabold text-white text-base print:text-gray-900">{topStudents[1].student.nameKh}</h4>
                        <p className="font-mono text-xs text-indigo-300 uppercase print:text-gray-500">{topStudents[1].student.nameEn}</p>
                      </div>

                      {/* Score Summary */}
                      <div className="bg-slate-500/20 text-slate-100 border border-slate-400/20 px-4 py-1.5 rounded-xl print:bg-slate-200/50 print:text-slate-800 print:border-slate-300 w-full text-center">
                        <p className="text-[10px] font-bold text-slate-300 print:text-slate-600">មធ្យមភាគពិន្ទុ</p>
                        <strong className="font-mono text-base font-black text-slate-200 print:text-slate-900">{topStudents[1].stats.average.toFixed(2)}</strong>
                      </div>

                      {/* Subject Scores Breakdown */}
                      <div className="w-full text-left text-[11px] space-y-1 bg-white/5 p-3 rounded-xl border border-white/5 print:bg-white print:border-slate-200">
                        <p className="text-[10px] font-medium text-indigo-300 print:text-slate-500 text-center uppercase tracking-wider border-b border-white/5 print:border-slate-200 pb-1 mb-1.5">គំនូរបូកពិន្ទុមុខវិជ្ជា</p>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">ភាសាខ្មែរ:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[1].scores.khmer.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">គណិតវិទ្យា:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[1].scores.math.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">វិទ្យាសាស្ត្រ:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[1].scores.science.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-[10px] italic text-indigo-200/80 print:text-gray-550 line-clamp-2 mt-1">
                        &ldquo;{getResultComments(topStudents[1].stats.average)}&rdquo;
                      </p>
                    </div>
                  ) : null}

                  {/* FIRST PLACE (GOLD trophy) - Center - Highest Elevation & Largest Card */}
                  {topStudents[0] ? (
                    <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 to-slate-900 p-8 rounded-3xl text-center space-y-5 shadow-2xl border-2 border-amber-400 scale-105 relative print:text-gray-900 print:border-amber-500 print:bg-amber-50/25 flex flex-col justify-center items-center">
                      {/* Premium Top label */}
                      <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-4 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <Trophy className="w-3.5 h-3.5 fill-current" /> សិស្សពូកែលេខ ១ (TOP 1)
                      </div>

                      <div className="relative mt-2">
                        {/* Elegant Frame Wrapper */}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-600 shadow-xl ring-4 ring-amber-400/20 animate-pulse">
                          <div className="w-full h-full rounded-full overflow-hidden bg-amber-50 border-3 border-white">
                            <img
                              src={topStudents[0].student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[0].student.nameEn || topStudents[0].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                              alt={topStudents[0].student.nameKh}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[0].student.nameEn || topStudents[0].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                              }}
                            />
                          </div>
                        </div>
                        {/* Gold Crown Trophy Icon overlay */}
                        <span className="absolute -top-2.5 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full ring-2 ring-white shadow-lg animate-bounce">
                          <Trophy className="w-4 h-4 fill-current text-indigo-950" />
                        </span>
                        {/* Rank Badge */}
                        <span className="absolute -bottom-1 -right-1 w-9 h-9 bg-amber-400 text-slate-950 ring-4 ring-white font-mono font-black rounded-full flex items-center justify-center text-base shadow-md">
                          1
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-300 print:text-amber-800 font-extrabold uppercase bg-amber-400/25 px-3 py-0.5 rounded-full">
                          សិស្សឆ្នើមលេខរៀនលេចធ្លោ
                        </span>
                        <h4 className="font-moul text-sm sm:text-base text-amber-300 print:text-indigo-950 leading-relaxed">{topStudents[0].student.nameKh}</h4>
                        <p className="font-mono text-xs text-amber-100 uppercase print:text-gray-550 font-bold">{topStudents[0].student.nameEn}</p>
                      </div>

                      {/* Score Summary */}
                      <div className="text-slate-950 px-5 py-2 rounded-2xl shadow-md flex flex-col items-center justify-center w-full bg-amber-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900">មធ្យមភាគពិន្ទុ</span>
                        <strong className="font-mono text-lg font-black">{topStudents[0].stats.average.toFixed(2)}</strong>
                      </div>

                      {/* Subject Scores Breakdown */}
                      <div className="w-full text-left text-xs space-y-1 bg-white/5 p-3.5 rounded-xl border border-white/5 print:bg-white print:border-slate-200">
                        <p className="text-[10px] font-bold text-amber-300 print:text-amber-800 text-center uppercase tracking-wider border-b border-white/5 print:border-slate-200 pb-1 mb-2">គំនូរបូកពិន្ទុមុខវិជ្ជា</p>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">ភាសាខ្មែរ:</span>
                          <span className="font-mono font-black text-amber-300 print:text-slate-900">{topStudents[0].scores.khmer.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">គណិតវិទ្យា:</span>
                          <span className="font-mono font-black text-amber-300 print:text-slate-900">{topStudents[0].scores.math.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">វិទ្យាសាស្ត្រ:</span>
                          <span className="font-mono font-black text-amber-300 print:text-slate-900">{topStudents[0].scores.science.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-[11px] italic text-amber-100/90 print:text-slate-700 font-medium leading-relaxed">
                        &ldquo;{getResultComments(topStudents[0].stats.average)}&rdquo;
                      </p>
                    </div>
                  ) : null}

                  {/* THIRD PLACE (BRONZE medal) - Right */}
                  {topStudents[2] ? (
                    <div className="order-3 bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-4 shadow-lg hover:bg-white/10 transition-all print:text-gray-900 print:border-slate-300 print:bg-slate-50 flex flex-col justify-center items-center">
                      <div className="relative">
                        {/* Frame Wrapper */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-amber-700 via-orange-100 to-amber-900 shadow-md">
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                            <img
                              src={topStudents[2].student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[2].student.nameEn || topStudents[2].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                              alt={topStudents[2].student.nameKh}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[2].student.nameEn || topStudents[2].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                              }}
                            />
                          </div>
                        </div>
                        {/* Rank Badge */}
                        <span className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-600 text-white ring-2 ring-white font-mono font-black rounded-full flex items-center justify-center text-sm shadow-md">
                          3
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-400 print:text-amber-800 font-extrabold uppercase bg-amber-600/20 px-2 py-0.5 rounded-full">
                          ចំណាត់ថ្នាក់ទី ៣
                        </span>
                        <h4 className="font-extrabold text-white text-base print:text-gray-900">{topStudents[2].student.nameKh}</h4>
                        <p className="font-mono text-xs text-indigo-300 uppercase print:text-gray-500">{topStudents[2].student.nameEn}</p>
                      </div>

                      {/* Score Summary */}
                      <div className="bg-amber-800/20 text-amber-300 border border-amber-600/25 px-4 py-1.5 rounded-xl print:bg-amber-100/40 print:text-amber-850 print:border-amber-300 w-full text-center">
                        <p className="text-[10px] font-bold text-amber-400 print:text-amber-700">មធ្យមភាគពិន្ទុ</p>
                        <strong className="font-mono text-sm font-black text-amber-300 print:text-amber-900">{topStudents[2].stats.average.toFixed(2)}</strong>
                      </div>

                      {/* Subject Scores Breakdown */}
                      <div className="w-full text-left text-[11px] space-y-1 bg-white/5 p-3 rounded-xl border border-white/5 print:bg-white print:border-slate-200">
                        <p className="text-[10px] font-medium text-indigo-300 print:text-slate-500 text-center uppercase tracking-wider border-b border-white/5 print:border-slate-200 pb-1 mb-1.5">គំនូរបូកពិន្ទុមុខវិជ្ជា</p>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">ភាសាខ្មែរ:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[2].scores.khmer.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">គណិតវិទ្យា:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[2].scores.math.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 print:text-gray-500 font-medium">វិទ្យាសាស្ត្រ:</span>
                          <span className="font-mono font-bold text-gray-200 print:text-gray-800">{topStudents[2].scores.science.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-[10px] italic text-indigo-200/80 print:text-gray-550 line-clamp-2 mt-1">
                        &ldquo;{getResultComments(topStudents[2].stats.average)}&rdquo;
                      </p>
                    </div>
                  ) : null}

                </div>

                {/* NEW COMPLEMENT: THE GRID OF 4TH AND 5TH POSITION WITH PORTRAITS */}
                <div className="mt-12 max-w-4xl mx-auto border-t border-white/10 pt-8 print:border-black/15">
                  <h4 className="text-center font-bold text-xs sm:text-sm text-indigo-200 print:text-indigo-900 mb-6 uppercase tracking-wider">
                    សិស្សឆ្នើមលេខរៀងទី ៤ និងទី ៥
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* FOURTH PLACE (Teal Shield/Ribbon) */}
                    {topStudents[3] ? (
                      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 hover:bg-white/10 transition-all print:text-gray-900 print:border-slate-200 print:bg-slate-50">
                        <div className="relative shrink-0">
                          {/* Image frame */}
                          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-teal-500 via-teal-100 to-teal-650 shadow-md">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                              <img
                                src={topStudents[3].student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[3].student.nameEn || topStudents[3].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                                alt={topStudents[3].student.nameKh}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[3].student.nameEn || topStudents[3].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                                }}
                              />
                            </div>
                          </div>
                          {/* Rank badge */}
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-500 text-white font-mono font-black rounded-full flex items-center justify-center text-[10px] ring-2 ring-white shadow-xs">
                            4
                          </span>
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div>
                            <span className="text-[9px] text-teal-300 font-black uppercase bg-teal-500/20 px-2 py-0.5 rounded-full print:text-teal-700">
                              ចំណាត់ថ្នាក់ទី ៤
                            </span>
                            <h5 className="font-bold text-white text-sm print:text-gray-900 mt-1">{topStudents[3].student.nameKh}</h5>
                            <p className="font-mono text-[11px] text-indigo-300 uppercase print:text-gray-500">{topStudents[3].student.nameEn}</p>
                          </div>
                          
                          <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 flex items-center justify-between text-xs print:bg-white print:border-slate-200">
                            <span className="text-gray-400 print:text-gray-500 font-bold text-[10px]">មធ្យមភាគ៖</span>
                            <strong className="font-mono text-teal-300 print:text-indigo-900 font-black">{topStudents[3].stats.average.toFixed(2)}</strong>
                          </div>
                          <p className="text-[10px] italic text-indigo-200/80 print:text-gray-500 leading-tight">
                            &ldquo;{topStudents[3].student.gender === 'ស្រី' ? 'សិស្សស្រីប្រណិបតន៍ការសិក្សាល្អ។' : 'សិស្សប្រុសឧស្សាហ៍ព្យាយាមណាស់។'}&rdquo;
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {/* FIFTH PLACE (Purple Shield/Ribbon) */}
                    {topStudents[4] ? (
                      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 hover:bg-white/10 transition-all print:text-gray-900 print:border-slate-200 print:bg-slate-50">
                        <div className="relative shrink-0">
                          {/* Image frame */}
                          <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-purple-100 to-purple-650 shadow-md">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                              <img
                                src={topStudents[4].student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[4].student.nameEn || topStudents[4].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                                alt={topStudents[4].student.nameKh}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(topStudents[4].student.nameEn || topStudents[4].student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                                }}
                              />
                            </div>
                          </div>
                          {/* Rank badge */}
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 text-white font-mono font-black rounded-full flex items-center justify-center text-[10px] ring-2 ring-white shadow-xs">
                            5
                          </span>
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <div>
                            <span className="text-[9px] text-purple-300 font-black uppercase bg-purple-500/20 px-2 py-0.5 rounded-full print:text-purple-700">
                              ចំណាត់ថ្នាក់ទី ៥
                            </span>
                            <h5 className="font-bold text-white text-sm print:text-gray-900 mt-1">{topStudents[4].student.nameKh}</h5>
                            <p className="font-mono text-[11px] text-indigo-300 uppercase print:text-gray-500">{topStudents[4].student.nameEn}</p>
                          </div>
                          
                          <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 flex items-center justify-between text-xs print:bg-white print:border-slate-200">
                            <span className="text-gray-400 print:text-gray-500 font-bold text-[10px]">មធ្យមភាគ៖</span>
                            <strong className="font-mono text-purple-300 print:text-indigo-900 font-black">{topStudents[4].stats.average.toFixed(2)}</strong>
                          </div>
                          <p className="text-[10px] italic text-indigo-200/80 print:text-gray-500 leading-tight">
                            &ldquo;{topStudents[4].student.gender === 'ស្រី' ? 'សិស្សស្រីប្រណិបតន៍ការសិក្សាល្អ។' : 'សិស្សប្រុសឧស្សាហ៍ព្យាយាមណាស់។'}&rdquo;
                          </p>
                        </div>
                      </div>
                    ) : null}

                  </div>
                </div>

                {/* Signing sign-off lines */}
                <div className="hidden print:grid grid-cols-2 text-center text-xs font-sans mt-16 pt-8 border-t border-dashed border-gray-300 gap-10">
                  <div className="space-y-1.5">
                    <p>បានឃើញ និងឯកភាព</p>
                    <p className="font-moul text-[9px]">នាយកសាលា</p>
                    <div className="h-20" />
                    <p className="text-gray-400">....................................................</p>
                  </div>
                  <div className="space-y-1.5">
                    <p>ថ្ងៃព្រហស្បតិ៍ ៥រោច ខែជេស្ឋ ឆ្នាំមមី អដ្ឋស័ក</p>
                    <p>ត្រូវនឹងថ្ងៃទី០៤ ខែមិថុនា ឆ្នាំ២០២៦</p>
                    <p className="font-moul text-[9px]">គ្រូបន្ទុកថ្នាក់</p>
                    <div className="h-16" />
                    <p className="font-bold underline">{students[0]?.classTeacher || 'កែវ ច័ន្ទតារា'}</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
