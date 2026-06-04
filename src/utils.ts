import { Student, SubjectScores, AcademicPeriod, YearEndRecord, SemesterRecord, AttendanceRecord } from './types';

export const PERIODS: { value: AcademicPeriod; labelKh: string; labelEn: string; isExam: boolean }[] = [
  { value: 'nov', labelKh: 'វិច្ឆិកា', labelEn: 'November', isExam: false },
  { value: 'dec', labelKh: 'ធ្នូ', labelEn: 'December', isExam: false },
  { value: 'jan', labelKh: 'មករា', labelEn: 'January', isExam: false },
  { value: 'feb', labelKh: 'កុម្ភៈ', labelEn: 'February', isExam: false },
  { value: 'mar', labelKh: 'មីនា', labelEn: 'March', isExam: false },
  { value: 'sem1_exam', labelKh: 'ប្រឡងឆមាសទី១', labelEn: 'Semester 1 Exam', isExam: true },
  { value: 'apr_may', labelKh: 'មេសា+ឧសភា', labelEn: 'April + May', isExam: false },
  { value: 'jun', labelKh: 'មិថុនា', labelEn: 'June', isExam: false },
  { value: 'jul', labelKh: 'កក្កដា', labelEn: 'July', isExam: false },
  { value: 'sem2_exam', labelKh: 'ប្រឡងឆមាសទី២', labelEn: 'Semester 2 Exam', isExam: true },
];

export const SUBJECT_NAMES: { value: keyof SubjectScores; labelKh: string; labelEn: string }[] = [
  { value: 'khmer', labelKh: 'ភាសាខ្មែរ', labelEn: 'Khmer Language' },
  { value: 'math', labelKh: 'គណិតវិទ្យា', labelEn: 'Mathematics' },
  { value: 'science', labelKh: 'វិទ្យាសាស្ត្រ', labelEn: 'Science' },
  { value: 'social', labelKh: 'សិក្សាសង្គម', labelEn: 'Social Studies' },
  { value: 'artsPE', labelKh: 'អប់រំកាយ/សិល្បៈ', labelEn: 'Arts & PE' },
];

export const MONTH_LIST = ['nov', 'dec', 'jan', 'feb', 'mar', 'apr_may', 'jun', 'jul'];

export function calculateRecordMetrics(scores: SubjectScores | undefined) {
  if (!scores) {
    return { sum: 0, average: 0 };
  }
  const sum = (scores.khmer || 0) + (scores.math || 0) + (scores.science || 0) + (scores.social || 0) + (scores.artsPE || 0);
  const average = sum / 5;
  return { sum, average };
}

export function getMention(average: number): string {
  if (average >= 9.0) return 'ល្អប្រសើរ'; // Excellent
  if (average >= 8.0) return 'ល្អណាស់';   // Very Good
  if (average >= 7.0) return 'ល្អ';       // Good
  if (average >= 6.0) return 'ល្អបង្គួរ';  // Fairly Good
  if (average >= 5.0) return 'មធ្យម';     // Fair/Medium
  return 'ខ្សោយ';                         // Weak
}

export function calculateRankings(
  students: Student[],
  scoresData: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } }
): { [period in AcademicPeriod]: { [studentId: string]: { average: number; sum: number; rank: number } } } {
  const result: any = {};

  PERIODS.forEach((p) => {
    const periodValue = p.value;
    const studentAverages = students.map((student) => {
      const studentScores = scoresData[student.id]?.[periodValue];
      const { sum, average } = calculateRecordMetrics(studentScores);
      const isEntered = !!scoresData[student.id]?.[periodValue];
      return {
        studentId: student.id,
        sum,
        average,
        isEntered,
      };
    });

    // Sort valid students by average descending
    const enteredStudents = studentAverages.filter((s) => s.isEntered);
    const unenteredStudents = studentAverages.filter((s) => !s.isEntered);

    enteredStudents.sort((a, b) => b.average - a.average);

    const rankings: { [studentId: string]: { average: number; sum: number; rank: number } } = {};

    let currentRank = 1;
    for (let i = 0; i < enteredStudents.length; i++) {
      if (i > 0 && enteredStudents[i].average < enteredStudents[i - 1].average) {
        currentRank = i + 1;
      }
      rankings[enteredStudents[i].studentId] = {
        average: enteredStudents[i].average,
        sum: enteredStudents[i].sum,
        rank: currentRank,
      };
    }

    // Unentered students get rank 0 or default
    unenteredStudents.forEach((s) => {
      rankings[s.studentId] = {
        average: 0,
        sum: 0,
        rank: 0,
      };
    });

    result[periodValue] = rankings;
  });

  return result;
}

