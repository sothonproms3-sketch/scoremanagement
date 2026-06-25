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
  const [docType, setDocType] = useState<'tracker' | 'biography' | 'ageSummary' | 'ageList' | 'certificate'>('tracker');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('yearEnd');
  const [schoolCluster, setSchoolCluster] = useState<string>('អូរស្រឡៅ');
  const [certCustomRank, setCertCustomRank] = useState<string>('');
  const [certLunarDate, setCertLunarDate] = useState<string>('ថ្ងៃ ចន្ទ ១ រោច ខែ អស្សុជ ឆ្នាំ ថោះ បញ្ចស័ក ព.ស.២៥៦៧');
  const [certSolarDate, setCertSolarDate] = useState<string>('វត្តចែង, ថ្ងៃទី ៣០ ខែ តុលា ឆ្នាំ ២០២៣');
  const [teacherGender, setTeacherGender] = useState<'ប្រុស' | 'ស្រី'>('ស្រី');
  const [teacherAge, setTeacherAge] = useState<string>('៤១');
  const [teacherIndigenous, setTeacherIndigenous] = useState<string>('ទេ/គ្មាន');
  const [teacherEducation, setTeacherEducation] = useState<string>('បរិញ្ញាបត្រ');
  const [teacherExperience, setTeacherExperience] = useState<string>('២១ ឆ្នាំ');
  const [teacherTaskLevel, setTeacherTaskLevel] = useState<string>('គ៨');
  const [schoolProvince, setSchoolProvince] = useState<string>('បាត់ដំបង');
  const [schoolDistrict, setSchoolDistrict] = useState<string>('សង្កែ');
  
  // Grade 1 Kindergarten counts state (for 2.a)
  const [kindergartenStateTotal, setKindergartenStateTotal] = useState<number>(0);
  const [kindergartenStateFemale, setKindergartenStateFemale] = useState<number>(0);
  const [kindergartenPrivateTotal, setKindergartenPrivateTotal] = useState<number>(0);
  const [kindergartenPrivateFemale, setKindergartenPrivateFemale] = useState<number>(0);
  const [kindergartenCommunityTotal, setKindergartenCommunityTotal] = useState<number>(0);
  const [kindergartenCommunityFemale, setKindergartenCommunityFemale] = useState<number>(0);
  const [kindergartenHomeTotal, setKindergartenHomeTotal] = useState<number>(0);
  const [kindergartenHomeFemale, setKindergartenHomeFemale] = useState<number>(0);
  const [kindergartenPrepTotal, setKindergartenPrepTotal] = useState<number>(0);
  const [kindergartenPrepFemale, setKindergartenPrepFemale] = useState<number>(0);

  // Student statuses state for Age table (2.b)
  const [studentStatuses, setStudentStatuses] = useState<{ [id: string]: 'new' | 'promoted' | 'repeating' }>({});
  
  // Student indigenous state for Table 4
  const [indigenousStudents, setIndigenousStudents] = useState<{ [id: string]: boolean }>({});

  // Disabilities counts state (for 3)
  const [disabilityCounts, setDisabilityCounts] = useState<{ [key: string]: { total: number; female: number } }>({
    mobility: { total: 0, female: 0 },
    hearing: { total: 0, female: 0 },
    speech: { total: 0, female: 0 },
    visual: { total: 0, female: 0 },
    intellectual: { total: 0, female: 0 },
    learningDifficulty: { total: 0, female: 0 },
    psychological: { total: 0, female: 0 },
    otherDisability: { total: 0, female: 0 },
    noGuardian: { total: 0, female: 0 },
    chronicIllness: { total: 0, female: 0 },
    poorFamily: { total: 0, female: 0 },
    orphan: { total: 0, female: 0 },
    hivAids: { total: 0, female: 0 },
    vulnerableFamily: { total: 0, female: 0 },
    drugAffected: { total: 0, female: 0 },
    otherVulnerable: { total: 0, female: 0 },
  });

  // Shared utility functions for Khmer digits and Age calculation
  const khmerToEnglishDigits = (str: string): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return str.replace(/[០-៩]/g, (char) => khmerDigits.indexOf(char).toString());
  };

  const toKhmerDigits = (num: number | string): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return String(num).replace(/\d/g, (char) => khmerDigits[parseInt(char, 10)]);
  };

  const getStudentAge = (dobStr: string, academicYearStr: string): number => {
    if (!dobStr || dobStr === '—') return 10; // fallback
    const cleanDob = khmerToEnglishDigits(dobStr);
    const matchDob = cleanDob.match(/(\d{4})/);
    const birthYear = matchDob ? parseInt(matchDob[0], 10) : 2015;

    const cleanYear = khmerToEnglishDigits(academicYearStr);
    const matchYear = cleanYear.match(/(\d{4})/g);
    const currentYear = matchYear && matchYear.length >= 2 
      ? parseInt(matchYear[1], 10) 
      : (matchYear && matchYear.length === 1 ? parseInt(matchYear[0], 10) : 2025);

    return currentYear - birthYear;
  };

  React.useEffect(() => {
    const updated = { ...studentStatuses };
    let changed = false;
    students.forEach((student) => {
      if (!updated[student.id]) {
        const isGrade1 = classInfo.gradeClass.includes('១') || classInfo.gradeClass.includes('1');
        updated[student.id] = isGrade1 ? 'new' : 'promoted';
        changed = true;
      }
    });
    if (changed) {
      setStudentStatuses(updated);
    }
  }, [students, classInfo.gradeClass]);

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

  // Helper to convert a numeric score to its grade letter (A, B, C, D, E, F)
  const getSubjectGrade = (score: number | undefined): string => {
    if (score === undefined) return '—';
    if (score >= 9.0) return 'A';
    if (score >= 8.0) return 'B';
    if (score >= 7.0) return 'C';
    if (score >= 6.0) return 'D';
    if (score >= 5.0) return 'E';
    return 'F';
  };

  // Helper to calculate or fetch student subject score for selected period
  const getStudentSubjectScore = (studentId: string, subKey: keyof SubjectScores, period: string): number | undefined => {
    if (period !== 'semester1' && period !== 'semester2' && period !== 'yearEnd') {
      return scores[studentId]?.[period as AcademicPeriod]?.[subKey];
    }

    // Semester 1 calculation
    const s1Months: AcademicPeriod[] = ['nov', 'dec', 'jan', 'feb', 'mar'];
    const s1Scores: number[] = [];
    s1Months.forEach((m) => {
      const val = scores[studentId]?.[m]?.[subKey];
      if (val !== undefined) s1Scores.push(val);
    });
    const s1MonthlyAvg = s1Scores.length > 0 ? s1Scores.reduce((a, b) => a + b, 0) / s1Scores.length : undefined;
    const s1Exam = scores[studentId]?.['sem1_exam']?.[subKey];
    let s1Avg: number | undefined = undefined;
    if (s1MonthlyAvg !== undefined && s1Exam !== undefined) {
      s1Avg = (s1MonthlyAvg + s1Exam) / 2;
    } else if (s1MonthlyAvg !== undefined) {
      s1Avg = s1MonthlyAvg;
    } else if (s1Exam !== undefined) {
      s1Avg = s1Exam;
    }

    if (period === 'semester1') return s1Avg;

    // Semester 2 calculation
    const s2Months: AcademicPeriod[] = ['apr_may', 'jun', 'jul'];
    const s2Scores: number[] = [];
    s2Months.forEach((m) => {
      const val = scores[studentId]?.[m]?.[subKey];
      if (val !== undefined) s2Scores.push(val);
    });
    const s2MonthlyAvg = s2Scores.length > 0 ? s2Scores.reduce((a, b) => a + b, 0) / s2Scores.length : undefined;
    const s2Exam = scores[studentId]?.['sem2_exam']?.[subKey];
    let s2Avg: number | undefined = undefined;
    if (s2MonthlyAvg !== undefined && s2Exam !== undefined) {
      s2Avg = (s2MonthlyAvg + s2Exam) / 2;
    } else if (s2MonthlyAvg !== undefined) {
      s2Avg = s2MonthlyAvg;
    } else if (s2Exam !== undefined) {
      s2Avg = s2Exam;
    }

    if (period === 'semester2') return s2Avg;

    // Year End calculation
    if (s1Avg !== undefined && s2Avg !== undefined) {
      return (s1Avg + s2Avg) / 2;
    } else if (s1Avg !== undefined) {
      return s1Avg;
    } else if (s2Avg !== undefined) {
      return s2Avg;
    }
    return undefined;
  };

  // Helper to sum attendance records for selected period
  const getPeriodAttendance = (studentId: string, period: string) => {
    let excused = 0;
    let unexcused = 0;

    const periodsToSum: AcademicPeriod[] = [];
    if (period === 'semester1') {
      periodsToSum.push('nov', 'dec', 'jan', 'feb', 'mar');
    } else if (period === 'semester2') {
      periodsToSum.push('apr_may', 'jun', 'jul');
    } else if (period === 'yearEnd') {
      periodsToSum.push('nov', 'dec', 'jan', 'feb', 'mar', 'apr_may', 'jun', 'jul');
    } else {
      periodsToSum.push(period as AcademicPeriod);
    }

    periodsToSum.forEach(p => {
      const record = attendance[studentId]?.[p];
      if (record) {
        excused += record.excused || 0;
        unexcused += record.unexcused || 0;
      }
    });

    return { excused, unexcused };
  };

  // Helper to compute overall metrics (total, average, rank) for the selected student & period
  const getPeriodMetrics = () => {
    if (selectedPeriod === 'semester1') {
      const s1Avg = studentSummary?.s1Avg || 0;
      const s1Rank = studentSummary?.s1Rank || 0;
      let total = 0;
      SUBJECT_NAMES.forEach(sub => {
        const score = getStudentSubjectScore(selectedStudentId, sub.value, 'semester1');
        if (score !== undefined) {
          total += score;
        }
      });
      return { total, average: s1Avg, rank: s1Rank };
    }

    if (selectedPeriod === 'semester2') {
      const s2Avg = studentSummary?.s2Avg || 0;
      const s2Rank = studentSummary?.s2Rank || 0;
      let total = 0;
      SUBJECT_NAMES.forEach(sub => {
        const score = getStudentSubjectScore(selectedStudentId, sub.value, 'semester2');
        if (score !== undefined) {
          total += score;
        }
      });
      return { total, average: s2Avg, rank: s2Rank };
    }

    if (selectedPeriod === 'yearEnd') {
      const yearEndAvg = studentSummary?.yearEndAvg || 0;
      const yearEndRank = studentSummary?.yearEndRank || 0;
      let total = 0;
      SUBJECT_NAMES.forEach(sub => {
        const score = getStudentSubjectScore(selectedStudentId, sub.value, 'yearEnd');
        if (score !== undefined) {
          total += score;
        }
      });
      return { total, average: yearEndAvg, rank: yearEndRank };
    }

    // Monthly or exam period
    const pScores = scores[selectedStudentId]?.[selectedPeriod as AcademicPeriod];
    const { sum, average } = calculateRecordMetrics(pScores);
    const rankings = calculateRankings(students, scores);
    const rank = rankings[selectedPeriod as AcademicPeriod]?.[selectedStudentId]?.rank || 0;
    return { total: sum, average, rank };
  };

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
            <td class="text-left" style="font-size: 10px; font-weight: normal; font-style: italic;">${attRecord.notes?.trim() ? attRecord.notes : (hasScoresEntered ? getResultComments(average) : '—')}</td>
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

  const renderAgeSummaryContent = () => {
    const AGE_ROWS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // 15 represents 15+

    const ageCounts = AGE_ROWS.map(age => {
      const matchingStudents = students.filter(s => {
        const studentAge = getStudentAge(s.dob, classInfo.academicYear);
        if (age === 15) {
          return studentAge >= 15;
        }
        return studentAge === age;
      });

      const newTotal = matchingStudents.filter(s => studentStatuses[s.id] === 'new').length;
      const newFemale = matchingStudents.filter(s => studentStatuses[s.id] === 'new' && s.gender === 'ស្រី').length;
      
      const repeatTotal = matchingStudents.filter(s => studentStatuses[s.id] === 'repeating').length;
      const repeatFemale = matchingStudents.filter(s => studentStatuses[s.id] === 'repeating' && s.gender === 'ស្រី').length;

      const grandTotal = matchingStudents.length;
      const grandFemale = matchingStudents.filter(s => s.gender === 'ស្រី').length;

      return {
        age,
        newTotal,
        newFemale,
        repeatTotal,
        repeatFemale,
        grandTotal,
        grandFemale
      };
    });

    const totalNewTotal = ageCounts.reduce((acc, r) => acc + r.newTotal, 0);
    const totalNewFemale = ageCounts.reduce((acc, r) => acc + r.newFemale, 0);
    const totalRepeatTotal = ageCounts.reduce((acc, r) => acc + r.repeatTotal, 0);
    const totalRepeatFemale = ageCounts.reduce((acc, r) => acc + r.repeatFemale, 0);
    const totalGrandTotal = ageCounts.reduce((acc, r) => acc + r.grandTotal, 0);
    const totalGrandFemale = ageCounts.reduce((acc, r) => acc + r.grandFemale, 0);

    // Table 4 Calculations
    const indigenousStudentsList = students.filter(s => indigenousStudents[s.id]);
    const indAge6Total = indigenousStudentsList.filter(s => getStudentAge(s.dob, classInfo.academicYear) === 6).length;
    const indAge6Female = indigenousStudentsList.filter(s => getStudentAge(s.dob, classInfo.academicYear) === 6 && s.gender === 'ស្រី').length;
    const indAge7To11Total = indigenousStudentsList.filter(s => {
      const age = getStudentAge(s.dob, classInfo.academicYear);
      return age >= 7 && age <= 11;
    }).length;
    const indAge7To11Female = indigenousStudentsList.filter(s => {
      const age = getStudentAge(s.dob, classInfo.academicYear);
      return age >= 7 && age <= 11 && s.gender === 'ស្រី';
    }).length;
    const indAge12PlusTotal = indigenousStudentsList.filter(s => getStudentAge(s.dob, classInfo.academicYear) >= 12).length;
    const indAge12PlusFemale = indigenousStudentsList.filter(s => getStudentAge(s.dob, classInfo.academicYear) >= 12 && s.gender === 'ស្រី').length;
    const indGrandTotal = indigenousStudentsList.length;
    const indGrandFemale = indigenousStudentsList.filter(s => s.gender === 'ស្រី').length;

    // Table 3 Calculations
    const totalDisabilityTotal = (Object.values(disabilityCounts) as { total: number; female: number }[]).reduce((acc, r) => acc + r.total, 0);
    const totalDisabilityFemale = (Object.values(disabilityCounts) as { total: number; female: number }[]).reduce((acc, r) => acc + r.female, 0);

    // Grade 1 Prep totals
    const totalPrepTotal = kindergartenStateTotal + kindergartenPrivateTotal + kindergartenCommunityTotal + kindergartenHomeTotal + kindergartenPrepTotal;
    const totalPrepFemale = kindergartenStateFemale + kindergartenPrivateFemale + kindergartenCommunityFemale + kindergartenHomeFemale + kindergartenPrepFemale;

    return (
      <div className="text-black font-sans leading-tight text-[11px] p-2 space-y-4">
        {/* TOP HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1 font-bold text-left">
            <div>រាជធានី/ខេត្ត៖ <span className="border-b border-dotted border-black px-4">{schoolProvince}</span></div>
            <div>ស្រុក/ខណ្ឌ៖ <span className="border-b border-dotted border-black px-4">{schoolDistrict}</span></div>
            <div>សាលាបឋមសិក្សា៖ <span className="border-b border-dotted border-black px-4">{classInfo.schoolName}</span></div>
          </div>
          
          <div className="text-center">
            <h1 className="font-moul text-xs tracking-wider">តារាងចំនួនសិស្សតាមថ្នាក់ (សម្រាប់គ្រូ)</h1>
            <p className="font-bold text-[11px] mt-1">ឆ្នាំសិក្សា៖ {toKhmerDigits(classInfo.academicYear)}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center font-bold text-sm tracking-widest">
              PRI
            </div>
          </div>
        </div>

        {/* MAIN TWO COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            
            {/* Section 1: Teacher Profile */}
            <div className="space-y-1">
              <h2 className="font-bold text-gray-900">១. ព័ត៌មានសេវាករអប់រំ ថ្នាក់៖ {classInfo.gradeClass}</h2>
              <table className="w-full border-collapse border border-black text-left">
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50 w-2/5">ឈ្មោះជាអក្សរខ្មែរ</td>
                    <td className="border border-black px-2 py-1">{classInfo.classTeacher}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">ភេទ(សូមគូសរង្វង់)</td>
                    <td className="border border-black px-2 py-1">
                      <span className={teacherGender === 'ស្រី' ? 'border border-black rounded-full px-2 py-0.5' : 'text-gray-400'}>ស្រី</span>
                      <span className="mx-2">/</span>
                      <span className={teacherGender === 'ប្រុស' ? 'border border-black rounded-full px-2 py-0.5' : 'text-gray-400'}>ប្រុស</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">អាយុ(សូមសរសេរក្នុងប្រអប់)</td>
                    <td className="border border-black px-2 py-1">{toKhmerDigits(teacherAge)} ឆ្នាំ</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">ជនជាតិដើមភាគតិច</td>
                    <td className="border border-black px-2 py-1">{teacherIndigenous}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">កម្រិតវប្បធម៌</td>
                    <td className="border border-black px-2 py-1">{teacherEducation}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">រយៈពេលបម្រើការងារអប់រំ</td>
                    <td className="border border-black px-2 py-1">{teacherExperience}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold bg-gray-50">កម្រិតភារកិច្ច</td>
                    <td className="border border-black px-2 py-1">{teacherTaskLevel}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 2.b: Student Ages Table */}
            <div className="space-y-1">
              <h2 className="font-bold text-gray-900">
                ២.(ខ) សិស្សថ្មី សិស្សឡើងថ្នាក់ និងសិស្សត្រួតថ្នាក់ ក្នុងឆ្នាំសិក្សា ចំនួនសិស្សគិតត្រឹមថ្ងៃទី៣១-១២-{toKhmerDigits(classInfo.academicYear.split('-')[1]?.slice(-2) || '២៥')}
              </h2>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100/80">
                    <th rowSpan={2} className="border border-black px-1 py-2 w-16">អាយុ ឆ្នាំ</th>
                    <th colSpan={6} className="border border-black px-1 py-1">ចំនួនសិស្ស</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th colSpan={2} className="border border-black px-1 py-1 w-24">សិស្សថ្មី</th>
                    <th colSpan={2} className="border border-black px-1 py-1 w-24">សិស្សត្រួតថ្នាក់</th>
                    <th colSpan={2} className="border border-black px-1 py-1 w-24">សរុប</th>
                  </tr>
                  <tr className="bg-gray-50 text-[10px]">
                    <th className="border border-black px-1 py-0.5"></th>
                    <th className="border border-black px-1 py-0.5">សរុប</th>
                    <th className="border border-black px-1 py-0.5">ស្រី</th>
                    <th className="border border-black px-1 py-0.5">សរុប</th>
                    <th className="border border-black px-1 py-0.5">ស្រី</th>
                    <th className="border border-black px-1 py-0.5">សរុប</th>
                    <th className="border border-black px-1 py-0.5">ស្រី</th>
                  </tr>
                </thead>
                <tbody>
                  {ageCounts.map(row => (
                    <tr key={row.age} className="hover:bg-gray-50/50">
                      <td className="border border-black px-1 py-1 font-bold">
                        {row.age === 15 ? '១៥ +' : toKhmerDigits(row.age)}
                      </td>
                      <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(row.newTotal)}</td>
                      <td className="border border-black px-1 py-1 font-mono text-gray-700">{toKhmerDigits(row.newFemale)}</td>
                      <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(row.repeatTotal)}</td>
                      <td className="border border-black px-1 py-1 font-mono text-gray-700">{toKhmerDigits(row.repeatFemale)}</td>
                      <td className="border border-black px-1 py-1 font-bold font-mono text-indigo-900 bg-indigo-50/10">
                        {toKhmerDigits(row.grandTotal)}
                      </td>
                      <td className="border border-black px-1 py-1 font-bold font-mono text-indigo-900 bg-indigo-50/10">
                        {toKhmerDigits(row.grandFemale)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-black px-1 py-1.5">សរុប</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalNewTotal)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalNewFemale)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalRepeatTotal)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalRepeatFemale)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono text-indigo-900 bg-indigo-50/35">{toKhmerDigits(totalGrandTotal)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono text-indigo-900 bg-indigo-50/35">{toKhmerDigits(totalGrandFemale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4: Indigenous minority age summary */}
            <div className="space-y-1">
              <h2 className="font-bold text-gray-900">៤. សិស្សអាយុជនជាតិភាគតិច (Indigenous Minority Students)</h2>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100/80 font-bold">
                    <th className="border border-black px-2 py-1.5">ក្រុមអាយុ (Age Group)</th>
                    <th className="border border-black px-2 py-1.5">សរុប (Total)</th>
                    <th className="border border-black px-2 py-1.5">ស្រី (Female)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">៦ ឆ្នាំ (6 Years)</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge6Total)}</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge6Female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">៧-១១ ឆ្នាំ (7-11 Years)</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge7To11Total)}</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge7To11Female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 font-bold">១២ ឆ្នាំឡើង (12+ Years)</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge12PlusTotal)}</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indAge12PlusFemale)}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-black px-2 py-1">សរុប (Grand Total)</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indGrandTotal)}</td>
                    <td className="border border-black px-2 py-1 font-mono">{toKhmerDigits(indGrandFemale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            
            {/* Section 2.a: Grade 1 Early Childhood Program Prep */}
            <div className="space-y-1">
              <h2 className="font-bold text-gray-900">
                ២.(ក) ចំនួនសិស្សថ្នាក់ទី១ បានឆ្លងកាត់កម្មវិធីកុមារតូច <span className="text-[10px] font-normal text-red-650">(ក្រៅពីថ្នាក់ទី១ មិនបាច់បំពេញឡើយ)</span>
              </h2>
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-gray-100/80">
                    <th rowSpan={2} className="border border-black px-1 py-2 text-left">ប្រភេទ (Kindergarten Type)</th>
                    <th colSpan={2} className="border border-black px-1 py-1">សិស្សថ្មី</th>
                    <th colSpan={2} className="border border-black px-1 py-1">សិស្សត្រួតថ្នាក់</th>
                  </tr>
                  <tr className="bg-gray-50 text-[10px]">
                    <th className="border border-black px-1 py-0.5 w-16">សរុប</th>
                    <th className="border border-black px-1 py-0.5 w-16">ស្រី</th>
                    <th className="border border-black px-1 py-0.5 w-16">សរុប</th>
                    <th className="border border-black px-1 py-0.5 w-16">ស្រី</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-1 text-left">មត្តេយ្យរដ្ឋ (State Kindergarten)</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenStateTotal)}</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenStateFemale)}</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-left">មត្តេយ្យឯកជន (Private Kindergarten)</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenPrivateTotal)}</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenPrivateFemale)}</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-left">មត្តេយ្យសហគមន៍ (Community Kindergarten)</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenCommunityTotal)}</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenCommunityFemale)}</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-left">ការអប់រំតាមផ្ទះ (Home Education)</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenHomeTotal)}</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenHomeFemale)}</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-1 text-left">កម្មវិធីត្រៀមថ្នាក់ទី១ (Prep Program)</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenPrepTotal)}</td>
                    <td className="border border-black px-1 py-1 font-mono">{toKhmerDigits(kindergartenPrepFemale)}</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                    <td className="border border-black px-1 py-1 font-mono">០</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-black px-2 py-1 text-left">សរុប (Total)</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalPrepTotal)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalPrepFemale)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">០</td>
                    <td className="border border-black px-1 py-1.5 font-mono">០</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 3: Disabilities & Difficulties */}
            <div className="space-y-1">
              <h2 className="font-bold text-gray-900">៣. ចំនួនសិស្សខូចសរីរាង្គនិងកុមារជួបការលំបាក (សិស្សម្នាក់អាចរាប់បានច្រើនដង)</h2>
              <table className="w-full border-collapse border border-black text-center text-[10px]">
                <thead>
                  <tr className="bg-gray-100/85 font-bold">
                    <th className="border border-black px-2 py-1.5 text-left text-[11px]">បរិយាយ (Description)</th>
                    <th className="border border-black px-1 py-1 w-16">សរុប</th>
                    <th className="border border-black px-1 py-1 w-16">ស្រី</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50/50 font-bold"><td colSpan={3} className="border border-black px-2 py-0.5 text-left text-slate-700">កុមារពិការ (Children with Disabilities)</td></tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">១. ពិការក្នុងកម្រិតចលនា (Mobility)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.mobility.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.mobility.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">២. ពិការក្នុងការស្តាប់ (Hearing)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.hearing.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.hearing.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៣. ពិការក្នុងការនិយាយ (Speech)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.speech.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.speech.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៤. ពិការក្នុងការមើល (Visual)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.visual.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.visual.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៥. ពិការសតិបញ្ញា/រៀនយឺត (Intellectual)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.intellectual.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.intellectual.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៦. ពិការការសិក្សា (Learning difficulty)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.learningDifficulty.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.learningDifficulty.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៧. ពិការខាងផ្លូវចិត្ត (Psychological)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.psychological.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.psychological.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៨. ពិការផ្សេងៗ (Other)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.otherDisability.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.otherDisability.female)}</td>
                  </tr>
                  
                  <tr className="bg-gray-55/40 font-bold"><td colSpan={3} className="border border-black px-2 py-0.5 text-left text-slate-700">កុមារជួបការលំបាកផ្សេងៗ (Disadvantaged Children)</td></tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">១. គ្មានអាណាព្យាបាលបង្អែក (No guardian)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.noGuardian.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.noGuardian.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">២. សុខភាព/ជំងឺប្រចាំកាយ (Chronic illness)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.chronicIllness.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.chronicIllness.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៣. គ្រួសារក្រីក្រមានប័ណ្ណក្រីក្រ (Poor family)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.poorFamily.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.poorFamily.female)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 text-left pl-4">៤. កុមាររងគ្រោះផ្សេងៗ (Other disadvantaged)</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.otherDisadvantaged.total)}</td>
                    <td className="border border-black px-1 py-0.5 font-mono">{toKhmerDigits(disabilityCounts.otherDisadvantaged.female)}</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-black px-2 py-1 text-left">សរុប (Total)</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalDisabilityTotal)}</td>
                    <td className="border border-black px-1 py-1.5 font-mono">{toKhmerDigits(totalDisabilityFemale)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
        
        {/* Signatures & Stamps Footer */}
        <div className="grid grid-cols-2 text-center text-[10px] pt-6 gap-6">
          <div className="space-y-14">
            <div className="italic text-gray-500">បានឃើញ និងបញ្ជាក់ត្រឹមត្រូវ</div>
            <div className="space-y-1 font-bold">
              <div>នាយកសាលាបឋមសិក្សា</div>
              <div className="text-gray-300">....................................................</div>
            </div>
          </div>
          <div className="space-y-14">
            <div className="italic text-gray-500">ថ្ងៃទី........ខែ........ឆ្នាំ........ ព.ស.២៥៧០</div>
            <div className="space-y-1 font-bold">
              <div>គ្រូបន្ទុកថ្នាក់</div>
              <div className="underline text-gray-950 block">{classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgeListContent = () => {
    // Calculate total and average age
    const totalAge = students.reduce((acc, s) => acc + getStudentAge(s.dob, classInfo.academicYear), 0);
    const avgAge = students.length > 0 ? (totalAge / students.length).toFixed(1) : '0';

    return (
      <div id="print-age-list" className="text-black font-sans leading-tight text-[11px] p-2 space-y-4">
        {/* TOP HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1 font-bold text-left text-[10px]">
            <div>ក្រសួងអប់រំ យុវជន និងកីឡា</div>
            <div>មន្ទីរអប់រំ យុវជន និងកីឡាខេត្ត៖ <span className="border-b border-dotted border-black px-2">{schoolProvince}</span></div>
            <div>ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក៖ <span className="border-b border-dotted border-black px-2">{schoolDistrict}</span></div>
            <div>សាលាបឋមសិក្សា៖ <span className="border-b border-dotted border-black px-2">{classInfo.schoolName}</span></div>
          </div>
          
          <div className="text-center space-y-1">
            <h1 className="font-moul text-[11px] tracking-wider text-gray-900">ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h2 className="font-moul text-[9px] text-gray-900">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
            <div className="w-16 h-0.5 bg-black mx-auto mt-0.5" />
          </div>
        </div>

        {/* DOCUMENT TITLE */}
        <div className="text-center py-2 space-y-1">
          <h2 className="font-moul text-xs text-gray-900 tracking-wider">តារាងបញ្ជីស្រង់អាយុសិស្សគ្រប់រូប (លម្អិត)</h2>
          <div className="flex justify-center gap-6 font-bold text-[10px] mt-1 text-gray-800">
            <p>ថ្នាក់៖ <span className="underline">{classInfo.gradeClass}</span></p>
            <p>ឆ្នាំសិក្សា៖ <span className="underline">{toKhmerDigits(classInfo.academicYear)}</span></p>
            <p>គ្រូបន្ទុកថ្នាក់៖ <span className="underline">{classInfo.classTeacher}</span></p>
          </div>
        </div>

        {/* DETAILED AGE TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-center text-[10px]">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="border border-black p-1.5 w-10">ល.រ</th>
                <th className="border border-black p-1.5 w-20">អត្តលេខ</th>
                <th className="border border-black p-1.5 text-left pl-3">នាមត្រកូល និងនាមខ្លួន (ឈ្មោះខ្មែរ)</th>
                <th className="border border-black p-1.5 text-left pl-3">ឈ្មោះជាអក្សរឡាតាំង (English Name)</th>
                <th className="border border-black p-1.5 w-12">ភេទ</th>
                <th className="border border-black p-1.5 w-24">ថ្ងៃ ខែ ឆ្នាំកំណើត</th>
                <th className="border border-black p-1.5 w-12">អាយុ</th>
                <th className="border border-black p-1.5 text-left pl-3">សង្កេត/ផ្សេងៗ</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const age = getStudentAge(student.dob, classInfo.academicYear);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="border border-black p-1.5 font-mono">{toKhmerDigits(idx + 1)}</td>
                    <td className="border border-black p-1.5 font-mono">{student.id}</td>
                    <td className="border border-black p-1.5 text-left pl-3 font-bold">{student.nameKh}</td>
                    <td className="border border-black p-1.5 text-left pl-3 font-mono uppercase">{student.nameEn}</td>
                    <td className="border border-black p-1.5">{student.gender}</td>
                    <td className="border border-black p-1.5 font-mono">{student.dob}</td>
                    <td className="border border-black p-1.5 font-mono">{toKhmerDigits(age)}</td>
                    <td className="border border-black p-1.5 text-left pl-3 text-[9px] text-gray-500">
                      {student.status === 'abandoned' ? 'បោះបង់' : student.status === 'transferred' ? 'ផ្ទេរចេញ' : 'កំពុងសិក្សា'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={6} className="border border-black p-1.5 text-right pr-4">អាយុសរុបរួម / មធ្យមភាគអាយុ៖</td>
                <td className="border border-black p-1.5 font-mono">{toKhmerDigits(totalAge)}</td>
                <td className="border border-black p-1.5 text-left pl-3 font-mono">មធ្យម៖ {toKhmerDigits(avgAge)} ឆ្នាំ</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footers */}
        <div className="grid grid-cols-2 text-center text-[10px] pt-4 gap-4">
          <div className="space-y-12">
            <div className="italic text-gray-500">បានឃើញ និងបញ្ជាក់ត្រឹមត្រូវ</div>
            <div className="space-y-1 font-bold">
              <div>នាយកសាលាបឋមសិក្សា</div>
              <div className="text-gray-300">....................................................</div>
            </div>
          </div>
          <div className="space-y-12">
            <div className="italic text-gray-500">ថ្ងៃទី........ខែ........ឆ្នាំ........ ព.ស.២៥៧០</div>
            <div className="space-y-1 font-bold">
              <div>គ្រូបន្ទុកថ្នាក់</div>
              <div className="underline text-gray-900 block">{classInfo.classTeacher}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificateContent = () => {
    if (!selectedStudent) {
      return (
        <div className="text-center py-12 text-gray-500 font-sans">
          សូមជ្រើសរើសសិស្សដើម្បីបង្ហាញប័ណ្ណសរសើរ។
        </div>
      );
    }

    // Get rank of this student from summary
    const studentSum = studentSummary;
    let rankText = '—';
    if (studentSum) {
      rankText = toKhmerDigits(studentSum.yearEndRank);
    }
    
    const displayRank = certCustomRank || `ចំណាត់ថ្នាក់ទី ${rankText}`;

    return (
      <div id="print-certificate" className="relative p-8 bg-white text-black font-sans min-h-[500px] flex flex-col justify-between overflow-hidden">
        {/* PREMIUM DOUBLE GOLD BORDER */}
        <div className="absolute inset-4 border-[6px] border-amber-600 rounded-lg pointer-events-none" />
        <div className="absolute inset-6 border-[2px] border-amber-400 rounded-md pointer-events-none" />
        
        {/* ORNATE CORNERS */}
        <div className="absolute top-8 left-8 text-amber-600 font-extrabold text-lg select-none">✥</div>
        <div className="absolute top-8 right-8 text-amber-600 font-extrabold text-lg select-none">✥</div>
        <div className="absolute bottom-8 left-8 text-amber-600 font-extrabold text-lg select-none">✥</div>
        <div className="absolute bottom-8 right-8 text-amber-600 font-extrabold text-lg select-none">✥</div>

        <div className="relative z-10 space-y-4 px-8 py-4">
          {/* KINGDOM HEADERS */}
          <div className="text-center space-y-1">
            <h1 className="font-moul text-[13px] text-amber-950 tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</h1>
            <h2 className="font-moul text-[10px] text-amber-900 tracking-normal">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
            <div className="flex justify-center">
              <span className="text-amber-600 text-xs tracking-widest font-bold">✥ ✥ ✥</span>
            </div>
          </div>

          {/* SCHOOL INFORMATION */}
          <div className="text-left text-[10px] font-bold text-gray-800 space-y-0.5">
            <div>មន្ទីរអប់រំ យុវជន និងកីឡាខេត្ត៖ <span className="underline">{schoolProvince}</span></div>
            <div>ការិយាល័យអប់រំ យុវជន និងកីឡាស្រុក៖ <span className="underline">{schoolDistrict}</span></div>
            <div>សាលាបឋមសិក្សា៖ <span className="underline">{classInfo.schoolName}</span></div>
            <div>ក្រុមកល្យាណសាលា៖ <span className="underline">{schoolCluster}</span></div>
          </div>

          {/* MAIN CERTIFICATE TITLE */}
          <div className="text-center py-2">
            <h2 className="font-moul text-2xl text-red-700 tracking-widest uppercase drop-shadow-sm filter">ប័ណ្ណសរសើរ</h2>
            <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-1" />
          </div>

          {/* RECIPIENT AND PERFORMANCE STATEMENT */}
          <div className="text-center space-y-4 font-sans text-xs max-w-xl mx-auto leading-relaxed">
            <p className="font-moul text-sm text-amber-950">នាយកសាលាបឋមសិក្សា {classInfo.schoolName}</p>
            
            <p className="text-[11px] font-medium">សូមជូនប័ណ្ណសរសើរនេះចំពោះ៖</p>
            
            <div className="py-1">
              <span className="font-moul text-base text-indigo-950 border-b-2 border-dashed border-amber-600 px-6 pb-1">
                {selectedStudent.gender === 'ស្រី' ? 'កុមារី' : 'កុមារ'} {selectedStudent.nameKh}
              </span>
            </div>

            <p className="text-[11px] font-medium">
              ជាសិស្សថ្នាក់ទី៖ <strong className="font-bold underline text-amber-950">{classInfo.gradeClass}</strong> នៃឆ្នាំសិក្សា៖ <strong className="font-mono font-bold underline text-amber-950">{toKhmerDigits(classInfo.academicYear)}</strong>
            </p>

            <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl inline-block px-8">
              <p className="font-moul text-xs text-amber-900 leading-normal">
                {displayRank}
              </p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">
                ដែលមានសីលធម៌ល្អ សុជីវធម៌ថ្លៃថ្នូរ និងខិតខំប្រឹងប្រែងរៀនសូត្រទទួលបានលទ្ធផលល្អគួរជាទីមោទនៈ។
              </p>
            </div>
          </div>

          {/* SIGNATURES AND DATES */}
          <div className="grid grid-cols-2 text-center text-[10px] pt-6 gap-6">
            <div className="space-y-12">
              <div className="font-bold text-gray-800 font-sans">បានឃើញ និងបញ្ជាក់ត្រឹមត្រូវ<br />នាយកសាលាបឋមសិក្សា</div>
              <div className="space-y-1 font-bold">
                <div className="text-gray-300">....................................................</div>
              </div>
            </div>
            
            <div className="space-y-12">
              <div className="space-y-1 font-bold text-gray-800">
                <div className="italic text-gray-500 font-normal">{certLunarDate}</div>
                <div>{certSolarDate}</div>
                <div className="pt-2 font-sans">គ្រូបន្ទុកថ្នាក់</div>
              </div>
              <div className="space-y-1 font-bold">
                <div className="underline text-gray-900 block font-sans">{classInfo.classTeacher}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentContent = () => {

    if (docType === 'tracker') {
      if (!selectedStudent) {
        return (
          <div className="text-center py-12 text-gray-500 font-sans">
            សូមជ្រើសរើសសិស្សដើម្បីបង្ហាញព័ត៌មានតាមដាន។
          </div>
        );
      }

      // Compute dynamic metrics for the selected period
      const { total, average, rank } = getPeriodMetrics();
      const { excused, unexcused } = getPeriodAttendance(selectedStudentId, selectedPeriod);

      // Find Khmer label for selected period
      const getPeriodLabelKh = () => {
        if (selectedPeriod === 'yearEnd') return 'លទ្ធផលប្រចាំឆ្នាំ (Year End Average)';
        if (selectedPeriod === 'semester1') return 'មធ្យមភាគ ឆមាសទី១ (Semester 1 Average)';
        if (selectedPeriod === 'semester2') return 'មធ្យមភាគ ឆមាសទី២ (Semester 2 Average)';
        const found = PERIODS.find(p => p.value === selectedPeriod);
        return found ? `${found.labelKh} ${found.isExam ? '🏆' : ''}` : selectedPeriod;
      };

      return (
        <div id="print-report-card" className="space-y-6 text-left text-black font-sans relative">
          
          {/* HEADER: MoEYS Emblem on left, Kingdom logo on right, Photo Box on far-right */}
          <div className="flex justify-between items-start gap-4 border-b-2 border-double border-indigo-900 pb-5">
            {/* Left side: MoEYS Emblem & School Details */}
            <div className="flex items-center gap-3.5 w-1/2">
              <div className="flex-shrink-0">
                {/* Embedded High Fidelity MoEYS Emblem */}
                <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="55" r="38" fill="#FBBF24" fillOpacity="0.15" />
                  <circle cx="50" cy="55" r="34" stroke="#D97706" strokeWidth="2.5" fill="#1E3A8A" />
                  <circle cx="50" cy="55" r="28" stroke="#FBBF24" strokeWidth="1.5" />
                  <path d="M50 5 C53 15 57 18 57 23 C57 28 53 30 50 30 C47 30 43 28 43 23 C43 18 47 15 50 5 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
                  <path d="M50 10 C51.5 16 54 18 54 22 C54 25 52 27 50 27 C48 27 46 25 46 22 C46 18 48.5 16 50 10 Z" fill="#FCD34D" />
                  <path d="M30 40 C25 48 30 55 35 55" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M70 40 C75 48 70 55 65 55" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M38 68 L62 68 L58 75 L42 75 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                  <path d="M44 60 L56 60 L50 68 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />
                  <path d="M36 50 Q50 45 64 50 L64 58 Q50 53 36 58 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
                  <path d="M50 48 L50 56" stroke="#D97706" strokeWidth="1" />
                  <line x1="50" y1="35" x2="50" y2="42" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="36" y1="41" x2="42" y2="45" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="64" y1="41" x2="58" y2="45" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="space-y-1 text-left">
                <p className="font-moul text-[11px] text-gray-900 leading-normal">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                <p className="font-sans text-xs text-gray-800 leading-relaxed font-semibold">សាលាបឋមសិក្សា៖ <span className="underline decoration-dotted">{classInfo.schoolName || 'គំរូពញាក្រែក'}</span></p>
                <p className="font-sans text-xs text-gray-750 leading-relaxed">គ្រូបន្ទុកថ្នាក់៖ <span className="font-semibold">{classInfo.classTeacher || 'កែវ ច័ន្ទតារា'}</span></p>
              </div>
            </div>

            {/* Middle: Kingdom details & Core Title */}
            <div className="text-center flex-1 space-y-1.5 self-center">
              <h1 className="font-moul text-sm text-gray-900 leading-normal">ព្រះរាជាណាចក្រកម្ពុជា</h1>
              <h2 className="font-moul text-[9px] text-gray-800 leading-normal">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
              <div className="flex justify-center -mt-1">
                <span className="text-xs text-amber-600 tracking-widest font-bold">~ ~ ~ * ~ ~ ~</span>
              </div>
            </div>

            {/* Right side: Photo Frame 3x4 */}
            <div className="w-20 h-24 border border-dashed border-gray-400 bg-gray-50/50 rounded flex flex-col justify-center items-center text-[9px] text-gray-400 font-sans text-center px-1 select-none flex-shrink-0 self-start mt-1">
              <span>រូបថត ៣x៤</span>
              <span>(Photo 3x4)</span>
            </div>
          </div>

          {/* DOCUMENT BODY TITLE & META */}
          <div className="text-center space-y-2 py-4 border-t border-b border-black my-2">
            <h3 className="font-moul text-base text-gray-900 leading-normal tracking-wide uppercase">
              សៀវភៅតាមដានការសិក្សា និងការអប់រំសិស្ស
            </h3>
            <p className="font-sans text-xs text-gray-700 font-extrabold mt-1">
              (STUDENT GRADEBOOK REPORT CARD)
            </p>
            <div className="flex justify-center gap-6 mt-2 text-xs font-bold text-indigo-900 bg-slate-50 border border-slate-150 inline-flex px-6 py-1.5 rounded-xl">
              <span>ថ្នាក់រៀន៖ {classInfo.gradeClass || 'ថ្នាក់ទី ៥ អា'}</span>
              <span>•</span>
              <span>ឆ្នាំសិក្សា៖ {classInfo.academicYear || '២០២៤-២០២៥'}</span>
              <span>•</span>
              <span className="text-amber-800">រដូវកាល៖ {getPeriodLabelKh()}</span>
            </div>
          </div>

          {/* STUDENT DETAIL BAR */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl text-xs font-sans text-gray-700 mb-4">
            <div>
              <span className="text-gray-400 block font-medium mb-1">គោត្តនាម-នាមសិស្ស៖</span>
              <strong className="text-sm text-gray-950 font-moul font-normal">{selectedStudent.nameKh}</strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium mb-1">អក្សរឡាតាំង (Latin)៖</span>
              <strong className="text-sm text-gray-950 font-mono font-bold uppercase">{selectedStudent.nameEn}</strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium mb-1">ភេទ / អត្តសញ្ញាណ៖</span>
              <strong className="text-sm text-gray-950 font-semibold">{selectedStudent.gender} <span className="text-gray-400 font-mono font-normal">({selectedStudent.id})</span></strong>
            </div>
            <div>
              <span className="text-gray-400 block font-medium mb-1">ថ្ងៃខែឆ្នាំកំណើត (DOB)៖</span>
              <strong className="text-sm text-gray-950 font-mono font-bold">{selectedStudent.dob || '—'}</strong>
            </div>
          </div>

          {/* RESULTS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-left text-xs font-sans">
              <thead>
                <tr className="bg-gray-100 text-center font-bold text-xs border border-black">
                  <th rowSpan={2} className="border border-black px-1.5 py-2 w-10 text-center font-bold">ល.រ</th>
                  <th rowSpan={2} className="border border-black px-3 py-2 text-left w-48 font-bold">មុខវិជ្ជា (Subjects)</th>
                  <th colSpan={2} className="border border-black px-1 py-1 w-32 font-bold text-center">លទ្ធផលការសិក្សា (Results)</th>
                  <th colSpan={2} className="border border-black px-1 py-1 w-24 font-bold text-center">អវត្តមាន (Absences)</th>
                  <th rowSpan={2} className="border border-black px-3 py-2 text-center w-52 font-bold">មូលវិចាររបស់គ្រូ (Remarks)</th>
                </tr>
                <tr className="bg-gray-550 text-gray-650 text-center border border-black font-bold text-[10px]">
                  <th className="border border-black px-1 py-1.5 w-16">ពិន្ទុ (Score)</th>
                  <th className="border border-black px-1 py-1.5 w-16">និទ្ទេស (Grade)</th>
                  <th className="border border-black px-1 py-1.5 w-12 text-green-700">ច្បាប់ (E)</th>
                  <th className="border border-black px-1 py-1.5 w-12 text-rose-700">ឥត (U)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'khmerComposition', labelKh: 'តែងសេចក្តី', labelEn: 'Composition' },
                  { key: 'khmerDictation', labelKh: 'សរសេរតាមអាន', labelEn: 'Dictation' },
                  { key: 'khmerReading', labelKh: 'អាន-សំណួរ', labelEn: 'Reading & Questions' },
                  { key: 'math', labelKh: 'គណិតវិទ្យា', labelEn: 'Mathematics' },
                  { key: 'science', labelKh: 'វិទ្យាសាស្ត្រ', labelEn: 'Science' },
                  { key: 'socialCivics', labelKh: 'សីលធម៌-ពលរដ្ឋ', labelEn: 'Moral & Civics' },
                  { key: 'socialGeography', labelKh: 'ភូមិវិទ្យា', labelEn: 'Geography' },
                  { key: 'socialHistory', labelKh: 'ប្រវត្តិវិទ្យា', labelEn: 'History' },
                  { key: 'socialArts', labelKh: 'គំនូរ-សិប្បកម្ម', labelEn: 'Drawing & Crafts' },
                  { key: 'artsPE', labelKh: 'អប់រំកាយ', labelEn: 'Physical Education' },
                  { key: 'lifeSkills', labelKh: 'បំណិនជីវិត', labelEn: 'Life Skills' },
                  { key: 'foreignLanguage', labelKh: 'ភាសាបរទេស', labelEn: 'Foreign Language' },
                ].map((sub, idx, arr) => {
                  const score = getStudentSubjectScore(selectedStudentId, sub.key as keyof SubjectScores, selectedPeriod);
                  const isLastRow = idx === arr.length - 1;

                  return (
                    <tr key={sub.key} className="hover:bg-gray-50/30 transition-colors border-b border-black">
                      {/* 1. index */}
                      <td className="border border-black px-1.5 py-1.5 text-center font-semibold font-mono text-gray-700">
                        {toKhmerDigits(idx + 1)}
                      </td>
                      {/* 2. subject label */}
                      <td className="border border-black px-3 py-1.5 font-semibold text-gray-950">
                        <div>{sub.labelKh}</div>
                        <div className="text-[9px] text-gray-400 font-normal uppercase leading-none">{sub.labelEn}</div>
                      </td>
                      {/* 3. subject score */}
                      <td className="border border-black px-1 py-1.5 text-center font-mono font-bold text-gray-900 bg-slate-50/20">
                        {score !== undefined ? toKhmerDigits(score.toFixed(1)) : '—'}
                      </td>
                      {/* 4. subject grade */}
                      <td className="border border-black px-1 py-1.5 text-center font-bold text-gray-900 font-sans">
                        {getSubjectGrade(score) || '—'}
                      </td>

                      {/* 5. Absences */}
                      <td className="border border-black px-1 py-1.5 text-center font-mono text-xs text-green-700 font-bold bg-green-50/10">
                        {isLastRow ? (excused > 0 ? toKhmerDigits(excused) : '០') : ''}
                      </td>
                      <td className="border border-black px-1 py-1.5 text-center font-mono text-xs text-rose-700 font-bold bg-rose-50/10">
                        {isLastRow ? (unexcused > 0 ? toKhmerDigits(unexcused) : '០') : ''}
                      </td>

                      {/* 6. Teacher's Evaluation Column - spans across all rows! */}
                      {idx === 0 ? (
                        <td rowSpan={arr.length} className="border border-black px-3 py-3 text-left font-sans text-xs bg-slate-50/5 align-top relative whitespace-pre-wrap max-w-[200px]">
                          <div className="space-y-3">
                            <p className="font-semibold text-indigo-950 italic underline decoration-indigo-200">
                              ការវាយតម្លៃស្វ័យប្រវត្តិ៖
                            </p>
                            <p className="text-gray-855 leading-relaxed bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs italic font-semibold">
                              "{average > 0 ? getResultComments(average) : 'មិនទាន់មានពិន្ទុគ្រប់គ្រាន់។'}"
                            </p>
                            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                              <span className="text-[9px] text-gray-400 block uppercase font-bold tracking-wider">សេចក្តីសង្កេតបន្ថែមរបស់គ្រូ៖</span>
                              <div className="space-y-4 pt-1">
                                <div className="border-b border-dotted border-gray-400 h-4"></div>
                                <div className="border-b border-dotted border-gray-400 h-4"></div>
                                <div className="border-b border-dotted border-gray-400 h-4"></div>
                                <div className="border-b border-dotted border-gray-400 h-4"></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}

                {/* METRICS SUMMARY ROWS */}
                <tr className="font-bold border border-black">
                  <td colSpan={2} className="border border-black px-3 py-2 text-right text-gray-900 bg-gray-50/50">សរុបពិន្ទុ (Total Score)៖</td>
                  <td className="border border-black px-1 py-2 text-center font-mono font-black text-gray-950 bg-indigo-50/30">
                    {total > 0 ? toKhmerDigits(total.toFixed(1)) : '—'}
                  </td>
                  <td colSpan={4} className="border border-black px-2 py-2 bg-white"></td>
                </tr>
                <tr className="font-bold border border-black">
                  <td colSpan={2} className="border border-black px-3 py-2 text-right text-gray-900 bg-gray-50/50">មធ្យមភាគ (Average Score)៖</td>
                  <td className="border border-black px-1 py-2 text-center font-mono font-black text-indigo-800 bg-indigo-50/50">
                    {average > 0 ? toKhmerDigits(average.toFixed(2)) : '—'}
                  </td>
                  <td colSpan={4} className="border border-black px-2 py-2 bg-white"></td>
                </tr>
                <tr className="font-bold border border-black">
                  <td colSpan={2} className="border border-black px-3 py-2 text-right text-amber-950 bg-amber-50/20">ចំណាត់ថ្នាក់សិស្ស (Student Rank)៖</td>
                  <td className="border border-black px-1 py-2 text-center font-mono font-black text-rose-700 bg-amber-50/40">
                    {rank > 0 ? toKhmerDigits(rank) : '—'}
                  </td>
                  <td colSpan={4} className="border border-black px-2 py-2 bg-white"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SIGNATURES AND APPROVAL RULES FOOTER */}
          <div className="grid grid-cols-3 text-center text-xs font-sans mt-8 pt-6 gap-4 border-t border-dashed border-gray-200">
            {/* Column 1: Parent and General notes */}
            <div className="space-y-1 text-left flex flex-col justify-between">
              <div>
                <p className="font-bold text-gray-900 leading-normal">ព័ត៌មានស្ថិតិ៖</p>
                <p className="text-[10px] text-gray-600 font-medium">
                  • សិស្សសរុប៖ <strong>{toKhmerDigits(students.length)}</strong> នាក់ (ស្រី <strong>{toKhmerDigits(students.filter(s => s.gender === 'ស្រី').length)}</strong>)
                </p>
                <div className="border-t border-dashed border-gray-200 mt-2 pt-2">
                  <p className="font-bold text-gray-900 leading-normal">មតិយោបល់អាណាព្យាបាល៖</p>
                  <div className="space-y-4 pt-1">
                    <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                    <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                    <div className="border-b border-dotted border-gray-400 w-full h-4"></div>
                  </div>
                </div>
              </div>
              <div className="text-center pt-4">
                <p className="font-moul text-[9px] text-gray-800">ហត្ថលេខាអាណាព្យាបាល</p>
                <div className="h-10" />
                <p className="text-gray-300">............................................</p>
              </div>
            </div>

            {/* Column 2: Principal Stamp Approval */}
            <div className="space-y-1 flex flex-col justify-between items-center">
              <div className="text-center">
                <p className="font-bold text-gray-900">បានឃើញ និងឯកភាព</p>
                <p className="font-moul text-[9px] text-gray-800 mt-0.5">នាយកសាលាបឋមសិក្សា</p>
              </div>
              <div className="h-20 flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-dashed border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold text-[8px] uppercase select-none tracking-tighter transform -rotate-12">
                  សាលាដៅតំរូវ
                </div>
              </div>
              <div className="text-center w-full">
                <p className="text-gray-350 text-[10px]">............................................</p>
              </div>
            </div>

            {/* Column 3: Class Teacher Dates & Name */}
            <div className="space-y-1 text-center flex flex-col justify-between items-center">
              <div className="space-y-1 text-center">
                <p className="italic text-gray-700 text-[10px] leading-relaxed">{certLunarDate}</p>
                <p className="text-gray-900 text-xs font-semibold">{certSolarDate}</p>
                <p className="font-moul text-[9px] text-gray-800 mt-0.5">គ្រូបន្ទុកថ្នាក់</p>
              </div>
              <div className="h-14" />
              <div className="text-center">
                <p className="font-bold text-gray-900 underline block font-sans text-xs">{classInfo.classTeacher}</p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (docType === 'biography') {
      // General rank helper for subjects
      const getSubjectRankForPeriod = (studentId: string, subKey: keyof SubjectScores, period: 'semester1' | 'semester2' | 'yearEnd'): string | number => {
        const studentScores = students.map(s => {
          const val = getStudentSubjectScore(s.id, subKey, period);
          return { id: s.id, val: val !== undefined ? val : -1 };
        });
        
        const validScores = studentScores.filter(s => s.val >= 0);
        if (validScores.length === 0) return '—';
        
        const currentObj = validScores.find(s => s.id === studentId);
        if (!currentObj || currentObj.val === -1) return '—';

        validScores.sort((a, b) => b.val - a.val);

        let rank = 1;
        for (let i = 0; i < validScores.length; i++) {
          if (i > 0 && validScores[i].val < validScores[i - 1].val) {
            rank = i + 1;
          }
          if (validScores[i].id === studentId) {
            return rank;
          }
        }
        return '—';
      };

      // Khmer Average helpers
      const getKhmerAverageForPeriod = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): number | undefined => {
        const c = getStudentSubjectScore(studentId, 'khmerComposition', period);
        const d = getStudentSubjectScore(studentId, 'khmerDictation', period);
        const r = getStudentSubjectScore(studentId, 'khmerReading', period);
        const arr = [c, d, r].filter(v => v !== undefined) as number[];
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
      };

      const getKhmerAverageRank = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): string | number => {
        const studentScores = students.map(s => {
          const val = getKhmerAverageForPeriod(s.id, period);
          return { id: s.id, val: val !== undefined ? val : -1 };
        });
        
        const validScores = studentScores.filter(s => s.val >= 0);
        if (validScores.length === 0) return '—';
        
        const currentObj = validScores.find(s => s.id === studentId);
        if (!currentObj || currentObj.val === -1) return '—';

        validScores.sort((a, b) => b.val - a.val);

        let rank = 1;
        for (let i = 0; i < validScores.length; i++) {
          if (i > 0 && validScores[i].val < validScores[i - 1].val) {
            rank = i + 1;
          }
          if (validScores[i].id === studentId) {
            return rank;
          }
        }
        return '—';
      };

      // Social Average helpers
      const getSocialAverageForPeriod = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): number | undefined => {
        const civ = getStudentSubjectScore(studentId, 'socialCivics', period);
        const geo = getStudentSubjectScore(studentId, 'socialGeography', period);
        const his = getStudentSubjectScore(studentId, 'socialHistory', period);
        const arr = [civ, geo, his].filter(v => v !== undefined) as number[];
        return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined;
      };

      const getSocialAverageRank = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): string | number => {
        const studentScores = students.map(s => {
          const val = getSocialAverageForPeriod(s.id, period);
          return { id: s.id, val: val !== undefined ? val : -1 };
        });
        
        const validScores = studentScores.filter(s => s.val >= 0);
        if (validScores.length === 0) return '—';
        
        const currentObj = validScores.find(s => s.id === studentId);
        if (!currentObj || currentObj.val === -1) return '—';

        validScores.sort((a, b) => b.val - a.val);

        let rank = 1;
        for (let i = 0; i < validScores.length; i++) {
          if (i > 0 && validScores[i].val < validScores[i - 1].val) {
            rank = i + 1;
          }
          if (validScores[i].id === studentId) {
            return rank;
          }
        }
        return '—';
      };

      // Overall Average Helpers
      const getOverallAverageForPeriod = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): number | undefined => {
        const s = globalSummary.find(x => x.studentId === studentId);
        if (!s) return undefined;
        if (period === 'semester1') return s.s1Avg;
        if (period === 'semester2') return s.s2Avg;
        return s.yearEndAvg;
      };

      const getOverallRankForPeriod = (studentId: string, period: 'semester1' | 'semester2' | 'yearEnd'): string | number => {
        const s = globalSummary.find(x => x.studentId === studentId);
        if (!s) return '—';
        const rankVal = period === 'semester1' ? s.s1Rank : period === 'semester2' ? s.s2Rank : s.yearEndRank;
        return rankVal > 0 ? rankVal : '—';
      };

      // Attendance values
      const s1Attendance = getPeriodAttendance(selectedStudentId, 'semester1');
      const s2Attendance = getPeriodAttendance(selectedStudentId, 'semester2');
      const yearAttendance = getPeriodAttendance(selectedStudentId, 'yearEnd');

      // Score formatter helper (e.g., converts 8.5 to "៨,៥០")
      const formatScoreKhmer = (score: number | undefined): string => {
        if (score === undefined) return '—';
        const formatted = score.toFixed(2);
        const khDigits = toKhmerDigits(formatted);
        return khDigits.replace('.', ',');
      };

      const subjectsList = [
        { key: 'khmerComposition', labelKh: 'តែងសេចក្តី', labelEn: 'Composition' },
        { key: 'khmerDictation', labelKh: 'សរសេរតាមអាន', labelEn: 'Dictation' },
        { key: 'khmerReading', labelKh: 'អាន-សំណួរ', labelEn: 'Reading & Questions' },
        { key: 'math', labelKh: 'គណិតវិទ្យា', labelEn: 'Mathematics' },
        { key: 'science', labelKh: 'វិទ្យាសាស្ត្រ', labelEn: 'Science' },
        { key: 'socialCivics', labelKh: 'សីលធម៌-ពលរដ្ឋ', labelEn: 'Moral & Civics' },
        { key: 'socialGeography', labelKh: 'ភូមិវិទ្យា', labelEn: 'Geography' },
        { key: 'socialHistory', labelKh: 'ប្រវត្តិវិទ្យា', labelEn: 'History' },
        { key: 'socialArts', labelKh: 'គំនូរ-សិប្បកម្ម', labelEn: 'Drawing & Crafts' },
        { key: 'artsPE', labelKh: 'អប់រំកាយ', labelEn: 'Physical Education' },
        { key: 'lifeSkills', labelKh: 'បំណិនជីវិត', labelEn: 'Life Skills' },
        { key: 'foreignLanguage', labelKh: 'ភាសាបរទេស', labelEn: 'Foreign Language' },
      ] as const;

      return (
        <div id="print-biography" className="space-y-6 text-left text-black font-sans relative">
          {/* TOP HEADER SECTION */}
          <div className="grid grid-cols-3 items-start pb-4 border-b border-gray-300">
            {/* Left Column: Logos & School Info */}
            <div className="text-left space-y-1 pt-1">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-10 h-10 bg-gradient-to-b from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="leading-tight">
                  <p className="font-moul text-[7px] text-gray-800 leading-none">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                  <p className="text-[6px] text-gray-400 font-sans uppercase font-bold leading-none tracking-tighter">Ministry of Education</p>
                </div>
              </div>
              <p className="font-sans text-[10px] text-gray-800">រដ្ឋបាលខេត្ត៖ <span className="font-bold underline decoration-dotted">{schoolProvince || 'បាត់ដំបង'}</span></p>
              <p className="font-sans text-[10px] text-gray-800">ការិយាល័យអប់រំ៖ <span className="font-bold underline decoration-dotted">{schoolDistrict || 'សង្កែ'}</span></p>
              <p className="font-sans text-[10px] text-gray-800">សាលាបឋមសិក្សា៖ <span className="font-bold underline decoration-dotted">{classInfo.schoolName || 'គំរូពញាក្រែក'}</span></p>
            </div>

            {/* Center Column: Royal Kingdom Text */}
            <div className="text-center space-y-1 col-span-1">
              <h1 className="font-moul text-[11px] text-gray-900 tracking-wide uppercase leading-normal">
                ព្រះរាជាណាចក្រកម្ពុជា
              </h1>
              <h2 className="font-moul text-[8px] text-gray-700 tracking-wider">
                ជាតិ សាសនា ព្រះមហាក្សត្រ
              </h2>
              <div className="flex justify-center items-center gap-0.5 text-gray-400 -mt-0.5">
                <span>~</span><span>~</span><span>~</span><span>~</span><span>~</span>
              </div>
            </div>

            {/* Right Column: Empty or photo placeholder */}
            <div className="text-right flex justify-end">
              <div className="w-16 h-20 border border-gray-300 rounded bg-slate-50/50 flex flex-col items-center justify-center text-center text-[7px] text-gray-400 select-none">
                <span>រូបថត</span>
                <span>៤ x ៦</span>
              </div>
            </div>
          </div>

          {/* DOCUMENT HEADER */}
          <div className="text-center space-y-1.5 py-2">
            <h3 className="font-moul text-base text-gray-900 leading-normal uppercase">
              សៀវភៅសិក្ខាគារិក
            </h3>
            <div className="text-xs font-sans text-gray-700 font-bold bg-slate-50 border border-slate-200/60 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1.5 rounded-xl">
              <span>ឈ្មោះសិស្ស និងភាសាឡាតាំង៖ <strong className="font-moul font-normal text-indigo-900">{selectedStudent.nameKh}</strong> (<strong className="font-mono text-indigo-900 uppercase">{selectedStudent.nameEn}</strong>)</span>
              <span>•</span>
              <span>ថ្នាក់ទី៖ <strong className="text-indigo-900">{classInfo.gradeClass || '៥(ខ)'}</strong></span>
              <span>•</span>
              <span>ឆ្នាំសិក្សា៖ <strong className="text-indigo-900">{classInfo.academicYear || '២០២៤-២០២៥'}</strong></span>
            </div>
            <p className="font-moul text-[10px] text-gray-600 tracking-widest uppercase pt-1">
              លទ្ធផលនៃការសិក្សា
            </p>
          </div>

          {/* STUDY RESULTS TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-black text-center text-xs font-sans">
              <thead>
                <tr className="bg-[#2f5597] text-white font-bold border-b border-black">
                  <th rowSpan={2} className="border border-black px-3 py-3.5 text-left w-52 font-bold text-xs">មុខវិជ្ជា (Subjects)</th>
                  <th colSpan={2} className="border border-black px-1 py-1.5 font-bold w-28 text-center text-xs">ឆមាសទី១ (Semester 1)</th>
                  <th colSpan={2} className="border border-black px-1 py-1.5 font-bold w-28 text-center text-xs">ឆមាសទី២ (Semester 2)</th>
                  <th colSpan={2} className="border border-black px-1 py-1.5 font-bold w-28 text-center text-xs">ប្រចាំឆ្នាំ (Year End)</th>
                  <th rowSpan={2} className="border border-black px-2 py-3.5 text-center w-48 font-bold text-xs">ហត្ថលេខា ឬសេចក្តីសង្កេត</th>
                </tr>
                <tr className="bg-[#2f5597] text-white font-bold border-b border-black text-[9px]">
                  <th className="border border-black px-1 py-1 w-14">ពិន្ទុ</th>
                  <th className="border border-black px-1 py-1 w-14">ច.ថ្នាក់</th>
                  <th className="border border-black px-1 py-1 w-14">ពិន្ទុ</th>
                  <th className="border border-black px-1 py-1 w-14">ច.ថ្នាក់</th>
                  <th className="border border-black px-1 py-1 w-14">ពិន្ទុ</th>
                  <th className="border border-black px-1 py-1 w-14">ច.ថ្នាក់</th>
                </tr>
              </thead>
              <tbody>
                {subjectsList.map((sub, idx) => {
                  const s1 = getStudentSubjectScore(selectedStudentId, sub.key, 'semester1');
                  const r1 = getSubjectRankForPeriod(selectedStudentId, sub.key, 'semester1');
                  const s2 = getStudentSubjectScore(selectedStudentId, sub.key, 'semester2');
                  const r2 = getSubjectRankForPeriod(selectedStudentId, sub.key, 'semester2');
                  const ye = getStudentSubjectScore(selectedStudentId, sub.key, 'yearEnd');
                  const rye = getSubjectRankForPeriod(selectedStudentId, sub.key, 'yearEnd');

                  return (
                    <tr key={sub.key} className="border-b border-black hover:bg-slate-50 transition-colors h-8">
                      {/* Subject Name */}
                      <td className="border border-black px-3 py-1 text-left font-semibold text-gray-950">
                        <div>{sub.labelKh}</div>
                        <div className="text-[9px] text-gray-400 font-normal uppercase leading-none">{sub.labelEn}</div>
                      </td>
                      {/* S1 score */}
                      <td className="border border-black px-1 font-mono font-medium text-gray-800">
                        {formatScoreKhmer(s1)}
                      </td>
                      {/* S1 rank */}
                      <td className="border border-black px-1 font-sans font-bold text-red-600 text-center">
                        {r1 !== '—' ? r1 : '—'}
                      </td>
                      {/* S2 score */}
                      <td className="border border-black px-1 font-mono font-medium text-gray-800">
                        {formatScoreKhmer(s2)}
                      </td>
                      {/* S2 rank */}
                      <td className="border border-black px-1 font-sans font-bold text-red-600 text-center">
                        {r2 !== '—' ? r2 : '—'}
                      </td>
                      {/* Year end score */}
                      <td className="border border-black px-1 font-mono font-bold text-indigo-900 bg-indigo-50/10">
                        {formatScoreKhmer(ye)}
                      </td>
                      {/* Year end rank */}
                      <td className="border border-black px-1 font-sans font-extrabold text-red-600 bg-indigo-50/10 text-center">
                        {rye !== '—' ? rye : '—'}
                      </td>
                      {/* Teacher's signature/remarks */}
                      <td className="border border-black px-2 text-center text-[10px] text-gray-300 italic font-light select-none">
                        {/* Placeholder */}
                      </td>
                    </tr>
                  );
                })}

                {/* Khmer Average Row */}
                <tr className="border-b border-black bg-slate-50/65 font-bold h-8">
                  <td className="border border-black px-3 py-1 text-left font-bold text-gray-950">
                    <div>មធ្យមភាគភាសាខ្មែរ</div>
                    <div className="text-[9px] text-gray-400 font-normal uppercase leading-none">Khmer Average</div>
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getKhmerAverageForPeriod(selectedStudentId, 'semester1'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getKhmerAverageRank(selectedStudentId, 'semester1')}
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getKhmerAverageForPeriod(selectedStudentId, 'semester2'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getKhmerAverageRank(selectedStudentId, 'semester2')}
                  </td>
                  <td className="border border-black px-1 font-mono text-indigo-900 bg-indigo-50/20">
                    {formatScoreKhmer(getKhmerAverageForPeriod(selectedStudentId, 'yearEnd'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 bg-indigo-50/20 text-center">
                    {getKhmerAverageRank(selectedStudentId, 'yearEnd')}
                  </td>
                  <td className="border border-black px-2 text-center text-[10px] text-gray-400">
                    {/* Placeholder */}
                  </td>
                </tr>

                {/* Math Average Row */}
                <tr className="border-b border-black bg-slate-50/65 font-bold h-8">
                  <td className="border border-black px-3 py-1 text-left font-bold text-gray-955">
                    <div>មធ្យមភាគគណិតវិទ្យា</div>
                    <div className="text-[9px] text-gray-400 font-normal uppercase leading-none">Mathematics Average</div>
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getStudentSubjectScore(selectedStudentId, 'math', 'semester1'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getSubjectRankForPeriod(selectedStudentId, 'math', 'semester1')}
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getStudentSubjectScore(selectedStudentId, 'math', 'semester2'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getSubjectRankForPeriod(selectedStudentId, 'math', 'semester2')}
                  </td>
                  <td className="border border-black px-1 font-mono text-indigo-900 bg-indigo-50/20">
                    {formatScoreKhmer(getStudentSubjectScore(selectedStudentId, 'math', 'yearEnd'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 bg-indigo-50/20 text-center">
                    {getSubjectRankForPeriod(selectedStudentId, 'math', 'yearEnd')}
                  </td>
                  <td className="border border-black px-2 text-center text-[10px] text-gray-400">
                    {/* Placeholder */}
                  </td>
                </tr>

                {/* Social Average Row */}
                <tr className="border-b border-black bg-slate-50/65 font-bold h-8">
                  <td className="border border-black px-3 py-1 text-left font-bold text-gray-955">
                    <div>មធ្យមភាគសិក្សាសង្គម</div>
                    <div className="text-[9px] text-gray-400 font-normal uppercase leading-none">Social Studies Average</div>
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getSocialAverageForPeriod(selectedStudentId, 'semester1'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getSocialAverageRank(selectedStudentId, 'semester1')}
                  </td>
                  <td className="border border-black px-1 font-mono text-gray-900">
                    {formatScoreKhmer(getSocialAverageForPeriod(selectedStudentId, 'semester2'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-center">
                    {getSocialAverageRank(selectedStudentId, 'semester2')}
                  </td>
                  <td className="border border-black px-1 font-mono text-indigo-900 bg-indigo-50/20">
                    {formatScoreKhmer(getSocialAverageForPeriod(selectedStudentId, 'yearEnd'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 bg-indigo-50/20 text-center">
                    {getSocialAverageRank(selectedStudentId, 'yearEnd')}
                  </td>
                  <td className="border border-black px-2 text-center text-[10px] text-gray-400">
                    {/* Placeholder */}
                  </td>
                </tr>

                {/* Overall Average Row */}
                <tr className="border-b-2 border-black bg-indigo-50/30 font-black h-9 text-indigo-950">
                  <td className="border border-black px-3 py-1 text-left font-black text-indigo-950">
                    <div>មធ្យមភាគរួមប្រចាំឆមាស/ឆ្នាំ</div>
                    <div className="text-[9px] text-indigo-700 font-normal uppercase leading-none">Overall average</div>
                  </td>
                  <td className="border border-black px-1 font-mono text-indigo-950 text-sm">
                    {formatScoreKhmer(getOverallAverageForPeriod(selectedStudentId, 'semester1'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-sm text-center">
                    {getOverallRankForPeriod(selectedStudentId, 'semester1')}
                  </td>
                  <td className="border border-black px-1 font-mono text-indigo-950 text-sm">
                    {formatScoreKhmer(getOverallAverageForPeriod(selectedStudentId, 'semester2'))}
                  </td>
                  <td className="border border-black px-1 font-sans text-red-600 text-sm text-center">
                    {getOverallRankForPeriod(selectedStudentId, 'semester2')}
                  </td>
                  <td className="border-2 border-indigo-600 px-1 font-mono text-indigo-950 text-base bg-amber-50/25">
                    {formatScoreKhmer(getOverallAverageForPeriod(selectedStudentId, 'yearEnd'))}
                  </td>
                  <td className="border-2 border-indigo-600 px-1 font-sans text-red-600 text-base bg-amber-50/25 text-center">
                    {getOverallRankForPeriod(selectedStudentId, 'yearEnd')}
                  </td>
                  <td className="border border-black px-2 text-center text-[11px] font-bold text-indigo-900 uppercase">
                    {getOverallAverageForPeriod(selectedStudentId, 'yearEnd') && getOverallAverageForPeriod(selectedStudentId, 'yearEnd')! >= 5.0 ? 'ជាប់ (PASS) ✅' : 'ធ្លាក់ (FAIL) ❌'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ATTENDANCE SECTION */}
          <div className="mt-4">
            <h4 className="font-moul text-[10px] text-gray-900 text-center mb-1.5 uppercase">
              ចំនួនអវត្តមានក្នុងឆ្នាំសិក្សា
            </h4>
            <table className="w-full max-w-lg mx-auto border-collapse border border-black text-center text-xs font-sans">
              <thead>
                <tr className="bg-[#2f5597] text-white font-bold border-b border-black">
                  <th className="border border-black px-3 py-1 font-bold text-center text-[10px]">លក្ខខណ្ឌអវត្តមាន (Absences)</th>
                  <th className="border border-black px-3 py-1 font-bold w-28 text-center text-[10px]">ឆមាសទី១ (Semester 1)</th>
                  <th className="border border-black px-3 py-1 font-bold w-28 text-center text-[10px]">ឆមាសទី២ (Semester 2)</th>
                  <th className="border border-black px-3 py-1 font-bold w-28 text-center text-[10px]">ប្រចាំឆ្នាំ (Year End)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-black h-7 text-[11px]">
                  <td className="border border-black px-3 py-0.5 text-left font-medium text-gray-800">
                    ច្បាប់ (Excused Absence - E)
                  </td>
                  <td className="border border-black px-1 font-mono font-semibold text-green-700">
                    {s1Attendance.excused > 0 ? toKhmerDigits(s1Attendance.excused) : '០'}
                  </td>
                  <td className="border border-black px-1 font-mono font-semibold text-green-700">
                    {s2Attendance.excused > 0 ? toKhmerDigits(s2Attendance.excused) : '០'}
                  </td>
                  <td className="border border-black px-1 font-mono font-bold text-green-700 bg-green-50/10">
                    {yearAttendance.excused > 0 ? toKhmerDigits(yearAttendance.excused) : '០'}
                  </td>
                </tr>
                <tr className="border-b border-black h-7 text-[11px]">
                  <td className="border border-black px-3 py-0.5 text-left font-medium text-gray-800">
                    ឥតច្បាប់ (Unexcused Absence - U)
                  </td>
                  <td className="border border-black px-1 font-mono font-semibold text-rose-700">
                    {s1Attendance.unexcused > 0 ? toKhmerDigits(s1Attendance.unexcused) : '០'}
                  </td>
                  <td className="border border-black px-1 font-mono font-semibold text-rose-700">
                    {s2Attendance.unexcused > 0 ? toKhmerDigits(s2Attendance.unexcused) : '០'}
                  </td>
                  <td className="border border-black px-1 font-mono font-bold text-rose-700 bg-rose-50/10">
                    {yearAttendance.unexcused > 0 ? toKhmerDigits(yearAttendance.unexcused) : '០'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DATES & SIGNATURES BLOCK */}
          <div className="pt-4 mt-4 border-t border-dashed border-gray-300">
            {/* Dates row */}
            <div className="text-right text-[11px] space-y-0.5 italic text-gray-800 pr-10">
              <p>{certLunarDate}</p>
              <p className="font-semibold not-italic">{certSolarDate}</p>
            </div>

            {/* Principal and Teacher layout */}
            <div className="grid grid-cols-2 text-center text-xs font-sans mt-3 gap-6">
              <div className="space-y-1">
                <p className="font-bold text-gray-900">បានឃើញ និងឯកភាព</p>
                <p className="font-moul text-[9px] text-gray-800">នាយកសាលាបឋមសិក្សា</p>
                <div className="h-16 flex items-center justify-center">
                  <div className="w-14 h-14 border-2 border-dashed border-red-500 rounded-full flex items-center justify-center text-red-500 font-bold text-[7px] uppercase select-none tracking-tighter transform -rotate-12">
                    សាលាដៅតំរូវ
                  </div>
                </div>
                <p className="text-gray-300">............................................</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-gray-950 opacity-0">.</p>
                <p className="font-moul text-[9px] text-gray-800">គ្រូបន្ទុកថ្នាក់</p>
                <div className="h-16" />
                <p className="font-bold text-gray-950 underline decoration-1 text-sm block leading-none pt-2 font-sans">
                  {classInfo.classTeacher}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (docType === 'ageSummary') {
      return renderAgeSummaryContent();
    } else {
      return renderAgeListContent();
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
          <button
            onClick={() => setDocType('ageSummary')}
            className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
              docType === 'ageSummary'
                ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" />
              តារាងស្រង់អាយុសិស្ស (២.ខ)
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDocType('ageList')}
            className={`w-full px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
              docType === 'ageList'
                ? 'bg-indigo-600 border-indigo-650 text-white shadow-xs'
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              តារាងបញ្ជីអាយុសិស្ស (លម្អិត)
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {docType !== 'ageSummary' && docType !== 'ageList' ? (
          <>
            {/* Academic Period Selector */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-1">
                រដូវកាលសិក្សា (Academic Period)
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-sans text-gray-750 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="yearEnd">លទ្ធផលប្រចាំឆ្នាំ (Year End)</option>
                <option value="semester1">មធ្យមភាគ ឆមាសទី១ (Semester 1)</option>
                <option value="semester2">មធ្យមភាគ ឆមាសទី២ (Semester 2)</option>
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.labelKh} {p.isExam ? '🏆' : ''} ({p.labelEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Navigator List */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 max-h-[50vh] flex flex-col">
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
          </>
        ) : docType === 'ageSummary' ? (
          /* Teacher Info & Stats Settings */
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto flex flex-col text-xs text-left">
            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">១. កំណត់ព័ត៌មានគ្រូ និងសាលា</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">រាជធានី/ខេត្ត</label>
                    <input 
                      type="text" 
                      value={schoolProvince} 
                      onChange={(e) => setSchoolProvince(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">ស្រុក/ខណ្ឌ</label>
                    <input 
                      type="text" 
                      value={schoolDistrict} 
                      onChange={(e) => setSchoolDistrict(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">ភេទគ្រូ</label>
                    <select 
                      value={teacherGender} 
                      onChange={(e) => setTeacherGender(e.target.value as 'ប្រុស' | 'ស្រី')} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    >
                      <option value="ស្រី">ស្រី</option>
                      <option value="ប្រុស">ប្រុស</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">អាយុគ្រូ (ឆ្នាំ)</label>
                    <input 
                      type="text" 
                      value={teacherAge} 
                      onChange={(e) => setTeacherAge(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">ជនជាតិដើមភាគតិច</label>
                    <input 
                      type="text" 
                      value={teacherIndigenous} 
                      onChange={(e) => setTeacherIndigenous(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">កម្រិតវប្បធម៌</label>
                    <input 
                      type="text" 
                      value={teacherEducation} 
                      onChange={(e) => setTeacherEducation(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">រយៈពេលបម្រើការងារ</label>
                    <input 
                      type="text" 
                      value={teacherExperience} 
                      onChange={(e) => setTeacherExperience(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">កម្រិតភារកិច្ច</label>
                    <input 
                      type="text" 
                      value={teacherTaskLevel} 
                      onChange={(e) => setTeacherTaskLevel(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">២. ចំនួនឆ្លងកាត់មត្តេយ្យ (ថ្នាក់ទី១)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-semibold text-gray-500 px-1">
                  <span>ប្រភេទសាលា</span>
                  <div className="flex gap-4">
                    <span>សរុប</span>
                    <span>ស្រី</span>
                  </div>
                </div>

                {[
                  { label: 'មត្តេយ្យរដ្ឋ', val: kindergartenStateTotal, setVal: setKindergartenStateTotal, fVal: kindergartenStateFemale, setFval: setKindergartenStateFemale },
                  { label: 'មត្តេយ្យឯកជន', val: kindergartenPrivateTotal, setVal: setKindergartenPrivateTotal, fVal: kindergartenPrivateFemale, setFval: setKindergartenPrivateFemale },
                  { label: 'មត្តេយ្យសហគមន៍', val: kindergartenCommunityTotal, setVal: setKindergartenCommunityTotal, fVal: kindergartenCommunityFemale, setFval: setKindergartenCommunityFemale },
                  { label: 'ការអប់រំតាមផ្ទះ', val: kindergartenHomeTotal, setVal: setKindergartenHomeTotal, fVal: kindergartenHomeFemale, setFval: setKindergartenHomeFemale },
                  { label: 'កម្មវិធីត្រៀមថ្នាក់ទី១', val: kindergartenPrepTotal, setVal: setKindergartenPrepTotal, fVal: kindergartenPrepFemale, setFval: setKindergartenPrepFemale },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-1.5 rounded-lg">
                    <span className="font-medium text-[10px] truncate w-24">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => item.setVal(Math.max(0, item.val - 1))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer">-</button>
                        <span className="w-4 text-center font-bold font-mono text-[10px]">{item.val}</span>
                        <button type="button" onClick={() => item.setVal(item.val + 1)} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer">+</button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => item.setFval(Math.max(0, item.fVal - 1))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer text-pink-650">-</button>
                        <span className="w-4 text-center font-bold font-mono text-[10px] text-pink-700">{item.fVal}</span>
                        <button type="button" onClick={() => item.setFval(Math.min(item.val, item.fVal + 1))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer text-pink-650">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">៣. ស្ថានភាព និងជនជាតិនៃសិស្សម្នាក់ៗ</h3>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {students.map((student) => {
                  const status = studentStatuses[student.id] || 'promoted';
                  const isInd = indigenousStudents[student.id] || false;
                  return (
                    <div key={student.id} className="bg-gray-50 p-2 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-800 text-[11px] truncate w-28">
                          {student.nameKh} <span className="text-[9px] font-normal text-gray-400">({student.gender})</span>
                        </span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isInd} 
                            onChange={(e) => setIndigenousStudents({ ...indigenousStudents, [student.id]: e.target.checked })}
                            className="w-3.5 h-3.5 accent-indigo-600 rounded"
                          />
                          <span className="text-[9px] font-bold text-gray-500">ជនជាតិភាគតិច</span>
                        </label>
                      </div>
                      <div className="flex gap-1">
                        {[
                          { key: 'new', label: 'សិស្សថ្មី' },
                          { key: 'promoted', label: 'ឡើងថ្នាក់' },
                          { key: 'repeating', label: 'ត្រួតថ្នាក់' },
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={() => setStudentStatuses({ ...studentStatuses, [student.id]: btn.key as any })}
                            className={`flex-1 py-1 rounded-md font-bold text-[9px] text-center transition-all cursor-pointer ${
                              status === btn.key 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-150'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">៤. ចំនួនសិស្សពិការ និងលំបាក</h3>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                {[
                  { key: 'mobility', label: '១. ពិការចលនា' },
                  { key: 'hearing', label: '២. ពិការការស្តាប់' },
                  { key: 'speech', label: '៣. ពិការការនិយាយ' },
                  { key: 'visual', label: '៤. ពិការការមើល' },
                  { key: 'intellectual', label: '៥. ពិការបញ្ញា' },
                  { key: 'learningDifficulty', label: '៦. ពិការការសិក្សា' },
                  { key: 'psychological', label: '៧. ពិការផ្លូវចិត្ត' },
                  { key: 'otherDisability', label: '៨. ពិការផ្សេងៗ' },
                  { key: 'noGuardian', label: '៩. គ្មានអាណាព្យាបាល' },
                  { key: 'chronicIllness', label: '១០. ជំងឺប្រចាំកាយ' },
                  { key: 'poorFamily', label: '១១. គ្រួសារក្រីក្រ' },
                  { key: 'orphan', label: '១២. កុមារកំព្រា' },
                  { key: 'hivAids', label: '១៣. រងគ្រោះដោយ HIV' },
                  { key: 'vulnerableFamily', label: '១៤. គ្រួសារងាយរងគ្រោះ' },
                  { key: 'drugAffected', label: '១៥. រងគ្រោះដោយគ្រឿងញៀន' },
                  { key: 'otherVulnerable', label: '១៦. ងាយរងគ្រោះដទៃទៀត' },
                ].map((item) => {
                  const counts = disabilityCounts[item.key] || { total: 0, female: 0 };
                  const setCounts = (newTotal: number, newFemale: number) => {
                    setDisabilityCounts({
                      ...disabilityCounts,
                      [item.key]: { total: newTotal, female: newFemale }
                    });
                  };
                  return (
                    <div key={item.key} className="flex justify-between items-center bg-gray-50 p-1.5 rounded-lg">
                      <span className="font-medium text-[10px] truncate w-24">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setCounts(Math.max(0, counts.total - 1), Math.min(counts.female, Math.max(0, counts.total - 1)))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer">-</button>
                          <span className="w-4 text-center font-bold font-mono text-[10px]">{counts.total}</span>
                          <button type="button" onClick={() => setCounts(counts.total + 1, counts.female)} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer">+</button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setCounts(counts.total, Math.max(0, counts.female - 1))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer text-pink-650">-</button>
                          <span className="w-4 text-center font-bold font-mono text-[10px] text-pink-700">{counts.female}</span>
                          <button type="button" onClick={() => setCounts(counts.total, Math.min(counts.total, counts.female + 1))} className="w-5 h-5 bg-white border border-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-100 cursor-pointer text-pink-650">+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Age List Sidebar Details */
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 max-h-[60vh] overflow-y-auto flex flex-col text-xs text-left">
            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">១. កំណត់ព័ត៌មានគ្រូ និងសាលា</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">រាជធានី/ខេត្ត</label>
                    <input 
                      type="text" 
                      value={schoolProvince} 
                      onChange={(e) => setSchoolProvince(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-500 block mb-0.5">ស្រុក/ខណ្ឌ</label>
                    <input 
                      type="text" 
                      value={schoolDistrict} 
                      onChange={(e) => setSchoolDistrict(e.target.value)} 
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs font-sans text-gray-750"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-xs border-b border-gray-100 pb-1 mb-2">២. ស្ថិតិអាយុសិស្សសង្ខេប</h3>
              <div className="space-y-2 font-medium text-gray-700">
                <div className="flex justify-between bg-gray-50 p-2 rounded-lg">
                  <span>ចំនួនសិស្សសរុប៖</span>
                  <span className="font-bold text-indigo-650">{toKhmerDigits(students.length)} នាក់</span>
                </div>
                <div className="flex justify-between bg-gray-50 p-2 rounded-lg">
                  <span>សិស្សស្រី៖</span>
                  <span className="font-bold text-pink-650">{toKhmerDigits(students.filter(s => s.gender === 'ស្រី').length)} នាក់</span>
                </div>
                <div className="flex justify-between bg-gray-50 p-2 rounded-lg">
                  <span>សិស្សប្រុស៖</span>
                  <span className="font-bold text-blue-650">{toKhmerDigits(students.filter(s => s.gender === 'ប្រុស').length)} នាក់</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                {docType !== 'ageSummary' && docType !== 'ageList' ? (
                  <>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">សិស្សដែលបានជ្រើសរើស (Selected)</p>
                    <div>
                      <p className="font-black text-white text-sm font-sans">{selectedStudent?.nameKh}</p>
                      <p className="font-mono text-[10px] text-indigo-400 font-bold uppercase mt-0.5">{selectedStudent?.nameEn} ({selectedStudent?.id})</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">ថ្នាក់ដែលបានជ្រើសរើស (Selected Class)</p>
                    <div>
                      <p className="font-black text-white text-sm font-sans">{classInfo.gradeClass}</p>
                      <p className="font-mono text-[10px] text-indigo-400 font-bold uppercase mt-0.5">ឆ្នាំសិក្សា៖ {classInfo.academicYear}</p>
                    </div>
                  </>
                )}
                <div className="pt-2 border-t border-slate-800/60 mt-1">
                  <p className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">ប្រភេទឯកសារ (Document Type)</p>
                  <p className="font-bold text-emerald-400 mt-1 text-[11px] flex items-center gap-1.5 font-sans">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    {docType === 'tracker' 
                      ? 'សៀវភៅតាមដានការសិក្សា' 
                      : docType === 'biography' 
                      ? 'សៀវភៅសិក្ខាគារិក (ជីវប្រវត្តិ)' 
                      : docType === 'ageSummary' 
                      ? 'តារាងស្រង់អាយុសិស្ស (២.ខ)' 
                      : 'តារាងបញ្ជីអាយុសិស្ស (លម្អិត)'}
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

