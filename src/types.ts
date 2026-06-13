export interface Student {
  id: string; // Unique student identifier (e.g., STD-001)
  nameKh: string; // Name in Khmer (e.g., សុខ ជា)
  nameEn: string; // Name in English/Latin uppercase (e.g., SOK CHEA)
  gender: 'ប្រុស' | 'ស្រី'; // 'ប្រុស' for Male, 'ស្រី' for Female
  dob: string; // Date of birth (YYYY-MM-DD or string)
  pob: string; // Place of birth
  address: string; // Current address
  fatherName: string; // Father's name
  fatherJob: string; // Father's occupation
  motherName: string; // Mother's name
  motherJob: string; // Mother's occupation
  phoneNumber: string; // Parent contact info
  pobProvince: string; // Place of birth Province/City
  classTeacher: string; // Teacher name
  gradeClass: string; // Grade & Class name (e.g., "ថ្នាក់ទី ៥ អា")
  academicYear: string; // Academic year (e.g., "២០២៤-២០២៥")
  photoUrl?: string; // Optonal student picture or customized avatar
}

export interface SubjectScores {
  khmer: number; // ភាសាខ្មែរ (0-10)
  math: number;  // គណិតវិទ្យា (0-10)
  science: number; // វិទ្យាសាស្ត្រ (0-10)
  social: number; // សិក្សាសង្គម (0-10)
  artsPE: number; // អប់រំកាយ/សិល្បៈ (0-10)
}

export type AcademicPeriod = 
  | 'nov' 
  | 'dec' 
  | 'jan' 
  | 'feb' 
  | 'mar' 
  | 'sem1_exam' 
  | 'apr_may' 
  | 'jun' 
  | 'jul' 
  | 'sem2_exam';

export interface ScoreRecord {
  studentId: string;
  period: AcademicPeriod;
  scores: SubjectScores;
  sum: number; // Sum of scores
  average: number; // Average of scores (out of 10)
}

export interface SemesterRecord {
  studentId: string;
  semester: 1 | 2;
  periodAverages: { [key in AcademicPeriod]?: number }; // Averages for each month in semester
  examAverage: number; // Semester exam average
  semesterAverage: number; // Final S1/S2 average: (Average of months + Exam) / 2
  rank: number; // Rank in class for this semester
}

export interface YearEndRecord {
  studentId: string;
  semester1Average: number;
  semester2Average: number;
  yearEndAverage: number; // (S1 Average + S2 Average) / 2
  rank: number; // Rank in class for year-end
  resultText: 'ជាប់' | 'ធ្លាក់'; // Pass or Fail (Average >= 5.0 is Pass)
  mention: string; // Outstanding description (e.g., ល្អណាស់, ល្អបង្គួរ, etc.)
}

export interface AttendanceRecord {
  studentId: string;
  month: string; // Academic months: 'nov', 'dec', 'jan', 'feb', 'mar', 'apr_may', 'jun', 'jul'
  excused: number; // វត្តមានមានច្បាប់ (Excused absences)
  unexcused: number; // វត្តមានឥតច្បាប់ (Unexcused absences)
  late: number; // យឺត (Late arrivals)
}

// Full app state to easily sync to localStorage
export interface AppData {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
  attendance: { [studentId: string]: { [month: string]: AttendanceRecord } };
  classInfo: {
    gradeClass: string;
    academicYear: string;
    classTeacher: string;
    schoolName: string;
  };
}