export function calculateSemester1Record(
  studentId: string,
  scoresData: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } }
): { semesterAverage: number; periodAverages: { [key: string]: number }; examAverage: number } {
  const s1Months: AcademicPeriod[] = ['nov', 'dec', 'jan', 'feb', 'mar'];
  const monthAverages: number[] = [];
  const periodAverages: { [key: string]: number } = {};

  s1Months.forEach((m) => {
    const monthScore = scoresData[studentId]?.[m];
    if (monthScore) {
      const { average } = calculateRecordMetrics(monthScore);
      monthAverages.push(average);
      periodAverages[m] = average;
    }
  });

  const s1ExamScore = scoresData[studentId]?.['sem1_exam'];
  const examAverage = s1ExamScore ? calculateRecordMetrics(s1ExamScore).average : 0;

  // MoEYS grading: S1 Average = (Average of S1 monthly averages + S1 Exam Average) / 2
  const monthlyAverageSum = monthAverages.length > 0 ? monthAverages.reduce((a, b) => a + b, 0) : 0;
  const monthlyAverage = monthAverages.length > 0 ? monthlyAverageSum / monthAverages.length : 0;

  let semesterAverage = 0;
  if (monthAverages.length > 0 && s1ExamScore) {
    semesterAverage = (monthlyAverage + examAverage) / 2;
  } else if (monthAverages.length > 0) {
    semesterAverage = monthlyAverage; // Fallback if no exam yet
  } else if (s1ExamScore) {
    semesterAverage = examAverage; // Fallback if exam only
  }

  return {
    semesterAverage,
    periodAverages,
    examAverage,
  };
}

export function calculateSemester2Record(
  studentId: string,
  scoresData: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } }
): { semesterAverage: number; periodAverages: { [key: string]: number }; examAverage: number } {
  const s2Months: AcademicPeriod[] = ['apr_may', 'jun', 'jul'];
  const monthAverages: number[] = [];
  const periodAverages: { [key: string]: number } = {};

  s2Months.forEach((m) => {
    const monthScore = scoresData[studentId]?.[m];
    if (monthScore) {
      const { average } = calculateRecordMetrics(monthScore);
      monthAverages.push(average);
      periodAverages[m] = average;
    }
  });

  const s2ExamScore = scoresData[studentId]?.['sem2_exam'];
  const examAverage = s2ExamScore ? calculateRecordMetrics(s2ExamScore).average : 0;

  // S2 Average = (Average of S2 monthly averages + S2 Exam Average) / 2
  const monthlyAverageSum = monthAverages.length > 0 ? monthAverages.reduce((a, b) => a + b, 0) : 0;
  const monthlyAverage = monthAverages.length > 0 ? monthlyAverageSum / monthAverages.length : 0;

  let semesterAverage = 0;
  if (monthAverages.length > 0 && s2ExamScore) {
    semesterAverage = (monthlyAverage + examAverage) / 2;
  } else if (monthAverages.length > 0) {
    semesterAverage = monthlyAverage;
  } else if (s2ExamScore) {
    semesterAverage = examAverage;
  }

  return {
    semesterAverage,
    periodAverages,
    examAverage,
  };
}

export interface CalculatedOverview {
  studentId: string;
  s1Avg: number;
  s2Avg: number;
  yearEndAvg: number;
  s1Rank: number;
  s2Rank: number;
  yearEndRank: number;
}

export function calculateFullAcademicSummary(
  students: Student[],
  scoresData: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } }
): CalculatedOverview[] {
  // S1 Averages
  const s1Averages = students.map((student) => {
    const s1 = calculateSemester1Record(student.id, scoresData);
    return { studentId: student.id, avg: s1.semesterAverage };
  });

  // Rank S1
  const sortedS1 = [...s1Averages].sort((a, b) => b.avg - a.avg);
  const s1Ranks: { [studentId: string]: number } = {};
  let r1 = 1;
  for (let i = 0; i < sortedS1.length; i++) {
    if (i > 0 && sortedS1[i].avg < sortedS1[i - 1].avg) {
      r1 = i + 1;
    }
    s1Ranks[sortedS1[i].studentId] = r1;
  }

  // S2 Averages
  const s2Averages = students.map((student) => {
    const s2 = calculateSemester2Record(student.id, scoresData);
    return { studentId: student.id, avg: s2.semesterAverage };
  });

  // Rank S2
  const sortedS2 = [...s2Averages].sort((a, b) => b.avg - a.avg);
  const s2Ranks: { [studentId: string]: number } = {};
  let r2 = 1;
  for (let i = 0; i < sortedS2.length; i++) {
    if (i > 0 && sortedS2[i].avg < sortedS2[i - 1].avg) {
      r2 = i + 1;
    }
    s2Ranks[sortedS2[i].studentId] = r2;
  }

  // Year End Averages = (S1 Avg + S2 Avg) / 2
  const yearEndAverages = students.map((student) => {
    const s1Avg = s1Averages.find((x) => x.studentId === student.id)?.avg || 0;
    const s2Avg = s2Averages.find((x) => x.studentId === student.id)?.avg || 0;
    // Calculation: if both exists, average them. If only S1, use S1. Same for S2.
    let yearEndAvg = 0;
    if (s1Avg > 0 && s2Avg > 0) {
      yearEndAvg = (s1Avg + s2Avg) / 2;
    } else if (s1Avg > 0) {
      yearEndAvg = s1Avg;
    } else if (s2Avg > 0) {
      yearEndAvg = s2Avg;
    }
    return { studentId: student.id, s1Avg, s2Avg, yearEndAvg };
  });

  // Rank Year End
  const sortedYear = [...yearEndAverages].sort((a, b) => b.yearEndAvg - a.yearEndAvg);
  const yearRanks: { [studentId: string]: number } = {};
  let rYear = 1;
  for (let i = 0; i < sortedYear.length; i++) {
    if (i > 0 && sortedYear[i].yearEndAvg < sortedYear[i - 1].yearEndAvg) {
      rYear = i + 1;
    }
    yearRanks[sortedYear[i].studentId] = rYear;
  }

  return students.map((s) => {
    return {
      studentId: s.id,
      s1Avg: s1Averages.find((x) => x.studentId === s.id)?.avg || 0,
      s2Avg: s2Averages.find((x) => x.studentId === s.id)?.avg || 0,
      yearEndAvg: yearEndAverages.find((x) => x.studentId === s.id)?.yearEndAvg || 0,
      s1Rank: s1Ranks[s.id] || 0,
      s2Rank: s2Ranks[s.id] || 0,
      yearEndRank: yearRanks[s.id] || 0,
    };
  });
}

