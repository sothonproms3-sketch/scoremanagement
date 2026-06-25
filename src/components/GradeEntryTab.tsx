import React, { useState, useEffect } from 'react';
import { Student, SubjectScores, AcademicPeriod } from '../types';
import { PERIODS, SUBJECT_NAMES, SUB_SUBJECTS, calculateRecordMetrics, computeParentSubjectAverages, exportToCSV, getMention } from '../utils';
import { Save, CheckCircle, Info, HelpCircle, FileSpreadsheet, Keyboard, Download, Copy, LayoutGrid, ListChecks, TrendingDown, TrendingUp, ArrowRight, Award, Upload, X, FileText, AlertCircle } from 'lucide-react';

interface GradeEntryTabProps {
  students: Student[];
  scores: { [studentId: string]: { [period in AcademicPeriod]?: SubjectScores } };
  onSaveScores: (studentId: string, period: AcademicPeriod, s: SubjectScores) => void;
}

export default function GradeEntryTab({ students, scores, onSaveScores }: GradeEntryTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<AcademicPeriod>('nov');
  const [localScores, setLocalScores] = useState<{ [studentId: string]: SubjectScores }>({});
  const [isSavedIndicator, setIsSavedIndicator] = useState(false);
  const [entryMode, setEntryMode] = useState<'direct' | 'detailed' | 'summary'>('direct');

  // Excel/CSV Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<{
    studentId: string;
    studentName: string;
    matched: boolean;
    scores: Partial<SubjectScores>;
  }[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

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

  function computeRealtimeAverages(studentId: string) {
    const studentSMap: { [period in AcademicPeriod]?: SubjectScores } = {};
    
    PERIODS.forEach((p) => {
      if (p.value === selectedPeriod) {
        if (localScores[studentId]) {
          studentSMap[p.value] = localScores[studentId];
        }
      } else {
        const saved = scores[studentId]?.[p.value];
        if (saved) {
          studentSMap[p.value] = saved;
        }
      }
    });

    // Semester 1
    const s1Months: AcademicPeriod[] = ['nov', 'dec', 'jan', 'feb', 'mar'];
    const s1MonthAverages: number[] = [];
    s1Months.forEach((m) => {
      const s = studentSMap[m];
      if (s) {
        const { average } = calculateRecordMetrics(s);
        s1MonthAverages.push(average);
      }
    });
    const s1ExamScore = studentSMap['sem1_exam'];
    const s1ExamAverage = s1ExamScore ? calculateRecordMetrics(s1ExamScore).average : 0;
    
    const s1MonthlyAverageSum = s1MonthAverages.length > 0 ? s1MonthAverages.reduce((a, b) => a + b, 0) : 0;
    const s1MonthlyAverage = s1MonthAverages.length > 0 ? s1MonthlyAverageSum / s1MonthAverages.length : 0;
    
    let s1Average = 0;
    if (s1MonthAverages.length > 0 && s1ExamScore) {
      s1Average = (s1MonthlyAverage + s1ExamAverage) / 2;
    } else if (s1MonthAverages.length > 0) {
      s1Average = s1MonthlyAverage;
    } else if (s1ExamScore) {
      s1Average = s1ExamAverage;
    }

    // Semester 2
    const s2Months: AcademicPeriod[] = ['apr_may', 'jun', 'jul'];
    const s2MonthAverages: number[] = [];
    s2Months.forEach((m) => {
      const s = studentSMap[m];
      if (s) {
        const { average } = calculateRecordMetrics(s);
        s2MonthAverages.push(average);
      }
    });
    const s2ExamScore = studentSMap['sem2_exam'];
    const s2ExamAverage = s2ExamScore ? calculateRecordMetrics(s2ExamScore).average : 0;
    
    const s2MonthlyAverageSum = s2MonthAverages.length > 0 ? s2MonthAverages.reduce((a, b) => a + b, 0) : 0;
    const s2MonthlyAverage = s2MonthAverages.length > 0 ? s2MonthlyAverageSum / s2MonthAverages.length : 0;
    
    let s2Average = 0;
    if (s2MonthAverages.length > 0 && s2ExamScore) {
      s2Average = (s2MonthlyAverage + s2ExamAverage) / 2;
    } else if (s2MonthAverages.length > 0) {
      s2Average = s2MonthlyAverage;
    } else if (s2ExamScore) {
      s2Average = s2ExamAverage;
    }

    // Year End
    let yearEndAverage = 0;
    if (s1Average > 0 && s2Average > 0) {
      yearEndAverage = (s1Average + s2Average) / 2;
    } else if (s1Average > 0) {
      yearEndAverage = s1Average;
    } else if (s2Average > 0) {
      yearEndAverage = s2Average;
    }

    const getSubjectCount = (s: SubjectScores | undefined) => {
      if (!s) return 5;
      let count = 5;
      if (s.lifeSkills !== undefined) count++;
      if (s.foreignLanguage !== undefined) count++;
      return count;
    };

    const s1SubjectCount = getSubjectCount(studentSMap['nov'] || studentSMap['sem1_exam'] || localScores[studentId]);
    const s2SubjectCount = getSubjectCount(studentSMap['apr_may'] || studentSMap['sem2_exam'] || localScores[studentId]);

    const s1Total = s1Average * s1SubjectCount;
    const s2Total = s2Average * s2SubjectCount;

    return {
      s1Average,
      s1Total,
      s2Average,
      s2Total,
      yearEndAverage
    };
  }

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
      'មធ្យមភាគ (Average)',
      'មធ្យមភាគ ឆមាសទី១ (Semester 1 Average)',
      'មធ្យមភាគ ឆមាសទី២ (Semester 2 Average)',
      'មធ្យមភាគប្រចាំឆ្នាំ (Year End Average)'
    ];

    const rows = students.map((student, index) => {
      const studentS = localScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
      const { sum, average } = calculateRecordMetrics(studentS);
      const rt = computeRealtimeAverages(student.id);
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
        average.toFixed(2),
        rt.s1Average > 0 ? rt.s1Average.toFixed(2) : '—',
        rt.s2Average > 0 ? rt.s2Average.toFixed(2) : '—',
        rt.yearEndAverage > 0 ? rt.yearEndAverage.toFixed(2) : '—'
      ];
    });

    exportToCSV(`តារាងពិន្ទុ_រួមមុខវិជ្ជារង_ខែ_${periodLabel.replace(/\s+/g, '_')}.csv`, headers, rows);
  };

  // Excel/CSV parsing and importing functions
  const parseImportedGrades = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { success: false, error: 'គ្មានទិន្នន័យគ្រប់គ្រាន់ (ត្រូវតែមានជួរចំណងជើង និងទិន្នន័យសិស្ស)។' };

    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';

    const parseRow = (line: string) => {
      if (delimiter === '\t') {
        return line.split('\t').map(cell => cell.trim().replace(/^"|"$/g, ''));
      } else {
        const cells = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        cells.push(current.trim());
        return cells.map(c => c.replace(/^"|"$/g, ''));
      }
    };

    const headers = parseRow(firstLine);
    
    // Look for ID/Name columns to match
    const idIndex = headers.findIndex(h => {
      const l = h.toLowerCase();
      return l.includes('id') || l.includes('អត្តសញ្ញាណ') || l.includes('អត្តលេខ') || l.includes('លេខសម្គាល់') || l.includes('student');
    });

    const nameIndex = headers.findIndex(h => {
      const l = h.toLowerCase();
      return l.includes('name') || l.includes('ឈ្មោះ') || l.includes('នាម');
    });

    // We must find at least one identifying column
    if (idIndex === -1 && nameIndex === -1) {
      return { success: false, error: 'រកមិនឃើញជួរឈរ "អត្តសញ្ញាណ (ID)" ឬ "ឈ្មោះសិស្ស" សម្រាប់ផ្ទៀងផ្ទាត់សិស្សឡើយ។' };
    }

    const keyIndex = idIndex !== -1 ? idIndex : nameIndex;

    const subjectMappings: { key: keyof SubjectScores; names: string[] }[] = [
      { key: 'khmer', names: ['khmer avg', 'khmer', 'ភាសាខ្មែរ រួម', 'ភាសាខ្មែរ'] },
      { key: 'khmerReading', names: ['khmer reading', 'ខ្មែរ_រៀនអាន', 'រៀនអាន'] },
      { key: 'khmerDictation', names: ['khmer dictation', 'ខ្មែរ_សរសេរតាមអាន', 'សរសេរតាមអាន'] },
      { key: 'khmerComposition', names: ['khmer composition', 'ខ្មែរ_តែងសេចក្តី', 'តែងសេចក្តី'] },
      
      { key: 'math', names: ['math avg', 'math', 'គណិតវិទ្យា រួម', 'គណិតវិទ្យា'] },
      { key: 'mathNumbers', names: ['math numbers', 'គណិត_ចំនួន', 'ចំនួន'] },
      { key: 'mathMeasurement', names: ['math measurement', 'គណិត_រង្វាស់រង្វាល់', 'រង្វាស់រង្វាល់'] },
      { key: 'mathGeometry', names: ['math geometry', 'គណិត_ធរណីមាត្រ', 'ធរណីមាត្រ'] },
      { key: 'mathAlgebra', names: ['math algebra', 'គណិត_ពីជគណិត', 'ពីជគណិត'] },
      { key: 'mathStatistics', names: ['math statistics', 'គណិត_ស្ថិតិ', 'ស្ថិតិ'] },
      
      { key: 'science', names: ['science', 'វិទ្យាសាស្ត្រ'] },
      
      { key: 'social', names: ['social avg', 'social', 'សិក្សាសង្គម រួម', 'សិក្សាសង្គម'] },
      { key: 'socialCivics', names: ['social civics', 'សង្គម_សីលធម៌-ពលរដ្ឋ', 'សីលធម៌-ពលរដ្ឋ'] },
      { key: 'socialGeography', names: ['social geography', 'សង្គម_ភូមិវិទ្យា', 'ភូមិវិទ្យា'] },
      { key: 'socialHistory', names: ['social history', 'សង្គម_ប្រវត្តិវិទ្យា', 'ប្រវត្តិវិទ្យា'] },
      { key: 'socialArts', names: ['social arts', 'សង្គម_សិល្បៈ', 'សិល្បៈ'] },
      
      { key: 'artsPE', names: ['artspe', 'អប់រំកាយ/សិល្បៈ', 'អប់រំកាយនិងកីឡា', 'physical education', 'កីឡា'] },
      { key: 'lifeSkills', names: ['life skills', 'បំណិន', 'បំណិនជីវិត'] },
      { key: 'foreignLanguage', names: ['foreign language', 'ភាសាបរទេស', 'អង់គ្លេស', 'english'] }
    ];

    const colMappings: { key: keyof SubjectScores; index: number; label: string }[] = [];
    subjectMappings.forEach(mapping => {
      const idx = headers.findIndex(h => {
        const lh = h.toLowerCase();
        return mapping.names.some(n => lh.includes(n.toLowerCase()));
      });
      if (idx !== -1) {
        colMappings.push({ key: mapping.key, index: idx, label: headers[idx] });
      }
    });

    if (colMappings.length === 0) {
      return { success: false, error: 'រកមិនឃើញជួរឈរពិន្ទុមុខវិជ្ជាណាមួយឡើយ (ដូចជា ភាសាខ្មែរ, គណិតវិទ្យា, វិទ្យាសាស្ត្រ)។' };
    }

    const importedStudents: { studentIdentifier: string; scores: Partial<SubjectScores> }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cells = parseRow(line);
      const studentIdentifier = cells[keyIndex];
      if (!studentIdentifier) continue;

      const studentScores: Partial<SubjectScores> = {};
      colMappings.forEach(map => {
        const valStr = cells[map.index];
        if (valStr !== undefined && valStr !== null && valStr !== '—' && valStr !== '') {
          // Normalize Khmer numbers to English digits if any
          const cleanValStr = valStr.replace(/[០-៩]/g, d => String('០១២៣៤៥៦៧៨៩'.indexOf(d)));
          const val = parseFloat(cleanValStr);
          if (!isNaN(val)) {
            studentScores[map.key] = Math.max(0, Math.min(10, val));
          }
        }
      });

      importedStudents.push({ studentIdentifier, scores: studentScores });
    }

    return { success: true, delimiter, students: importedStudents, colMappings };
  };

  const handleProcessImportText = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setImportPreview([]);
      setImportError(null);
      return;
    }

    const res = parseImportedGrades(text);
    if (!res.success) {
      setImportError(res.error || 'មានបញ្ហាក្នុងការវិភាគទិន្នន័យ។');
      setImportPreview([]);
      return;
    }

    setImportError(null);

    // Map parsed data to students
    const previewData = res.students.map(imported => {
      const student = students.find(s => 
        s.id.toLowerCase() === imported.studentIdentifier.toLowerCase() || 
        s.nameKh.trim() === imported.studentIdentifier.trim() ||
        s.nameEn.toLowerCase().trim() === imported.studentIdentifier.toLowerCase().trim()
      );
      return {
        studentId: student ? student.id : imported.studentIdentifier,
        studentName: student ? student.nameKh : `— (${imported.studentIdentifier})`,
        matched: !!student,
        scores: imported.scores
      };
    });

    setImportPreview(previewData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessImportText(text);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    const matchedItems = importPreview.filter(p => p.matched);
    if (matchedItems.length === 0) {
      alert('គ្មានទិន្នន័យសិស្សដែលត្រូវគ្នាសម្រាប់នាំចូលឡើយ។ សូមប្រាកដថាអត្តសញ្ញាណ (ID) ឬឈ្មោះសិស្សត្រូវគ្នាជាមួយបញ្ជីសាលា។');
      return;
    }

    setLocalScores(prev => {
      const nextScores = { ...prev };
      matchedItems.forEach(item => {
        const student = students.find(s => s.id === item.studentId);
        if (student) {
          const currentScores = nextScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
          const merged = {
            ...currentScores,
            ...item.scores
          };
          const synced = computeParentSubjectAverages(merged);
          nextScores[student.id] = synced;
        }
      });
      return nextScores;
    });

    setIsSavedIndicator(false);
    setImportSuccess(`នាំចូលពិន្ទុជោគជ័យសម្រាប់សិស្សចំនួន ${matchedItems.length} នាក់! សូមពិនិត្យរួចចុច "រក្សាទុកពិន្ទុ" ដើម្បីរក្សាទុកជាស្ថាពរ។`);
    
    setTimeout(() => {
      setIsImportModalOpen(false);
      setImportText('');
      setImportPreview([]);
      setImportSuccess(null);
    }, 2500);
  };

  const handleCopyExcelTemplate = () => {
    const headers = [
      'អត្តសញ្ញាណ (ID)',
      'ឈ្មោះខ្មែរ (Khmer Name)',
      'ភេទ (Gender)',
      'ភាសាខ្មែរ (Khmer)',
      'គណិតវិទ្យា (Math)',
      'វិទ្យាសាស្ត្រ (Science)',
      'សិក្សាសង្គម (Social)',
      'អប់រំកាយ/សិល្បៈ (Arts/PE)',
      'បំណិន (Life Skills)',
      'ភាសាបរទេស (Foreign Language)'
    ];

    const rows = students.map(s => {
      const studentS = localScores[s.id] || {};
      return [
        s.id,
        s.nameKh,
        s.gender,
        studentS.khmer !== undefined ? studentS.khmer : '',
        studentS.math !== undefined ? studentS.math : '',
        studentS.science !== undefined ? studentS.science : '',
        studentS.social !== undefined ? studentS.social : '',
        studentS.artsPE !== undefined ? studentS.artsPE : '',
        studentS.lifeSkills !== undefined ? studentS.lifeSkills : '',
        studentS.foreignLanguage !== undefined ? studentS.foreignLanguage : ''
      ];
    });

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      alert('បានចម្លងទម្រង់គំរូទៅ Clipboard! បើកកម្មវិធី Excel ឬ Google Sheets រួចចុច Paste (Ctrl+V) ដើម្បីបំពេញពិន្ទុ។');
    }).catch(err => {
      console.error('Failed to copy template: ', err);
    });
  };

  const decliningStudentsCount = students.filter(student => {
    const rt = computeRealtimeAverages(student.id);
    return rt.s1Average > 0 && rt.s2Average > 0 && rt.s2Average < rt.s1Average;
  }).length;

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
            <button
              type="button"
              onClick={() => setEntryMode('summary')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                entryMode === 'summary'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="បង្ហាញតារាងសង្ខេបនៃមធ្យមភាគ និងការផ្ទៀងផ្ទាត់ឆមាស ១ និង ២ របស់សិស្សម្នាក់ៗ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              តារាងផ្ទៀងផ្ទាត់សង្ខេប (Summary Table)
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

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="នាំចូលពិន្ទុពីឯកសារ Excel/CSV ឬចម្លងពី Excel"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-650" />
            នាំចូលពី Excel
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
                {entryMode === 'direct' 
                  ? 'របៀបបញ្ចូលរួម (Direct Mode)' 
                  : entryMode === 'detailed' 
                    ? 'របៀបបញ្ចូលតាមមុខវិជ្ជារង (Detailed Mode)' 
                    : 'តារាងផ្ទៀងផ្ទាត់សង្ខេបឆមាស (Semester Summary Table)'}
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 bg-white/80 border border-gray-100 rounded-lg px-2.5 py-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>ពិន្ទុចន្លោះពី <strong className="text-indigo-600 font-mono">0.0</strong> ដល់ <strong className="text-indigo-600 font-mono">10.0</strong></span>
            {decliningStudentsCount > 0 && (
              <span 
                className="flex items-center gap-1 text-[10px] text-red-650 bg-red-50 border border-red-150 rounded-full px-2 py-0.5 ml-2 font-bold select-none cursor-help animate-pulse" 
                title={`មានសិស្ស ${decliningStudentsCount} នាក់ ដែលមធ្យមភាគការសិក្សាធ្លាក់ចុះ បើធៀបនឹងឆមាសទី១។`}
              >
                <TrendingDown className="w-3 h-3 text-red-500" />
                សិស្សធ្លាក់ពិន្ទុ៖ {decliningStudentsCount} នាក់
              </span>
            )}
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
                    <th className="px-6 py-4 text-center text-indigo-700 font-extrabold bg-indigo-50/50 border-r border-gray-200">មធ្យមភាគ</th>
                    <th className="px-4 py-4 text-center text-amber-750 font-bold bg-amber-50/20 border-r border-gray-200">សរុប ឆ.១ (S1 Total)</th>
                    <th className="px-4 py-4 text-center text-amber-800 font-extrabold bg-amber-50/40 border-r border-gray-200">មធ្យម ឆ.១ (S1 Avg)</th>
                    <th className="px-4 py-4 text-center text-teal-750 font-bold bg-teal-50/20 border-r border-gray-200">សរុប ឆ.២ (S2 Total)</th>
                    <th className="px-4 py-4 text-center text-teal-800 font-extrabold bg-teal-50/40 border-r border-gray-200">មធ្យម ឆ.២ (S2 Avg)</th>
                    <th className="px-6 py-4 text-center text-purple-750 font-extrabold bg-purple-50/40">ប្រចាំឆ្នាំ (Year)</th>
                  </tr>
                ) : entryMode === 'detailed' ? (
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
                      <th rowSpan={2} className="px-4 py-3 text-center text-indigo-700 font-extrabold bg-indigo-50/50 border-r border-gray-200">មធ្យមភាគ</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-amber-75 font-bold bg-amber-50/15 border-r border-gray-200">សរុប ឆ.១</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-amber-800 font-extrabold bg-amber-50/30 border-r border-gray-200">មធ្យម ឆ.១</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-teal-750 font-bold bg-teal-50/15 border-r border-gray-200">សរុប ឆ.២</th>
                      <th rowSpan={2} className="px-3 py-3 text-center text-teal-800 font-extrabold bg-teal-50/30 border-r border-gray-200">មធ្យម ឆ.២</th>
                      <th rowSpan={2} className="px-4 py-3 text-center text-purple-750 font-extrabold bg-purple-50/40">ប្រចាំឆ្នាំ (Year)</th>
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
                ) : (
                  <tr className="bg-indigo-50/80 text-indigo-950 text-xs font-bold uppercase tracking-wider border-b-2 border-indigo-150">
                    <th className="px-4 py-4 w-12 text-center border-r border-indigo-200">ល.រ</th>
                    <th className="px-4 py-4 w-28 border-r border-indigo-200">អត្តសញ្ញាណ</th>
                    <th className="px-5 py-4 border-r border-indigo-200">ឈ្មោះសិស្ស (Student Name)</th>
                    <th className="px-3 py-4 w-16 text-center border-r border-indigo-200">ភេទ</th>
                    
                    {/* Semester 1 Summary */}
                    <th className="px-4 py-4 text-center bg-amber-50/40 border-r border-indigo-200 font-extrabold text-amber-900 min-w-[180px]">
                      មធ្យមភាគ ឆមាសទី១ (Semester 1)
                    </th>
                    
                    {/* Semester 2 Summary */}
                    <th className="px-4 py-4 text-center bg-teal-50/40 border-r border-indigo-200 font-extrabold text-teal-900 min-w-[180px]">
                      មធ្យមភាគ ឆមាសទី២ (Semester 2)
                    </th>

                    {/* Comparative Progress */}
                    <th className="px-4 py-4 text-center bg-purple-50/40 border-r border-indigo-200 font-extrabold text-purple-900 min-w-[150px]">
                      ការវិវត្តពិន្ទុ (Progress)
                    </th>

                    {/* Year-End results */}
                    <th className="px-4 py-4 text-center bg-blue-50/40 font-extrabold text-blue-900 min-w-[180px]">
                      លទ្ធផលដំណាច់ឆ្នាំ (Year End)
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-sans">
                {students.map((student, index) => {
                  const studentS = localScores[student.id] || { khmer: 0, math: 0, science: 0, social: 0, artsPE: 0 };
                  const { sum, average } = calculateRecordMetrics(studentS);
                  const rt = computeRealtimeAverages(student.id);
                  const isDropped = rt.s1Average > 0 && rt.s2Average > 0 && rt.s2Average < rt.s1Average;

                  if (entryMode === 'summary') {
                    const diff = rt.s2Average > 0 && rt.s1Average > 0 ? rt.s2Average - rt.s1Average : null;

                    // Compute mention colors
                    const getMentionBadgeClass = (avg: number) => {
                      if (avg >= 9.0) return 'bg-emerald-100 text-emerald-950 border-emerald-300';
                      if (avg >= 8.0) return 'bg-green-100 text-green-950 border-green-300';
                      if (avg >= 7.0) return 'bg-sky-100 text-sky-950 border-sky-300';
                      if (avg >= 6.0) return 'bg-indigo-100 text-indigo-950 border-indigo-300';
                      if (avg >= 5.0) return 'bg-amber-100 text-amber-950 border-amber-300';
                      return 'bg-red-100 text-red-950 border-red-300';
                    };

                    let trendBadge = null;
                    if (diff !== null) {
                      if (diff > 0) {
                        trendBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs">
                            <TrendingUp className="w-3.5 h-3.5" />
                            កើនឡើង +{diff.toFixed(2)}
                          </span>
                        );
                      } else if (diff < 0) {
                        trendBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-3xs animate-pulse">
                            <TrendingDown className="w-3.5 h-3.5" />
                            ធ្លាក់ចុះ {diff.toFixed(2)}
                          </span>
                        );
                      } else {
                        trendBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
                            <ArrowRight className="w-3.5 h-3.5" />
                            ស្ថិតថេរ 0.00
                          </span>
                        );
                      }
                    } else {
                      trendBadge = (
                        <span className="text-xs text-gray-400 font-medium">
                          មិនទាន់គ្រប់ទិន្នន័យ
                        </span>
                      );
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors border-b border-gray-105">
                        <td className="px-3 py-4 text-center font-mono font-bold text-xs text-gray-400 border-r border-gray-100">
                          {index + 1}
                        </td>
                        <td className="px-3 py-4 text-center font-mono font-medium text-xs text-gray-650 border-r border-gray-100 select-all">
                          {student.id}
                        </td>
                        <td className="px-5 py-4 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                            {isDropped && (
                              <div 
                                className="flex items-center justify-center p-1 bg-red-50 text-red-650 border border-red-200 rounded-lg shrink-0 animate-pulse cursor-help" 
                                title={`ការព្រមានអំពីការធ្លាក់ចុះពិន្ទុ៖\n• មធ្យមភាគ ឆ.១៖ ${rt.s1Average.toFixed(2)}\n• មធ្យមភាគ ឆ.២៖ ${rt.s2Average.toFixed(2)}\n• ធ្លាក់ចុះ៖ -${(rt.s1Average - rt.s2Average).toFixed(2)}`}
                              >
                                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                            )}
                            <div>
                              <span className="font-sans text-xs font-bold text-gray-900 block">{student.nameKh}</span>
                              <span className="block font-mono text-[9px] text-gray-400 uppercase font-normal mt-0.5">{student.nameEn}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-4 text-center border-r border-gray-100 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                            student.gender === 'ស្រី'
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {student.gender}
                          </span>
                        </td>
                        
                        {/* Semester 1 Summary */}
                        <td className="px-4 py-4 text-center bg-amber-50/5 border-r border-gray-100">
                          {rt.s1Average > 0 ? (
                            <div className="flex flex-col items-center gap-1 justify-center">
                              <span className="font-mono text-sm font-extrabold text-amber-955">
                                {rt.s1Average.toFixed(2)}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getMentionBadgeClass(rt.s1Average)}`}>
                                {getMention(rt.s1Average)}
                              </span>
                              <span className="text-[10px] text-amber-700 font-mono">
                                សរុប៖ {rt.s1Total.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs select-none">គ្មានទិន្នន័យ</span>
                          )}
                        </td>

                        {/* Semester 2 Summary */}
                        <td className="px-4 py-4 text-center bg-teal-50/5 border-r border-gray-100">
                          {rt.s2Average > 0 ? (
                            <div className="flex flex-col items-center gap-1 justify-center">
                              <span className="font-mono text-sm font-extrabold text-teal-900">
                                {rt.s2Average.toFixed(2)}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getMentionBadgeClass(rt.s2Average)}`}>
                                {getMention(rt.s2Average)}
                              </span>
                              <span className="text-[10px] text-teal-750 font-mono">
                                សរុប៖ {rt.s2Total.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs select-none">គ្មានទិន្នន័យ</span>
                          )}
                        </td>

                        {/* Comparative Progress */}
                        <td className="px-4 py-4 text-center bg-purple-50/5 border-r border-gray-100">
                          {trendBadge}
                        </td>

                        {/* Year-End Results */}
                        <td className="px-4 py-4 text-center bg-blue-50/5">
                          {rt.yearEndAverage > 0 ? (
                            <div className="flex flex-col items-center gap-1 justify-center">
                              <span className="font-mono text-sm font-black text-indigo-950">
                                {rt.yearEndAverage.toFixed(2)}
                              </span>
                              <div className="flex items-center gap-1 flex-wrap justify-center">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getMentionBadgeClass(rt.yearEndAverage)}`}>
                                  {getMention(rt.yearEndAverage)}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                  rt.yearEndAverage >= 5.0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold'
                                    : 'bg-red-50 text-red-700 border-red-200 font-extrabold'
                                }`}>
                                  {rt.yearEndAverage >= 5.0 ? 'ជាប់ (Passed)' : 'ធ្លាក់ (Retained)'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs select-none">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  }

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
                          <div className="flex items-center gap-2">
                            {isDropped && (
                              <div 
                                className="flex items-center justify-center p-1 bg-red-50 text-red-600 border border-red-200 rounded-lg animate-pulse hover:bg-red-100 transition-all shrink-0 cursor-help" 
                                title={`ការព្រមានអំពីការធ្លាក់ចុះពិន្ទុ៖\n• មធ្យមភាគ ឆ.១៖ ${rt.s1Average.toFixed(2)}\n• មធ្យមភាគ ឆ.២៖ ${rt.s2Average.toFixed(2)}\n• ធ្លាក់ចុះ៖ -${(rt.s1Average - rt.s2Average).toFixed(2)}`}
                              >
                                <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                            )}
                            <div>
                              <span className="font-sans text-xs font-bold text-gray-900 block">{student.nameKh}</span>
                              <span className="block font-mono text-[9px] text-gray-400 uppercase font-normal mt-0.5">{student.nameEn}</span>
                            </div>
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
                      <td className="px-4 py-3.5 text-center bg-indigo-50/40 text-indigo-950 font-mono font-extrabold text-sm whitespace-nowrap border-r border-gray-200">
                        {average.toFixed(2)}
                      </td>

                      {/* Semester 1, 2 and Year End Real-Time calculations */}
                      {(() => {
                        const rt = computeRealtimeAverages(student.id);
                        return (
                          <>
                            <td className="px-3 py-3.5 text-center bg-amber-50/5 text-amber-700 font-mono font-bold text-xs border-r border-gray-100">
                              {rt.s1Total > 0 ? rt.s1Total.toFixed(1) : '—'}
                            </td>
                            <td className="px-3 py-3.5 text-center bg-amber-50/20 text-amber-900 font-mono font-extrabold text-sm whitespace-nowrap border-r border-gray-100">
                              {rt.s1Average > 0 ? rt.s1Average.toFixed(2) : '—'}
                            </td>
                            <td className="px-3 py-3.5 text-center bg-teal-50/5 text-teal-700 font-mono font-bold text-xs border-r border-gray-100">
                              {rt.s2Total > 0 ? rt.s2Total.toFixed(1) : '—'}
                            </td>
                            <td className="px-3 py-3.5 text-center bg-teal-50/20 text-teal-900 font-mono font-extrabold text-sm whitespace-nowrap border-r border-gray-100">
                              {rt.s2Average > 0 ? rt.s2Average.toFixed(2) : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-center bg-purple-50/15 text-purple-900 font-mono font-extrabold text-sm whitespace-nowrap">
                              {rt.yearEndAverage > 0 ? rt.yearEndAverage.toFixed(2) : '—'}
                            </td>
                          </>
                        );
                      })()}
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

      {/* EXCEL IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transform scale-100 transition-all">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">នាំចូលពិន្ទុតាម Excel / CSV</h3>
                  <p className="text-[11px] text-indigo-700/80 font-semibold">បញ្ចូលពិន្ទុសម្រាប់រដូវកាលសិក្សា៖ <span className="underline">{PERIODS.find(p => p.value === selectedPeriod)?.labelKh}</span></p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 gray-scrollbar">
              {importSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle className="w-10 h-10 animate-bounce" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">ការនាំចូលជោគជ័យ!</h4>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">{importSuccess}</p>
                </div>
              ) : (
                <>
                  {/* Step 1: Formats & Template */}
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/40 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-indigo-900 space-y-1">
                        <span className="font-bold block text-sm">របៀបនាំចូលពី Excel៖</span>
                        <p>១. ចុចប៊ូតុងខាងក្រោមដើម្បី <span className="font-black underline">ចម្លងទម្រង់សិស្ស</span> រួចយកទៅ <span className="font-black underline">Paste (Ctrl+V)</span> ក្នុងកម្មវិធី Excel ឬ Google Sheets របស់អ្នក។</p>
                        <p>២. បំពេញពិន្ទុរបស់សិស្សម្នាក់ៗតាមមុខវិជ្ជា (ចន្លោះពី ០ ដល់ ១០)។</p>
                        <p>៣. ចម្លងជួរឈរទាំងអស់ រួមទាំងចំណងជើងពី Excel រួចយកមក <span className="font-black underline">Paste</span> ក្នុងប្រអប់ទិន្នន័យខាងក្រោម ឬរក្សាទុកជាឯកសារ .CSV រួច Upload ចូល។</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyExcelTemplate}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-6"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      ចម្លងគំរូទម្រង់ Excel សម្រាប់សិស្សបច្ចុប្បន្ន
                    </button>
                  </div>

                  {/* Step 2: Paste / Upload Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">បិទភ្ជាប់ទិន្នន័យពី Excel ឬ Upload ឯកសារ CSV (Paste or Upload Data)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">ឬជ្រើសរើសឯកសារ CSV:</span>
                        <label className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px] rounded-lg cursor-pointer transition-all border border-gray-200">
                          <Upload className="w-3 h-3 inline mr-1" />
                          ជ្រើសរើសឯកសារ
                          <input 
                            type="file" 
                            accept=".csv,.txt" 
                            onChange={handleFileUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>

                    <textarea
                      value={importText}
                      onChange={(e) => handleProcessImportText(e.target.value)}
                      placeholder="ចម្លងទិន្នន័យពី Excel (Copy all rows including headers) រួចបិទភ្ជាប់ (Paste) នៅទីនេះ..."
                      className="w-full h-40 p-4 border border-gray-200 rounded-2xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
                    />
                  </div>

                  {/* Step 3: Error or Preview display */}
                  {importError && (
                    <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-start gap-2 border border-rose-100">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold">កំហុសក្នុងការវិភាគ៖</span> {importError}
                      </div>
                    </div>
                  )}

                  {importPreview.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700">លទ្ធផលនៃការវិភាគទិន្នន័យ ({importPreview.length} ជួររកឃើញ)៖</span>
                        <span className="text-[10px] text-indigo-650 font-bold">
                          ត្រូវគ្នា៖ {importPreview.filter(p => p.matched).length} / មិនត្រូវគ្នា៖ {importPreview.filter(p => !p.matched).length}
                        </span>
                      </div>
                      
                      <div className="border border-gray-150 rounded-xl overflow-hidden max-h-48 overflow-y-auto gray-scrollbar text-xs">
                        <table className="w-full border-collapse text-left">
                          <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-150 sticky top-0">
                            <tr>
                              <th className="px-3 py-2">អត្តសញ្ញាណ (ID)</th>
                              <th className="px-3 py-2">ឈ្មោះសិស្សក្នុងប្រព័ន្ធ</th>
                              <th className="px-3 py-2 text-center">ស្ថានភាព</th>
                              <th className="px-3 py-2">ពិន្ទុដែលនឹងនាំចូល (Scores parsed)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {importPreview.map((item, idx) => (
                              <tr key={idx} className={item.matched ? 'hover:bg-slate-50/50' : 'bg-rose-50/30'}>
                                <td className="px-3 py-2 font-mono font-bold text-gray-600">{item.studentId}</td>
                                <td className={`px-3 py-2 font-bold ${item.matched ? 'text-gray-900' : 'text-rose-650'}`}>
                                  {item.studentName}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {item.matched ? (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-bold">ត្រូវគ្នា</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">រកមិនឃើញសិស្ស</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-mono text-gray-500 max-w-xs truncate">
                                  {Object.keys(item.scores).length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(item.scores).map(([subj, val]) => (
                                        <span key={subj} className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1 rounded">
                                          {subj}: {val}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">គ្មានពិន្ទុ</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!importSuccess && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportText('');
                    setImportPreview([]);
                    setImportError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  disabled={importPreview.length === 0 || importPreview.filter(p => p.matched).length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  យល់ព្រមនាំចូល ({importPreview.filter(p => p.matched).length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
