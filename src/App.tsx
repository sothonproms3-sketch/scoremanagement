import React, { useState, useEffect } from 'react';
import { Student, SubjectScores, AttendanceRecord, AppData, AcademicPeriod } from './types';
import { SAMPLE_STUDENTS, SAMPLE_SCORES, SAMPLE_ATTENDANCE } from './sampleData';
import { exportStudentProfilesToCSV, exportCumulativeGradesToCSV, exportCumulativeAttendanceToCSV } from './utils';

// Modular Tab Components
import StudentsTab from './components/StudentsTab';
import GradeEntryTab from './components/GradeEntryTab';
import RankingsTab from './components/RankingsTab';
import AttendanceTab from './components/AttendanceTab';
import DocumentsTab from './components/DocumentsTab';

// App Icons
import { 
  GraduationCap, 
  Users, 
  FileSpreadsheet, 
  CalendarCheck, 
  Trophy, 
  Award, 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  ClipboardCheck, 
  Building,
  Check
} from 'lucide-react';

const STORAGE_KEY = 'khmer_primary_gradebook_db_v1';

export default function App() {
  // Master application state
  const [appData, setAppData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'scores' | 'attendance' | 'rankings' | 'documents'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Class metadata settings inputs
  const [schoolName, setSchoolName] = useState('សាលាបឋមសិក្សាគំរូពញាក្រែក');
  const [gradeClass, setGradeClass] = useState('ថ្នាក់ទី ៥ អា');
  const [classTeacher, setClassTeacher] = useState('កែវ ច័ន្ទតារា');
  const [academicYear, setAcademicYear] = useState('២០២៤-២០២៥');

  // Load database from LocalStorage or seed with realistic sample data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppData;
        setAppData(parsed);
        // Load settings inputs
        if (parsed.classInfo) {
          setSchoolName(parsed.classInfo.schoolName || 'សាលាបឋមសិក្សាគំរូពញាក្រែក');
          setGradeClass(parsed.classInfo.gradeClass || 'ថ្នាក់ទី ៥ អា');
          setClassTeacher(parsed.classInfo.classTeacher || 'កែវ ច័ន្ទតារា');
          setAcademicYear(parsed.classInfo.academicYear || '២០២៤-២០២៥');
        }
      } catch (err) {
        console.error('Failed to parse local storage gradebook data, resetting.', err);
        seedSampleDatabase();
      }
    } else {
      seedSampleDatabase();
    }
  }, []);

  // Save database to LocalStorage whenever appData changes
  const saveToLocalStorage = (newData: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setShowSavedIndicator(true);
    if ((window as any).saveTimeout) {
      clearTimeout((window as any).saveTimeout);
    }
    (window as any).saveTimeout = setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);
  };

  // Seeding helper
  const seedSampleDatabase = () => {
    const initialData: AppData = {
      students: SAMPLE_STUDENTS,
      scores: SAMPLE_SCORES,
      attendance: SAMPLE_ATTENDANCE,
      classInfo: {
        schoolName: 'សាលាបឋមសិក្សាគំរូពញាក្រែក',
        gradeClass: 'ថ្នាក់ទី ៥ អា',
        classTeacher: 'កែវ ច័ន្ទតារា',
        academicYear: '២០២៤-២០២៥'
      }
    };
    setAppData(initialData);
    setSchoolName(initialData.classInfo.schoolName);
    setGradeClass(initialData.classInfo.gradeClass);
    setClassTeacher(initialData.classInfo.classTeacher);
    setAcademicYear(initialData.classInfo.academicYear);
    saveToLocalStorage(initialData);
  };

  // Save Class Info Metadata
  const handleUpdateClassInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appData) return;

    const updated: AppData = {
      ...appData,
      classInfo: {
        schoolName: schoolName.trim(),
        gradeClass: gradeClass.trim(),
        classTeacher: classTeacher.trim(),
        academicYear: academicYear.trim()
      }
    };

    setAppData(updated);
    saveToLocalStorage(updated);
    setShowSettings(false);
  };

  // Student Actions
  const handleAddStudent = (student: Student) => {
    if (!appData) return;
    
    // Inject current class fields to student record
    const newStudent: Student = {
      ...student,
      classTeacher,
      gradeClass,
      academicYear
    };

    const updated: AppData = {
      ...appData,
      students: [...appData.students, newStudent]
    };
    setAppData(updated);
    saveToLocalStorage(updated);
  };

  const handleImportStudents = (newStudents: Student[]) => {
    if (!appData) return;

    // Inject class fields into all imported students
    const injectedStudents = newStudents.map(student => ({
      ...student,
      classTeacher,
      gradeClass,
      academicYear
    }));

    const updated: AppData = {
      ...appData,
      students: [...appData.students, ...injectedStudents]
    };
    setAppData(updated);
    saveToLocalStorage(updated);
  };

  const handleUpdateStudent = (student: Student) => {
    if (!appData) return;
    const updated: AppData = {
      ...appData,
      students: appData.students.map(s => s.id === student.id ? student : s)
    };
    setAppData(updated);
    saveToLocalStorage(updated);
  };

  const handleDeleteStudent = (id: string) => {
    if (!appData) return;
    
    // Delete student, their scores, and attendance record
    const nextScores = { ...appData.scores };
    delete nextScores[id];

    const nextAttendance = { ...appData.attendance };
    delete nextAttendance[id];

    const updated: AppData = {
      ...appData,
      students: appData.students.filter(s => s.id !== id),
      scores: nextScores,
      attendance: nextAttendance
    };
    
    setAppData(updated);
    saveToLocalStorage(updated);
  };

  // Score Entry Updates
  const handleSaveScores = (studentId: string, period: AcademicPeriod, subjectScores: SubjectScores) => {
    if (!appData) return;

    const nextScores = { ...appData.scores };
    if (!nextScores[studentId]) {
      nextScores[studentId] = {};
    }
    nextScores[studentId][period] = subjectScores;

    const updated: AppData = {
      ...appData,
      scores: nextScores
    };

    setAppData(updated);
    saveToLocalStorage(updated);
  };

  // Attendance Updates
  const handleSaveAttendance = (studentId: string, month: string, record: AttendanceRecord) => {
    if (!appData) return;

    const nextAttendance = { ...appData.attendance };
    if (!nextAttendance[studentId]) {
      nextAttendance[studentId] = {};
    }
    nextAttendance[studentId][month] = record;

    const updated: AppData = {
      ...appData,
      attendance: nextAttendance
    };

    setAppData(updated);
    saveToLocalStorage(updated);
  };

  // Export entire gradebook as JSON backup file
  const handleExportBackup = () => {
    if (!appData) return;
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gradebook_backup_${gradeClass}_${academicYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as AppData;
        if (parsed.students && parsed.scores && parsed.attendance && parsed.classInfo) {
          setAppData(parsed);
          setSchoolName(parsed.classInfo.schoolName);
          setGradeClass(parsed.classInfo.gradeClass);
          setClassTeacher(parsed.classInfo.classTeacher);
          setAcademicYear(parsed.classInfo.academicYear);
          saveToLocalStorage(parsed);
          alert('បានទាញចូលទិន្នន័យ (Import JSON) រក្សាទុកដោយជោគជ័យ!');
        } else {
          alert('ទម្រង់ឯកសារ JSON មិនត្រឹមត្រូវតាមលំដាប់ថ្នាក់ទេ!');
        }
      } catch (err) {
        alert('បរាជ័យក្នុងការអានឯកសារ JSON បម្រុង!');
      }
    };
    reader.readAsText(file);
  };

  // Completely wipe data (start blank slate)
  const handleWipeDatabase = () => {
    if (window.confirm('ប្រុងប្រយ័ត្ន! ការលុបនេះនឹងលុបជម្រះសិស្ស ពិន្ទុ និងវត្តមានទាំងអស់ក្នុងប្រព័ន្ធទាំងស្រុង។ តើអ្នកពិតជាចង់លុបមែនទេ?')) {
      const blankData: AppData = {
        students: [],
        scores: {},
        attendance: {},
        classInfo: {
          schoolName: 'សាលាបឋមសិក្សាគំរូពញាក្រែក',
          gradeClass: 'ថ្នាក់ទី ៥ អា',
          classTeacher: 'កែវ ច័ន្ទតារា',
          academicYear: '២០២៤-២០២៥'
        }
      };
      setAppData(blankData);
      saveToLocalStorage(blankData);
    }
  };

  if (!appData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">កំពុងទាញយកទិន្នន័យថ្នាក់រៀន...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col print:bg-white print:min-h-0">
      {/* 1. MASTER HEADER BAR (Hides on standard prints) */}
      <header className="bg-indigo-900 text-white shadow-md sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand traditional framing */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-400 p-2 rounded-2xl shadow-inner text-indigo-950 active-pulse">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-moul text-xs sm:text-sm text-amber-300 uppercase leading-relaxed">
                ផ្ទាំងគ្រប់គ្រងពិន្ទុសិស្សថ្នាក់បឋមសិក្សា
              </h1>
              <p className="text-[10px] text-indigo-200 mt-0.5 tracking-wide flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-300" />
                {appData.classInfo.schoolName} • {appData.classInfo.gradeClass} • {appData.classInfo.academicYear}
              </p>
            </div>
          </div>

          {/* Quick Setup and Settings actions */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white/10 hover:bg-white/20 transition-all text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 border border-white/5 cursor-pointer text-xs"
            >
              <Settings className="w-4 h-4" />
              កែសម្រួលព័ត៌មានថ្នាក់ (Class Info)
            </button>
          </div>
        </div>
      </header>

      {/* Settings collapsible drawer overlay */}
      {showSettings && (
        <div className="no-print bg-indigo-950/20 border-b border-indigo-100 p-6 shadow-inner animate-in slide-in-from-top duration-200">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
            <form onSubmit={handleUpdateClassInfo} className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-150 pb-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-900 text-sm">កែប្រែព័ត៌មានអត្តសញ្ញាណថ្នាក់រៀន (Class Teacher Customization)</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-gray-750">
                <div className="space-y-1.5">
                  <label>ឈ្មោះសាលាបឋមសិក្សា</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-normal focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label>ថ្នាក់រៀន / បន្ទប់</label>
                  <input
                    type="text"
                    required
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-normal focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>
                <div className="space-y-1.5">
                  <label>ឈ្មោះគ្រូទទួលបន្ទុកថ្នាក់</label>
                  <input
                    type="text"
                    required
                    value={classTeacher}
                    onChange={(e) => setClassTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-normal focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label>ឆ្នាំសិក្សា</label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-normal focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                {/* Advanced Database Tools */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-3.5 py-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ចម្លងទិន្នន័យ (Export JSON)
                  </button>

                  <label className="px-3.5 py-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    ទាញទិន្នន័យបម្រុង (Import JSON)
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={seedSampleDatabase}
                    className="px-3.5 py-1.5 text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    បញ្ចូលទិន្នន័យគំរូឡើងវិញ (Load Sample)
                  </button>

                  <button
                    type="button"
                    onClick={handleWipeDatabase}
                    className="px-3.5 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    លុបជម្រះព័ត៌មានសិស្សទាំងអស់ (Clear)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer font-semibold"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all hover:shadow-md cursor-pointer font-semibold"
                  >
                    កត់ត្រាផ្លាស់ប្តូរ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SUB NAVIGATION BAR (Hides on standard print layouts) */}
      <nav className="bg-white border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-1.5 sm:py-2 gap-3">
            <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              ផ្ទាំងគ្រប់គ្រង (Home)
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <Users className="w-4 h-4" />
              បញ្ជីសិស្ស (Students)
            </button>

            <button
              onClick={() => setActiveTab('scores')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'scores'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              បញ្ចូលពិន្ទុ (Scores Matrix)
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              ស្រង់វត្តមាន (Attendance Check)
            </button>

            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'rankings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              ចំណាត់ថ្នាក់ &amp; តារាងកិត្តិយស (Ranks)
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50/50'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-600" />
              សៀវភៅតាមដាន &amp; សិក្ខាគារិក (Reports)
            </button>
            
            </div>

            {/* Visual Storage Save Status Indicator */}
            <div className="flex items-center justify-center shrink-0 select-none">
              <div 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide border transition-all duration-300 ${
                  showSavedIndicator 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-3xs scale-100 opacity-100' 
                    : 'bg-slate-50/60 text-slate-400 border-slate-100 scale-95 opacity-85'
                }`}
                title="ទិន្នន័យត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិទៅក្នុងកម្មវិធីរុករករបស់អ្នក (Autosaved to local browser)"
              >
                {showSavedIndicator ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3.5] animate-bounce" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-300 relative flex items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75"></span>
                  </div>
                )}
                <span className="font-sans text-[11px] font-medium">
                  {showSavedIndicator ? 'រក្សាទុករួចរាល់ (Saved!)' : 'រក្សាទុកស្វ័យប្រវត្ត (Auto Saved)'}
                </span>
              </div>
            </div>

          </div>
        </div>
      </nav>

      {/* 3. CORE CONTAINER FRAME */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full print:p-0 print:m-0">
        
        {/* TAB 1: QUICK DASHBOARD SUMMARY */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 no-print">
            {/* Banner card */}
            <div className="bg-gradient-to-r from-indigo-805 to-indigo-900 text-white rounded-3xl p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <span className="bg-amber-400 text-indigo-950 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  សិក្សាធិការបឋម
                </span>
                <h2 className="font-moul text-lg sm:text-xl text-amber-300 leading-relaxed uppercase">
                  សូមស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងសរុបថ្នាក់បឋម
                </h2>
                <p className="text-indigo-100 text-xs leading-relaxed font-sans">
                  កម្មវិធីនេះរចនាឡើងពិសេសសម្រាប់លោកគ្រូ អ្នកគ្រូក្នុងការស្រង់វត្តមានសិស្សប្រចាំខែ (មានច្បាប់ អត់ច្បាប់ យឺត) បញ្ចូលពិន្ទុមុខវិទ្យា (ភាសាខ្មែរ គណិត វិទ្យាសាស្ត្រ សិក្សាសង្គម អប់រំកាយ/សិល្បៈ) កំណត់ចំណាត់ថ្នាក់ប្រកួតប្រជែង តារាងកិត្តិយស និងរៀបចំសៀវភៅតាមដាន (Report Cards) បោះពុម្ពបានភ្លាមៗ!
                </p>
              </div>
              <div className="bg-amber-400 p-5 rounded-2xl text-indigo-950 font-moul shrink-0 text-center space-y-1 ring-4 ring-amber-400/20 active-pulse">
                <p className="text-[12px]">ថ្នាក់រៀនសកម្ម</p>
                <p className="text-3xl font-extrabold font-sans mt-1">{appData.classInfo.gradeClass}</p>
              </div>
            </div>

            {/* General instructions step overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-indigo-600" />
                  សេចក្តីណែនាំអំពីការប្រើប្រាស់ (Step-by-step Class Guide)
                </h3>
                <ul className="space-y-3.5 text-xs text-gray-650 font-medium">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">1</span>
                    <span><strong>ចុះឈ្មោះសិស្ស៖</strong> ចូលទៅកាន់ផ្ទាំង <strong className="text-indigo-600">“បញ្ជីសិស្ស”</strong> ដើម្បីបញ្ចូលឈ្មោះ ភេទ ថ្ងៃខែ កន្លែងកំណើត និងប្រវត្តិអាណាព្យាបាលសិស្ស។</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">2</span>
                    <span><strong>បញ្ចូលពិន្ទុ៖</strong> ជ្រើសរើសខែនីមួយៗ រួចបញ្ចូលពិន្ទុមុខវិជ្ជាទាំង៥ (គិតពី 0 ដល់ 10)។ ប្រព័ន្ធនឹងធ្វើការបូកសរុប និងគណនាមធ្យមភាគដោយស្វ័យប្រវត្ត។</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">3</span>
                    <span><strong>កត់ត្រាវត្តមាន៖</strong> ស្រង់អវត្តមានសិស្សប្រចាំខែ (មានច្បាប់ អត់ច្បាប់ យឺត)។</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 font-bold">4</span>
                    <span><strong>ទាញយកឯកសារបោះពុម្ព៖</strong> ចូលទៅកាន់ <strong className="text-indigo-650">“សៀវភៅតាមដាន &amp; សិក្ខាគារិក”</strong> ដើម្បីមើលរបាយការណ៍ និងបោះពុម្ពព្រីនចេញជា PDF ជូនអាណាព្យាបាល។</span>
                  </li>
                </ul>
              </div>

              {/* Class overall stats quick jump */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">
                    ស្ថិតិសង្ខេបថ្នាក់រៀន (Class Analytics Overview)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-3.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block pb-1">សិស្សទូទាំងថ្នាក់</span>
                      <strong className="text-xl text-gray-800 font-mono">{appData.students.length} នាក់</strong>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl text-center">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block pb-1">សិស្សស្រីសរុប</span>
                      <strong className="text-xl text-rose-600 font-mono">{appData.students.filter(s => s.gender === 'ស្រី').length} នាក់</strong>
                    </div>
                  </div>
                </div>

                <div className="flex bg-slate-50 border border-gray-150 rounded-xl p-3.5 gap-3 items-center mt-4">
                  <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <Building className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-800">សាលាបឋមសិក្សា៖ {appData.classInfo.schoolName}</p>
                    <p className="text-gray-500 mt-0.5">គ្រូបន្ទុក៖ {appData.classInfo.classTeacher}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Consolidated Excel/CSV Export Tools Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    ទាញយករបាយការណ៍រួមសម្រាប់ Excel / Google Sheets (Excel Integration Tools)
                  </h3>
                  <p className="text-xs text-gray-400">
                    នាំចេញទិន្នន័យរួមទូទាំងឆ្នាំសិក្សា ដើម្បីបើកវិភាគលម្អិតបន្ថែមលើកម្មវិធី Excel ឬ Google Sheets ដោយសុវត្ថិភាព និងរក្សាអក្សរខ្មែរឲ្យត្រឹមត្រូវ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Export Profiles */}
                <button
                  type="button"
                  onClick={() => exportStudentProfilesToCSV(appData.students, appData.classInfo)}
                  disabled={appData.students.length === 0}
                  className="p-4 border border-emerald-100 bg-emerald-50/10 hover:bg-emerald-50 rounded-xl transition-all text-left space-y-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-sans"
                >
                  <div className="bg-emerald-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                      នាំចេញបញ្ជីប្រវត្តិរូបសិស្ស
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      នាំចេញព័ត៌មានអត្តសញ្ញាណ ភេទ ថ្ងៃខែ និងព័ត៌មានអាណាព្យាបាលសិស្សទាំងអស់
                    </p>
                  </div>
                </button>

                {/* 2. Export Grades */}
                <button
                  type="button"
                  onClick={() => exportCumulativeGradesToCSV(appData.students, appData.scores, appData.classInfo)}
                  disabled={appData.students.length === 0}
                  className="p-4 border border-indigo-100 bg-indigo-50/10 hover:bg-indigo-50 rounded-xl transition-all text-left space-y-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-sans"
                >
                  <div className="bg-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm group-hover:text-indigo-700 transition-colors">
                      នាំចេញតារាងពិន្ទុរួមប្រចាំឆ្នាំ
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      នាំចេញពិន្ទុមធ្យមភាគប្រចាំខែ ឆមាស និងពិន្ទុសរុបដំណាច់ឆ្នាំរួមលំដាប់ថ្នាក់សិស្ស
                    </p>
                  </div>
                </button>

                {/* 3. Export Attendance */}
                <button
                  type="button"
                  onClick={() => exportCumulativeAttendanceToCSV(appData.students, appData.attendance, appData.classInfo)}
                  disabled={appData.students.length === 0}
                  className="p-4 border border-rose-100 bg-rose-50/10 hover:bg-rose-50 rounded-xl transition-all text-left space-y-2 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-sans"
                >
                  <div className="bg-rose-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-sm">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs sm:text-sm group-hover:text-rose-700 transition-colors">
                      នាំចេញតារាងវត្តមានរួមប្រចាំឆ្នាំ
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      នាំចេញចំនួនអវត្តមានមានច្បាប់ អត់ច្បាប់ និងយឺតរបស់សិស្សសរុបទូទាំងឆ្នាំសិក្សា
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: STUDENTS REGISTRATION FRAME */}
        {activeTab === 'students' && (
          <div>
            <StudentsTab 
              students={appData.students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              classInfo={appData.classInfo}
            />
          </div>
        )}

        {/* TAB 3: GRADES INPUT GRID SHEET */}
        {activeTab === 'scores' && (
          <div className="no-print">
            <GradeEntryTab 
              students={appData.students}
              scores={appData.scores}
              onSaveScores={handleSaveScores}
            />
          </div>
        )}

        {/* TAB 4: MONTHLY ATTENDANCE REGISTER */}
        {activeTab === 'attendance' && (
          <div className="no-print">
            <AttendanceTab 
              students={appData.students}
              attendance={appData.attendance}
              onSaveAttendance={handleSaveAttendance}
            />
          </div>
        )}

        {/* TAB 5: RANKINGS TABLE & PEDESTALS */}
        {activeTab === 'rankings' && (
          <div>
            <RankingsTab 
              students={appData.students}
              scores={appData.scores}
            />
          </div>
        )}

        {/* TAB 6: ACADEMIC BOOKLETS & PRINT PDF GENERATOR */}
        {activeTab === 'documents' && (
          <div>
            <DocumentsTab 
              students={appData.students}
              scores={appData.scores}
              attendance={appData.attendance}
              classInfo={appData.classInfo}
            />
          </div>
        )}

      </main>

      {/* 4. FOOTER NOTE */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-medium text-gray-500">កម្មវិធីបញ្ចូលពិន្ទុសិស្សថ្នាក់បឋមសិក្សា © ២០២៦</p>
          <p className="text-[10px] text-gray-400">សហការបង្កើតដោយលោកគ្រូ អ្នកគ្រូក្នុងការសម្រួលរាល់កិច្ចការដោះស្រាយពិន្ទុបុគ្គលិកសិក្សា។ រក្សាសិទ្ធិគ្រប់យ៉ាង</p>
        </div>
      </footer>
    </div>
  );
}