// Attendance Calculation Helpers
export function getStudentAttendanceSummary(
  studentId: string,
  attendanceData: { [studentId: string]: { [month: string]: AttendanceRecord } }
) {
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalLate = 0;

  const records = attendanceData[studentId];
  if (records) {
    Object.values(records).forEach((r) => {
      totalExcused += r.excused || 0;
      totalUnexcused += r.unexcused || 0;
      totalLate += r.late || 0;
    });
  }

  return {
    totalExcused,
    totalUnexcused,
    totalLate,
  };
}

// MoEYS Standard grade boundary description helper (e.g., Honor table and tracking book remarks)
export function getResultComments(avg: number): string {
  if (avg >= 9.0) return 'ឆ្លាតវៃណាស់ និងខិតខំប្រឹងប្រែងឥតឈប់ឈរ សក្តិសមជាសិស្សគម្រូ។';
  if (avg >= 8.0) return 'ការរៀនសូត្រល្អណាស់ ប្រុងប្រយ័ត្ន និងមានវិន័យស្ទាត់ជំនាញ។';
  if (avg >= 7.0) return 'ការរៀនសូត្រល្អ ខិតខំយកចិត្តទុកដាក់ស្ដាប់ការពន្យល់។';
  if (avg >= 6.0) return 'លទ្ធផលល្អបង្គួរ គួរតែខិតខំប្រឹងប្រែងបន្ថែមទៀតលើមុខវិជ្ជាគណិតវិទ្យា។';
  if (avg >= 5.0) return 'លទ្ធផលមធ្យម ត្រូវតែព្យាយាមរៀនបន្ថែម និងធ្វើលំហាត់ឲ្យបានច្រើន។';
  return 'លទ្ធផលខ្សោយ ត្រូវតែយកចិត្តទុកដាក់រៀនឡើងវិញ និងទទួលការបំប៉នបន្ថែម។';
}

// Browser-based Export Utilities for CSV (VCS/Excel compatible) and Word (.doc)
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number) => {
    const s = String(val === undefined || val === null ? '' : val);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csvContent = "\uFEFF" + [
    headers.map(sanitize).join(","),
    ...rows.map(row => row.map(sanitize).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.width = '0';
  link.style.height = '0';
  link.style.position = 'absolute';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToWord(filename: string, docTitle: string, htmlBody: string) {
  const headerHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <title>${docTitle}</title>
    <meta charset="utf-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;700&family=Moul&display=swap');
      body {
        font-family: 'Kantumruy Pro', 'Inter', 'Khmer OS Battambang', sans-serif;
        padding: 20px;
        color: #111827;
      }
      h1, h2, .moul-title {
        font-family: 'Moul', 'Khmer OS Muol Light', sans-serif;
        text-align: center;
        color: #1e3a8a;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 15px;
        margin-bottom: 15px;
      }
      th, td {
        border: 1px solid #9ca3af;
        padding: 8px 10px;
        text-align: center;
        font-size: 11px;
      }
      th {
        background-color: #f3f4f6;
        font-weight: bold;
      }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .font-mono { font-family: monospace; }
      .sub-title { font-size: 14px; text-align: center; font-weight: bold; margin-bottom: 20px; }
      .flex-container { display: table; width: 100%; }
      .flex-item { display: table-cell; width: 50%; }
      .footer-table { width: 100%; border: none; margin-top: 40px; }
      .footer-table td { border: none; font-size: 12px; text-align: center; }
    </style>
  </head>
  <body>`;
  const footerHtml = "</body></html>";
  const source = headerHtml + htmlBody + footerHtml;

  const blob = new Blob(['\ufeff' + source], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.width = '0';
  link.style.height = '0';
  link.style.position = 'absolute';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
