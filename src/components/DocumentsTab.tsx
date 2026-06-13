import React, { useState } from 'react';
import { Student, SubjectScores, AcademicPeriod } from '../types';
import { 
  PERIODS, 
  SUBJECT_NAMES, 
  MONTH_LIST, 
  calculateRecordMetrics, 
  calculateSemester1Record, 
  calculateSemester2Record, 
  calculateFullAcademicSummary, 
  getMention, 
  getResultComments,
  getStudentAttendanceSummary,
  calculateRankings,
  exportToWord
} from '../utils';
import { BookOpen, UserCheck, GraduationCap, Printer, ChevronRight, User, Award, ShieldAlert, CheckCircle, FileText, CalendarCheck, Download, X, Eye, Sliders } from 'lucide-react';

interface DocumentsTabProps {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
  attendance: { [studentId: string]: { [month: string]: any } };
  classInfo: {
    gradeClass: string;
    academicYear: string;
    classTeacher: string;
    schoolName: string;
  };
}

export default function DocumentsTab({ students, scores, attendance, classInfo }: DocumentsTabProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [docType, setDocType] = useState<'tracker' | 'biography'>('tracker');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [printMargin, setPrintMargin] = useState<string>('15mm');
  const [printFontSize, setPrintFontSize] = useState<string>('12px');
  const [showPageBounds, setShowPageBounds] = useState<boolean>(true);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Calculate ranks and score aggregations
  const globalSummary = calculateFullAcademicSummary(students, scores);
  const studentSummary = globalSummary.find((s) => s.studentId === selectedStudentId);

  // Month rankings calculations
  const rankingsByPeriod = calculateRecordMetrics ? calculateFullAcademicSummary(students, scores) : [];

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleExportWord = () => {
    if (!selectedStudent) return;

    if (docType === 'tracker') {
      let monthlyTableRows = '';
      
      let wordHeadersHtml = '';
      SUBJECT_NAMES.forEach(sub => {
        wordHeadersHtml += `<th>${sub.labelKh}</th>`;
      });

      PERIODS.forEach((p) => {
        const periodKey = p.value;
        const periodScores = scores[selectedStudentId]?.[periodKey];
        const attRecord = attendance[selectedStudentId]?.[periodKey] || { excused: 0, unexcused: 0, late: 0 };
        const { sum, average } = calculateRecordMetrics(periodScores);
        const hasScoresEntered = !!scores[selectedStudentId]?.[periodKey];
        const rankNum = rankingsByPeriod && calculateRankings(students, scores)[periodKey]?.[selectedStudentId]?.rank || 0;

        let subjectScoresRowHtml = '';
        SUBJECT_NAMES.forEach(sub => {
          const val = periodScores?.[sub.value];
          subjectScoresRowHtml += `<td>${hasScoresEntered && val !== undefined ? val.toFixed(1) : '—'}</td>`;
        });

        monthlyTableRows += `
          <tr>
            <td style="text-align: left;"><b>${p.labelKh}</b> ${p.isExam ? '🏆' : ''}</td>
            ${subjectScoresRowHtml}
            <td><b>${hasScoresEntered ? sum.toFixed(1) : '—'}</b></td>
            <td><b>${hasScoresEntered ? average.toFixed(2) : '—'}</b></td>
            <td><b>${hasScoresEntered && rankNum > 0 ? rankNum : '—'}</b></td>
            <td>${!p.isExam && attRecord.excused > 0 ? attRecord.excused : '—'}</td>
            <td>${!p.isExam && attRecord.unexcused > 0 ? attRecord.unexcused : '—'}</td>
            <td>${!p.isExam && attRecord.late > 0 ? attRecord.late : '—'}</td>
            <td class="text-left" style="font-size: 10px; font-weight: normal; font-style: italic;">${hasScoresEntered ? getResultComments(average) : '—'}</td>
          </tr>
        `;
      });

      const docBody = `
        <div class="moul-title" style="font-size: 16px; margin-bottom: 5px; text-align: center;">ព្រះរាជាណាចក្រកម្ពុជា</div>
        <div class="moul-title" style="font-size: 13px; margin-bottom: 10px; text-align: center;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
        <center><div style="width: 100px; border-bottom: 1px dashed #404040; margin-bottom: 20px;"></div></center>
        
        <table style="border:none; margin-bottom: 10px; width: 100%;">
          <tr style="border:none;">
            <td style="border:none; text-align: left; font-size:12px;"><b>សាលាបឋមសិក្សា៖</b> ${classInfo.schoolName || 'គំរូពញាក្រែក'}</td>
            <td style="border:none; text-align: right; font-size:12px;"><b>ថ្នាក់រៀន៖</b> ${classInfo.gradeClass || 'ថ្នាក់ទី ៥ អា'}</td>
          </tr>
          <tr style="border:none;">
            <td style="border:none; text-align: left; font-size:12px;"><b>គ្រូទទួលបន្ទុក៖</b> ${classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</td>
            <td style="border:none; text-align: right; font-size:12px;"><b>ឆ្នាំសិក្សា៖</b> ${classInfo.academicYear || '២០២៤-២០២៥'}</td>
          </tr>
        </table>

        <h2 style="font-size: 14px; text-align: center; color: #1e3a8a; margin-top: 10px; margin-bottom: 20px;">
          សៀវភៅតាមដានការសិក្សា និងការអប់រំសិស្ស (STUDENT GRADEBOOK REPORT)
        </h2>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <table style="border: none; width: 100%; margin: 0;">
            <tr style="border: none;">
              <td style="border: none; text-align: left;"><b>ឈ្មោះសិស្សខ្មែរ៖</b> ${selectedStudent.nameKh}</td>
              <td style="border: none; text-align: left;"><b>អក្សរឡាតាំង៖</b> ${selectedStudent.nameEn.toUpperCase()}</td>
              <td style="border: none; text-align: left;"><b>ភេទ / អត្តសញ្ញាណ៖</b> ${selectedStudent.gender} (${selectedStudent.id})</td>
              <td style="border: none; text-align: left;"><b>ថ្ងៃខែឆ្នាំកំណើត៖</b> ${selectedStudent.dob || '—'}</td>
            </tr>
          </table>
        </div>

        <table>
          <thead>
            <tr>
              <th rowspan="2">រដូវកាលសិក្សា</th>
              <th colspan="${SUBJECT_NAMES.length}">ពិន្ទុតាមមុខវិជ្ជា (Subject Scores)</th>
              <th rowspan="2">សរុប</th>
              <th rowspan="2">មធ្យមភាគ</th>
              <th rowspan="2">ចំណាត់លេខ</th>
              <th colspan="3">អវត្តមាន/យឺត</th>
              <th rowspan="2">សេចក្តីសង្កេត និងការវាយតម្លៃរបស់អ្នកគ្រូ</th>
            </tr>
            <tr>
              ${wordHeadersHtml}
              <th>ច្បាប់</th>
              <th>ឥតច្បាប់</th>
              <th>យឺត</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyTableRows}
            <tr style="background-color: #e0f2fe; font-weight: bold;">
              <td style="text-align: left;"><b>ឆមាសទី១</b></td>
              <td colspan="${SUBJECT_NAMES.length}">—</td>
              <td>—</td>
              <td><b>${studentSummary ? studentSummary.s1Avg.toFixed(2) : '0.00'}</b></td>
              <td><b>${studentSummary && studentSummary.s1Rank > 0 ? studentSummary.s1Rank : '—'}</b></td>
              <td colspan="3">—</td>
              <td class="text-left"><b>និទ្ទេស៖</b> ${getMention(studentSummary?.s1Avg || 0)}</td>
            </tr>
            <tr style="background-color: #e0f2fe; font-weight: bold;">
              <td style="text-align: left;"><b>ឆមាសទី២</b></td>
              <td colspan="${SUBJECT_NAMES.length}">—</td>
              <td>—</td>
              <td><b>${studentSummary ? studentSummary.s2Avg.toFixed(2) : '0.00'}</b></td>
              <td><b>${studentSummary && studentSummary.s2Rank > 0 ? studentSummary.s2Rank : '—'}</b></td>
              <td colspan="3">—</td>
              <td class="text-left"><b>និទ្ទេស៖</b> ${getMention(studentSummary?.s2Avg || 0)}</td>
            </tr>
            <tr style="background-color: #fef3c7; font-weight: bold;">
              <td style="text-align: left;"><b>លទ្ធផលប្រចាំឆ្នាំ</b></td>
              <td colspan="${SUBJECT_NAMES.length}">—</td>
              <td>—</td>
              <td><b>${studentSummary ? studentSummary.yearEndAvg.toFixed(2) : '0.00'}</b></td>
              <td><b>${studentSummary && studentSummary.yearEndRank > 0 ? studentSummary.yearEndRank : '—'}</b></td>
              <td colspan="3">—</td>
              <td class="text-left" style="color: #92400e;"><b>លទ្ធផល៖</b> ${studentSummary && studentSummary.yearEndAvg >= 5.0 ? 'ឡើងថ្នាក់' : 'ត្រួតថ្នាក់'} (${getMention(studentSummary?.yearEndAvg || 0)})</td>
            </tr>
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
              <p><b>${classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</b></p>
            </td>
          </tr>
        </table>
      `;

      exportToWord(`សៀវភៅតាមដាន_${selectedStudent.nameKh}.doc`, `សៀវភៅតាមដាន_${selectedStudent.nameKh}`, docBody);
    } else {
      const docBody = `
        <div class="moul-title" style="font-size: 16px; margin-bottom: 5px; text-align: center;">ព្រះរាជាណាចក្រកម្ពុជា</div>
        <div class="moul-title" style="font-size: 13px; margin-bottom: 10px; text-align: center;">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
        <center><div style="width: 100px; border-bottom: 1px dashed #404040; margin-bottom: 20px;"></div></center>
        
        <h2 style="font-size: 14px; text-align: center; color: #1e3a8a; margin-top: 10px; margin-bottom: 20px;">
          សៀវភៅសិក្ខាគារិក និងប្រវត្តិរូបសិស្ស (CUMULATIVE STUDENT DOSSIER)
        </h2>

        <h3 class="moul-title" style="font-size: 12px; text-align: left; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 20px;">I. ប្រវត្តិផ្ទាល់ខ្លួនសិស្ស (STUDENT BIOGRAPHY)</h3>
        <table style="width: 100%; border: 1px solid #9ca3af; margin-top: 10px;">
          <tr>
            <td style="text-align: left; width: 30%; background-color: #f3f4f6; font-weight: bold;">ឈ្មោះខ្មែរ៖</td>
            <td style="text-align: left; width: 70%;">${selectedStudent.nameKh}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">អក្សរឡាតាំង៖</td>
            <td style="text-align: left; font-family: monospace; text-transform: uppercase;">${selectedStudent.nameEn}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">ភេទ៖</td>
            <td style="text-align: left;">${selectedStudent.gender}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">អត្តសញ្ញាណ (ID)៖</td>
            <td style="text-align: left; font-family: monospace;">${selectedStudent.id}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">ថ្ងៃខែឆ្នាំកំណើត៖</td>
            <td style="text-align: left; font-family: monospace;">${selectedStudent.dob || '—'}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">ទីកន្លែងកំណើត៖</td>
            <td style="text-align: left;">${selectedStudent.pob || '—'} (ខេត្ត៖ ${selectedStudent.pobProvince || '—'})</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">អាសយដ្ឋានបច្ចុប្បន្ន៖</td>
            <td style="text-align: left;">${selectedStudent.address || '—'}</td>
          </tr>
        </table>

        <h3 class="moul-title" style="font-size: 12px; text-align: left; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 20px;">II. ព័ត៌មានអាណាព្យាបាល (PARENTAL INFOMATION)</h3>
        <table style="width: 100%; border: 1px solid #9ca3af; margin-top: 10px;">
          <tr>
            <td style="text-align: left; width: 35%; background-color: #f3f4f6; font-weight: bold;">ឈ្មោះឪពុក៖</td>
            <td style="text-align: left; width: 65%;">${selectedStudent.fatherName || '—'}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">មុខរបរឪពុក៖</td>
            <td style="text-align: left;">${selectedStudent.fatherJob || '—'}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">ឈ្មោះម្តាយ៖</td>
            <td style="text-align: left;">${selectedStudent.motherName || '—'}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">មុខរបរម្តាយ៖</td>
            <td style="text-align: left;">${selectedStudent.motherJob || '—'}</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">លេខទូរស័ព្ទទំនាក់ទំនង៖</td>
            <td style="text-align: left; font-family: monospace;">${selectedStudent.phoneNumber || '—'}</td>
          </tr>
        </table>

        <h3 class="moul-title" style="font-size: 12px; text-align: left; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 20px;">III. របាយការណ៍សង្ខេបប្រចាំឆ្នាំសិក្សា</h3>
        <table style="width: 100%; border: 1px solid #9ca3af; margin-top: 10px;">
          <tr>
            <td style="text-align: left; width: 45%; background-color: #f3f4f6; font-weight: bold;">មធ្យមភាគឆមាសទី១៖</td>
            <td style="text-align: left; font-family: monospace; font-weight: bold;">${studentSummary ? studentSummary.s1Avg.toFixed(2) : '0.00'} (ចំណាត់ថ្នាក់៖ ${studentSummary && studentSummary.s1Rank > 0 ? studentSummary.s1Rank : '—'})</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">មធ្យមភាគឆមាសទី២៖</td>
            <td style="text-align: left; font-family: monospace; font-weight: bold;">${studentSummary ? studentSummary.s2Avg.toFixed(2) : '0.00'} (ចំណាត់ថ្នាក់៖ ${studentSummary && studentSummary.s2Rank > 0 ? studentSummary.s2Rank : '—'})</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">មធ្យមភាគប្រចាំឆ្នាំសិក្សា៖</td>
            <td style="text-align: left; font-family: monospace; font-weight: bold; color: #1953bb;">${studentSummary ? studentSummary.yearEndAvg.toFixed(2) : '0.00'} (ចំណាត់ថ្នាក់ប្រចាំឆ្នាំ៖ ${studentSummary && studentSummary.yearEndRank > 0 ? studentSummary.yearEndRank : '—'})</td>
          </tr>
          <tr>
            <td style="text-align: left; background-color: #f3f4f6; font-weight: bold;">លទ្ធផល និងការវាយតម្លៃ៖</td>
            <td style="text-align: left; font-weight: bold;">${studentSummary && studentSummary.yearEndAvg >= 5.0 ? 'ឡើងថ្នាក់ (PROMOTED)' : 'ត្រួតថ្នាក់ (RETAINED)'}</td>
          </tr>
        </table>

        <table class="footer-table" style="margin-top: 60px; border:none; width: 100%;">
          <tr style="border:none;">
            <td style="border:none; text-align: center; width: 50%;">
              <p>បានផ្ទៀងផ្ទាត់ និងឯកភាព</p>
              <p><b>នាយកសាលា</b></p>
              <br/><br/><br/><br/>
              <p>.........................................</p>
            </td>
            <td style="border:none; text-align: center; width: 50%;">
              <p>ធ្វើនៅថ្ងៃព្រហស្បតិ៍ ទី០៤ ខែមិថុនា ឆ្នាំ២០២៦</p>
              <p><b>គ្រូបន្ទុកថ្នាក់</b></p>
              <br/><br/><br/><br/>
              <p><b>${classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</b></p>
            </td>
          </tr>
        </table>
      `;

      exportToWord(`សិក្ខាគារិក_${selectedStudent.nameKh}.doc`, `សិក្ខាគារិក_${selectedStudent.nameKh}`, docBody);
    }
  };

  if (!selectedStudent) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500">
        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
        <p className="font-medium text-base">មិនមានព័ត៌មានសិស្សនៅក្នុងថ្នាក់នៅឡើយទេ</p>
        <p className="text-xs text-gray-400 mt-1">សូមបន្ថែមសិស្សជាមុនសិន។</p>
      </div>
    );
  }

  // Attendance summary
  const attSummary = getStudentAttendanceSummary(selectedStudentId, attendance);

  // Helper function to render high fidelity document content natively
  const renderDocumentContent = () => {
    if (docType === 'tracker') {
      return (
        <div id="print-report-card" className="space-y-8 text-left">
          {/* MoEYS Official header banner */}
          <div className="text-center space-y-2 pb-6 border-b border-gray-150">
            <h1 className="font-moul text-base text-gray-900 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h2 className="font-moul text-[11px] text-gray-900">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
            <div className="w-24 h-0.5 bg-gray-300 mx-auto mt-1" />
            
            <div className="flex justify-between items-center text-xs font-sans text-gray-600 pt-4 px-4">
              <div className="text-left space-y-1">
                <p>សាលាបឋមសិក្សា៖ <strong className="text-gray-900 font-semibold">{classInfo.schoolName || 'គំរូពញាក្រែក'}</strong></p>
                <p>គ្រូទទួលបន្ទុក៖ <strong className="text-gray-900 font-semibold">{classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</strong></p>
              </div>
              <div className="text-right space-y-1">
                <p>ថ្នាក់រៀន៖ <strong className="text-indigo-750 font-bold">{classInfo.gradeClass || 'ថ្នាក់ទី ៥ អា'}</strong></p>
                <p>ឆ្នាំសិក្សា៖ <strong className="text-gray-900 font-mono font-bold">{classInfo.academicYear || '២០២៤-២០២៥'}</strong></p>
              </div>
            </div>

            <div className="pt-2 text-center">
              <h3 className="font-moul text-sm text-indigo-900 leading-normal border border-double border-indigo-700/50 py-2.5 px-6 rounded-2xl inline-block bg-indigo-50/20">
                សៀវភៅតាមដានការសិក្សា និងការអប់រំសិស្ស (STUDENT GRADEBOOK REPORT)
              </h3>
            </div>
          </div>

          {/* Student metadata badge */}
          <div className="bg-slate-50 border border-gray-100/70 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-sans text-gray-650">
            <div>
              <p className="text-gray-400 font-medium font-sans">ឈ្មោះសិស្ស (Khmer)</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.nameKh}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium font-sans">អក្សរឡាតាំង (Latin)</p>
              <p className="text-sm font-bold uppercase text-gray-900 mt-1 font-mono">{selectedStudent.nameEn}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium font-sans">ភេទ / អត្តសញ្ញាណ</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {selectedStudent.gender} <span className="text-gray-400 text-xs font-mono font-medium">({selectedStudent.id})</span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-medium font-sans">ថ្ងៃខែឆ្នាំកំណើត</p>
              <p className="text-sm font-bold text-gray-900 mt-1 font-mono">{selectedStudent.dob || '—'}</p>
            </div>
          </div>

          {/* Big full year grade overview matrix */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-center font-semibold">
                  <th rowSpan={2} className="px-3 py-3 border-r border-gray-300 w-24">រដូវកាលសិក្សា</th>
                  <th colSpan={SUBJECT_NAMES.length} className="px-2 py-1.5 border-b border-r border-gray-300">ពិន្ទុតាមមុខវិជ្ជា (Subject Scores)</th>
                  <th rowSpan={2} className="px-2.5 py-3 border-r border-gray-300 w-16 text-indigo-750 font-bold bg-indigo-50/50">ពិន្ទុសរុប</th>
                  <th rowSpan={2} className="px-2.5 py-3 border-r border-gray-300 w-16 text-indigo-900 font-bold bg-indigo-50/10">មធ្យមភាគ</th>
                  <th rowSpan={2} className="px-2 py-3 border-r border-gray-300 w-12 text-gray-700 font-semibold">ចំណាត់ថ្នាក់</th>
                  <th colSpan={3} className="px-2 py-1.5 border-b border-r border-gray-300">អវត្តមាន/យឺត</th>
                  <th rowSpan={2} className="px-3 py-3 w-48 text-left font-semibold">សេចក្តីសង្កេត និងការវាយតម្លៃរបស់អ្នកគ្រូ</th>
                </tr>
                <tr className="bg-gray-550 text-gray-650 border-b border-gray-300 text-center font-semibold">
                  {SUBJECT_NAMES.map((sub) => (
                    <th key={sub.value} className="px-1 py-2 border-r border-gray-350 font-sans font-bold">
                      {sub.labelKh}
                    </th>
                  ))}
                  
                  <th className="px-1 py-2 border-r border-gray-300 bg-green-50/10 font-sans">ច្បាប់ (P)</th>
                  <th className="px-1 py-2 border-r border-gray-300 bg-rose-50/10 font-sans">ឥតច្បាប់ (A)</th>
                  <th className="px-1 py-2 border-r border-gray-300 bg-amber-50/10 font-sans">យឺត (L)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {/* Monthly rows */}
                {PERIODS.map((p) => {
                  const periodKey = p.value;
                  const periodScores = scores[selectedStudentId]?.[periodKey];
                  const attRecord = attendance[selectedStudentId]?.[periodKey] || { excused: 0, unexcused: 0, late: 0 };
                  
                  // Month calculations
                  const { sum, average } = calculateRecordMetrics(periodScores);
                  const hasScoresEntered = !!scores[selectedStudentId]?.[periodKey];

                  // Period custom rank helper
                  const rankNum = rankingsByPeriod && calculateRankings(students, scores)[periodKey]?.[selectedStudentId]?.rank || 0;

                  return (
                    <tr key={p.value} className={`text-center hover:bg-gray-50/50 ${p.isExam ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-3 py-2 text-left font-bold border-r border-gray-300 text-gray-805">
                        {p.labelKh} {p.isExam && '🏆'}
                      </td>

                      {/* Subject columns */}
                      {SUBJECT_NAMES.map((sub) => (
                        <td key={sub.value} className="px-1.5 py-2 border-r border-gray-300 font-mono font-medium text-gray-700">
                          {hasScoresEntered ? periodScores?.[sub.value]?.toFixed(1) : '—'}
                        </td>
                      ))}

                      {/* Sum & Average */}
                      <td className="px-2 py-2 border-r border-gray-300 font-mono text-indigo-700 text-xs font-bold bg-indigo-50/20">
                        {hasScoresEntered ? sum.toFixed(1) : '—'}
                      </td>
                      <td className="px-2 py-2 border-r border-gray-300 font-mono text-indigo-900 text-xs font-extrabold bg-indigo-50/40">
                        {hasScoresEntered ? average.toFixed(2) : '—'}
                      </td>

                      {/* Rank */}
                      <td className="px-1 py-2 border-r border-gray-300 font-mono font-extrabold text-xs text-gray-800">
                        {hasScoresEntered && rankNum > 0 ? rankNum : '—'}
                      </td>

                      {/* Attendance columns */}
                      <td className="px-1 py-2 border-r border-gray-300 font-mono text-xs text-green-700 bg-green-50/5">
                        {!p.isExam && attRecord.excused > 0 ? attRecord.excused : '—'}
                      </td>
                      <td className="px-1 py-2 border-r border-gray-300 font-mono text-xs text-rose-700 bg-rose-50/5">
                        {!p.isExam && attRecord.unexcused > 0 ? attRecord.unexcused : '—'}
                      </td>
                      <td className="px-1 py-2 border-r border-gray-300 font-mono text-xs text-amber-700 bg-amber-50/5">
                        {!p.isExam && attRecord.late > 0 ? attRecord.late : '—'}
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-2 text-left text-[10px] text-gray-500 italic max-w-xs leading-tight">
                        {hasScoresEntered ? getResultComments(average) : '—'}
                      </td>
                    </tr>
                  );
                })}

                {/* SEMESTER SUMMARY SECTIONS */}
                <tr className="bg-indigo-50/30 font-bold border-t-2 border-indigo-200">
                  <td className="px-3 py-2.5 text-left border-r border-gray-300 font-extrabold text-indigo-900 uppercase">
                    ឆមាសទី១ (Semester 1)
                  </td>
                  <td colSpan={SUBJECT_NAMES.length} className="px-2 py-2.5 border-r border-gray-300 text-gray-400 italic font-normal text-left text-[10px]">
                    មធ្យមភាគរួម calculated: (មធ្យមភាគ៥ខែ + ប្រឡង)/២
                  </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center font-mono"> — </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center text-indigo-950 font-mono font-black border-2 border-indigo-400 bg-indigo-50">
                    {studentSummary ? studentSummary.s1Avg.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center text-gray-900 font-mono font-black">
                    {studentSummary && studentSummary.s1Rank > 0 ? studentSummary.s1Rank : '—'}
                  </td>
                  <td colSpan={3} className="px-2 py-2.5 border-r border-gray-300 text-center font-normal italic text-[10px] text-gray-500">
                    —
                  </td>
                  <td className="px-3 py-2.5 text-left font-bold text-xs text-indigo-900 leading-normal">
                    លទ្ធផលប្រុងប្រយ័ត្ន៖ {getMention(studentSummary?.s1Avg || 0)}
                  </td>
                </tr>

                <tr className="bg-indigo-50/40 font-bold border-t border-indigo-200">
                  <td className="px-3 py-2.5 text-left border-r border-gray-300 font-extrabold text-indigo-900 uppercase">
                    ឆមាសទី២ (Semester 2)
                  </td>
                  <td colSpan={SUBJECT_NAMES.length} className="px-2 py-2.5 border-r border-gray-300 text-gray-400 italic font-normal text-left text-[10px]">
                    មធ្យមភាគរួម calculated: (មធ្យមភាគ៣ខែ + ប្រឡង)/២
                  </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center font-mono"> — </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center text-indigo-950 font-mono font-black border-2 border-indigo-400 bg-indigo-50">
                    {studentSummary ? studentSummary.s2Avg.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-2 py-2.5 border-r border-gray-300 text-center text-gray-900 font-mono font-black">
                    {studentSummary && studentSummary.s2Rank > 0 ? studentSummary.s2Rank : '—'}
                  </td>
                  <td colSpan={3} className="px-2 py-2.5 border-r border-gray-300 text-center font-normal italic text-[10px] text-gray-500">
                    —
                  </td>
                  <td className="px-3 py-2.5 text-left font-bold text-xs text-indigo-950 leading-normal">
                    លទ្ធផលប្រុងប្រយ័ត្ន៖ {getMention(studentSummary?.s2Avg || 0)}
                  </td>
                </tr>

                {/* FINAL YEAR END ACADEMIC RECORD */}
                <tr className="bg-gradient-to-r from-amber-50 to-amber-100 font-bold border-t-2 border-b-2 border-amber-300">
                  <td className="px-3 py-3 text-left border-r border-gray-300 font-extrabold text-amber-950 flex items-center gap-1">
                    <Award className="w-4 h-4 text-amber-600" /> ដំណាច់ឆ្នាំ (Year End)
                  </td>
                  <td colSpan={SUBJECT_NAMES.length} className="px-2 py-3 border-r border-gray-300 text-amber-900 italic font-semibold text-left text-[10px]">
                    រូបមន្ត MoEYS: (ឆមាសទី១ + ឆមាសទី២) / ២
                  </td>
                  <td className="px-2 py-3 border-r border-gray-300 text-center font-mono"> — </td>
                  <td className="px-2 py-3 border-r border-amber-350 text-center text-amber-950 font-mono font-black text-sm border-2 border-amber-400 bg-amber-200 shadow-xs">
                    {studentSummary ? studentSummary.yearEndAvg.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-2 py-3 border-r border-gray-300 text-center text-amber-900 font-mono font-black text-sm">
                    {studentSummary && studentSummary.yearEndRank > 0 ? studentSummary.yearEndRank : '—'}
                  </td>
                  <td colSpan={3} className="px-2 py-3 border-r border-gray-300 text-center font-medium font-sans text-xs bg-white/40">
                    <div className="flex flex-col space-y-0.5 text-[9px] text-gray-500 text-left">
                      <span>ច្បាប់សរុប៖ <strong>{attSummary.totalExcused}</strong></span>
                      <span>ឥតច្បាប់៖ <strong className="text-rose-600">{attSummary.totalUnexcused}</strong></span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-left font-sans font-extrabold text-xs text-indigo-950">
                    លទ្ធផលរួម៖{' '}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (studentSummary?.yearEndAvg || 0) >= 5.0
                        ? 'bg-green-600 text-white'
                        : 'bg-red-650 text-white'
                    }`}>
                      {(studentSummary?.yearEndAvg || 0) >= 5.0 ? 'ជាប់ (Passed) ✅' : 'ធ្លាក់ (Failed) ❌'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* School stamps and legal signatures rules */}
          <div className="grid grid-cols-3 text-center text-xs font-sans mt-12 pt-10 gap-6 border-t border-dashed border-gray-150">
            <div className="space-y-1">
              <p>សេចក្តីឯកភាព និងចុះហត្ថលេខា</p>
              <p className="font-moul text-[10px] text-gray-800">អាណាព្យាបាលសិស្ស</p>
              <div className="h-16" />
              <p className="text-gray-400">....................................................</p>
            </div>

            <div className="space-y-1">
              <p>បានឃើញ និងយល់ព្រម</p>
              <p className="font-moul text-[10px] text-gray-850">នាយកសាលាបឋមសិក្សា</p>
              <div className="h-20" />
              <p className="text-gray-400">....................................................</p>
            </div>

            <div className="space-y-1">
              <p>រាជធានីភ្នំពេញ ថ្ងៃទី០៤ ខែមិថុនា ឆ្នាំ២០២៦</p>
              <p className="font-moul text-[10px] text-gray-855">គ្រូបន្ទុកថ្នាក់</p>
              <div className="h-16" />
              <p className="font-bold text-gray-900 underline block">{classInfo.classTeacher}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div id="print-biography" className="space-y-8 text-left">
          {/* Cambodian coat of arms headers */}
          <div className="text-center space-y-2 pb-6 border-b border-gray-305">
            <h1 className="font-moul text-base text-gray-900">ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h2 className="font-moul text-[11px] text-gray-900">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
            <div className="w-24 h-0.5 bg-gray-300 mx-auto mt-1" />
            <p className="text-xs font-sans text-gray-500">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
            
            <div className="pt-4 text-center">
              <h3 className="font-moul text-sm text-indigo-950 uppercase border-2 border-indigo-900 py-3 px-8 rounded-xl inline-block bg-indigo-50/10">
                សៀវភៅសិក្ខាគារិក (STUDENT IDENTITY CUMULATIVE RECORD)
              </h3>
            </div>
          </div>

          {/* Core identity cards block with passport photo placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Photo placeholder column */}
            <div className="md:col-span-1 border-2 border-dashed border-gray-300 p-6 rounded-2xl flex flex-col justify-center items-center text-center space-y-3 bg-slate-50 relative h-64">
              <div className="w-28 h-36 border border-gray-300 bg-white shadow-xs rounded-md flex items-center justify-center text-gray-400 text-[10px] overflow-hidden">
                <User className="w-10 h-10 text-gray-200" />
                <span className="absolute bottom-20 text-[8px] font-bold text-gray-400/80">រូបថត ៤ x ៦</span>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-900 font-mono text-xs">{selectedStudent.id}</p>
                <p className="text-[10px] text-gray-500">សៀវភៅលេខ៖ ៥សខ-២០២៤</p>
              </div>
            </div>

            {/* Data attributes column */}
            <div className="md:col-span-3 space-y-5">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> ១. ជីវប្រវត្តសង្ខេបរបស់សិស្ស (STUDENT BIOGRAPHY BACKGROUND)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-700">
                <div className="space-y-1">
                  <p className="text-gray-400 font-semibold">ឈ្មោះខ្មែរ (Khmer Name)៖</p>
                  <p className="text-sm font-bold text-gray-900">{selectedStudent.nameKh}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-semibold">ឈ្មោះឡាតាំង (Latin Name)៖</p>
                  <p className="text-sm font-bold text-gray-900 font-mono uppercase">{selectedStudent.nameEn}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-semibold">ភេទ (Gender)៖</p>
                  <p className="text-sm font-bold text-gray-900">{selectedStudent.gender}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400 font-semibold">ថ្ងៃខែឆ្នាំកំណើត (DOB)៖</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">{selectedStudent.dob || '—'}</p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-gray-400 font-semibold">ទីកន្លែងកំណើត (POB)៖</p>
                  <p className="text-sm font-medium text-gray-900">{selectedStudent.pob || '—'} (ខេត្ត៖ {selectedStudent.pobProvince})</p>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <p className="text-gray-400 font-semibold">អាសយដ្ឋានបច្ចុប្បន្ន (Current Address)៖</p>
                  <p className="text-sm font-medium text-gray-900">{selectedStudent.address || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Parents and Family components */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-indigo-650" /> ២. ព័ត៌មានគ្រួសារ និងទំនាក់ទំនង (FAMILY COMPOSITION)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-700 bg-slate-50 border border-gray-100 p-5 rounded-2xl">
              <div className="space-y-1">
                <p className="text-gray-400 font-semibold">ឈ្មោះឪពុក (Father's Name)៖</p>
                <p className="text-sm font-bold text-emerald-950">{selectedStudent.fatherName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-semibold">មុខរបរឪពុក (Father's Job)៖</p>
                <p className="text-sm font-medium text-gray-900">{selectedStudent.fatherJob || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-semibold">ឈ្មោះម្តាយ (Mother's Name)៖</p>
                <p className="text-sm font-bold text-gray-900">{selectedStudent.motherName || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-400 font-semibold">មុខរបរម្តាយ (Mother's Job)៖</p>
                <p className="text-sm font-medium text-gray-900">{selectedStudent.motherJob || '—'}</p>
              </div>
              <div className="sm:col-span-2 space-y-1 border-t border-gray-200/65 pt-3.5 mt-2">
                <p className="text-gray-400 font-semibold">លេខទូរស័ព្ទទំនាក់ទំនងអាណាព្យាបាល (Parent Phone)៖</p>
                <p className="text-sm font-extrabold text-indigo-900 font-mono text-base">{selectedStudent.phoneNumber || '—'}</p>
              </div>
            </div>
          </div>

          {/* Cumulative yearly academic record block */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-widest border-b border-indigo-100 pb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-650" /> ៣. សរុបលទ្ធផលការសិក្សាប្រចាំឆ្នាំ (YEAR-END RESULTS)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-center">
              <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/10">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">មធ្យមភាគឆមាសទី១</span>
                <strong className="text-2xl font-black text-indigo-950 mt-2 block">{studentSummary ? studentSummary.s1Avg.toFixed(2) : '0.00'}</strong>
              </div>
              <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/10">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase block">មធ្យមភាគឆមាសទី២</span>
                <strong className="text-2xl font-black text-indigo-950 mt-2 block">{studentSummary ? studentSummary.s2Avg.toFixed(2) : '0.00'}</strong>
              </div>
              <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                <span className="text-[10px] font-sans font-extrabold text-amber-800 uppercase block">មធ្យមភាគដំណាច់ឆ្នាំ</span>
                <strong className="text-3xl font-black text-amber-950 mt-1 block">{studentSummary ? studentSummary.yearEndAvg.toFixed(2) : '0.00'}</strong>
              </div>
            </div>

            {/* Status report */}
            <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center justify-between text-xs text-gray-700">
              <div className="space-y-1 text-left font-sans">
                <p>ចំណាត់ថ្នាក់ប្រចាំ៖ <strong className="text-indigo-850 text-sm">{studentSummary && studentSummary.yearEndRank > 0 ? studentSummary.yearEndRank : '—'}</strong> ក្នុងថ្នាក់រៀន</p>
                <p>សេចក្តីសម្រេច៖ <strong className="text-gray-900">អនុម័តឲ្យឡើងទៅសិក្សានៅ ថ្នាក់បន្ទាប់</strong></p>
              </div>
              <div className="text-right">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black ${
                  (studentSummary?.yearEndAvg || 0) >= 5.0
                    ? 'bg-green-600 text-white'
                    : 'bg-red-650 text-white'
                }`}>
                  {(studentSummary?.yearEndAvg || 0) >= 5.0 ? 'ជាប់ថ្នាក់ / PROMOTED' : 'ធ្លាក់ថ្នាក់ / RETAINED'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom registration approval */}
          <div className="grid grid-cols-2 text-center text-xs font-sans mt-12 pt-8 gap-10 border-t border-gray-200">
            <div className="space-y-1">
              <p>បានពិនិត្យ និងស្រង់បញ្ជីត្រឹមត្រូវ</p>
              <p className="font-moul text-[10px] text-gray-800">នាយកសាលាបឋមសិក្សា</p>
              <div className="h-16" />
              <p className="text-gray-400">....................................................</p>
            </div>

            <div className="space-y-1">
              <p>ធ្វើនៅរាជធានីភ្នំពេញ ថ្ងៃទី០៤ ខែមិថុនា ឆ្នាំ២០២៦</p>
              <p className="font-moul text-[10px] text-gray-800">ប្រធានការិយាល័យអប់រំ / គ្រូបន្ទុកថ្នាក់</p>
              <div className="h-16" />
              <p className="font-bold underline">{classInfo.classTeacher}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* SIDEBAR: Student Select & Document Type Selection (Hides on Print) */}
      <div className="space-y-6 lg:col-span-1 no-print">
        {/* Document Type Selector Card */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-1">
            ប្រភេទឯកសារសិក្សា (Document Type)
          </label>
          <button
            onClick={() => setDocType('tracker')}
            className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
              docType === 'tracker'
                ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              សៀវភៅតាមដានការសិក្សា
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDocType('biography')}
            className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
              docType === 'biography'
                ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              សៀវភៅសិក្ខាគារិក (ជីវប្រវត្តិ)
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Student Navigator List */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 max-h-[60vh] flex flex-col">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-1">
            ជ្រើសរើសសិស្ស ({students.length} នាក់)
          </label>
          <div className="overflow-y-auto flex-1 divide-y divide-gray-100 pr-1 space-y-1">
            {students.map((student) => {
              const isActive = student.id === selectedStudentId;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full p-2.5 text-left rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold'
                      : 'hover:bg-gray-50 border border-transparent text-gray-750'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-105 text-gray-500'
                  }`}>
                    {student.gender === 'ស្រី' ? 'ស' : 'ប'}
                  </span>
                  <div className="truncate flex-1 space-y-0.5">
                    <p className="text-xs font-bold">{student.nameKh}</p>
                    <p className="font-mono text-[9px] text-gray-400 uppercase">{student.nameEn}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Print Instruction Card */}
        <div className="bg-indigo-50 border border-indigo-100/60 p-4 rounded-xl text-center space-y-3">
          <p className="text-xs text-indigo-805 leading-normal">
            បន្ទាប់ពីជ្រើសរើសសិស្សរួច អ្នកអាចចុចប៊ូតុងបោះពុម្ព ឬនាំចេញជាឯកសារ Word ខាងក្រោមសម្រាប់សៀវភៅពិន្ទុ។
          </p>
          <button
            onClick={handlePrint}
            className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
          >
            <Printer className="w-4 h-4" />
            បោះពុម្ពឯកសារនេះ (Print PDF)
          </button>
          
          <button
            onClick={handleExportWord}
            className="w-full bg-emerald-600 hover:bg-emerald-700 transition-colors text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
            title="ទាញយកឯកសារនេះជាទម្រង់ Microsoft Word"
          >
            <Download className="w-4 h-4" />
            នាំចេញជា Word (.doc)
          </button>
        </div>
      </div>

      {/* COMPONENT BODY DISPLAY: Actual Booklet Frame */}
      <div className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm print:border-none print:shadow-none print:p-0 min-h-[80vh]">
        {renderDocumentContent()}
      </div>

      {/* 4. A4 STANDARD PRINT PREVIEW MODAL */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200 modal-no-print">
          
          {/* CONTROL SIDEBAR (Settings Panel) */}
          <div className="w-full md:w-80 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-800 h-full max-h-screen">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Printer className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-xs uppercase tracking-wider font-sans">ការកំណត់បោះពុម្ព (A4 Print Settings)</h3>
              </div>
              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                className="p-1 px-2 bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-sans"
              >
                <X className="w-3.5 h-3.5" />
                បិទ (Close)
              </button>
            </div>

            {/* Scroller for settings */}
            <div className="p-4 flex-1 overflow-y-auto space-y-6 text-xs font-sans text-slate-300 gray-scrollbar">
              {/* Document Overview Badge */}
              <div className="bg-slate-950/65 p-3.5 rounded-2xl border border-slate-880/80 space-y-2">
                <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">សិស្សដែលបានជ្រើសរើស (Selected)</p>
                <div>
                  <p className="font-black text-white text-sm font-sans">{selectedStudent.nameKh}</p>
                  <p className="font-mono text-[10px] text-indigo-400 font-bold uppercase mt-0.5">{selectedStudent.nameEn} ({selectedStudent.id})</p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 mt-1">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">ប្រភេទឯកសារ (Document Type)</p>
                  <p className="font-bold text-emerald-400 mt-1 text-[11px] flex items-center gap-1.5 font-sans">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    {docType === 'tracker' ? 'សៀវភៅតាមដានការសិក្សា' : 'សៀវភៅសិក្ខាគារិក (ជីវប្រវត្តិ)'}
                  </p>
                </div>
              </div>

              {/* Setting 1: Margins */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1.5 font-sans">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  ១. កំណត់រឹមទំព័រ (Paper Margins)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '10mm', label: 'តូច (10mm)', desc: 'Narrow' },
                    { value: '15mm', label: 'មធ្យម (15mm)', desc: 'Normal' },
                    { value: '20mm', label: 'ធំ (20mm)', desc: 'Wide' },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPrintMargin(m.value)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        printMargin === m.value
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/20'
                          : 'bg-slate-850/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-extrabold text-[10px] font-sans">{m.label}</div>
                      <div className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase">{m.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal italic">
                  * ជ្រើសរើសរឹមតូចប្រសិនបើគំនូសតារាងឬបញ្ជីឈ្មោះធ្លាក់បន្ទាត់។
                </p>
              </div>

              {/* Setting 2: Font scaling */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block flex items-center gap-1.5 font-sans">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  ២. ទំហំអក្សរក្នុងទំព័រ (Font Size)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '11px', label: 'តូច (90%)', desc: 'Saves Space' },
                    { value: '12px', label: 'មធ្យម (100%)', desc: 'Standard' },
                    { value: '14px', label: 'ធំ (110%)', desc: 'Enhanced' },
                  ].map((fs) => (
                    <button
                      key={fs.value}
                      onClick={() => setPrintFontSize(fs.value)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        printFontSize === fs.value
                          ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold ring-2 ring-indigo-500/20'
                          : 'bg-slate-850/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-extrabold text-[10px] font-sans">{fs.label}</div>
                      <div className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase">{fs.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 leading-normal italic">
                  * កាត់បន្ថយទំហំអក្សរមកត្រឹម <strong>តូច (90%)</strong> ដើម្បីបញ្ចូលទិន្នន័យឱ្យសមល្មមក្នុងមួយទំព័រ A4។
                </p>
              </div>

              {/* Setting 3: Visual Boundary */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans">៣. បន្ទាត់ដែនកំណត់ទំព័រ A4</span>
                  <button
                    onClick={() => setShowPageBounds(!showPageBounds)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                      showPageBounds ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      showPageBounds ? 'translate-x-[20px]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  * គូរគំនូសបន្ទាត់ក្រហមចុចៗរុករកទំហំកម្ពស់ A4 ជាក់ស្តែង (297mm) ដើម្បីផ្ទៀងផ្ទាត់លើអេក្រង់។ (បន្ទាត់នេះនឹងមិនត្រូវបានបោះពុម្ពទេ)។
                </p>
              </div>

              {/* Print Best Practices Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wider font-sans">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>ការគណនា/បោះពុម្ព (Printing Tips)</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400 leading-relaxed font-sans">
                  <li>កំណត់បន្ទះក្រដាសក្នុងទម្រង់ <b>A4</b> (Paper size)</li>
                  <li>ជ្រើសរើសរឹមទំព័រជា <b>គ្មាន / None</b> (Margins None)</li>
                  <li>បើកការបង្ហាញពណ៌ផ្ទៃ <b>Background graphics</b></li>
                </ul>
              </div>
            </div>

            {/* Print Action Bottom Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button
                onClick={() => window.print()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                <Printer className="w-4 h-4" />
                បោះពុម្ពឯកសារនេះ (Print PDF)
              </button>
            </div>
          </div>

          {/* ACTIVE CANVAS DISPLAY AREA */}
          <div className="flex-1 bg-slate-950 p-6 md:p-12 overflow-y-auto flex justify-center gray-scrollbar">
            {/* Standard A4 Paper Wrapper Sheet for Real Representation */}
            <div 
              style={{ 
                padding: printMargin, 
                fontSize: printFontSize,
                width: '210mm',
                minHeight: '297mm',
              }}
              className={`bg-white shadow-2xl relative rounded-md border border-gray-200/50 print:border-none print:shadow-none print:p-0 font-sans text-gray-800 flex flex-col justify-between ${
                showPageBounds ? 'after:content-[""] after:pointer-events-none after:absolute after:left-0 after:right-0 after:top-[297mm] after:border-b-2 after:border-dashed after:border-rose-450' : ''
              }`}
            >
              {/* Report Booklet Paper Frame */}
              {renderDocumentContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
