import React, { useState, useRef, useEffect } from 'react';
import { Student } from '../types';
import { UserPlus, Search, Edit2, Trash2, Users, UserCheck, ShieldAlert, GraduationCap, Phone, MapPin, Download, Camera, Video, VideoOff, RefreshCw, X, Upload, FileSpreadsheet, Printer } from 'lucide-react';
import { exportToCSV } from '../utils';

interface StudentsTabProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onImportStudents?: (newStudents: Student[]) => void;
  classInfo?: {
    schoolName: string;
    gradeClass: string;
    classTeacher: string;
    academicYear: string;
  };
}

export default function StudentsTab({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onImportStudents,
  classInfo
}: StudentsTabProps) {
  // Shared utility functions for Khmer digits and Age calculation
  const toKhmerDigits = (num: number | string): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return String(num).replace(/\d/g, (char) => khmerDigits[parseInt(char, 10)]);
  };

  const khmerToEnglishDigits = (str: string): string => {
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return str.replace(/[០-៩]/g, (char) => khmerDigits.indexOf(char).toString());
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

  const [searchTerm, setSearchTerm] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'boys' | 'girls' | 'incomplete'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Import Students States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [importPreviewList, setImportPreviewList] = useState<Partial<Student>[]>([]);
  const [importFileError, setImportFileError] = useState<string | null>(null);

  // Form State
  const [nameKh, setNameKh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [gender, setGender] = useState<'ប្រុស' | 'ស្រី'>('ប្រុស');
  const [dob, setDob] = useState('');
  const [pob, setPob] = useState('');
  const [pobProvince, setPobProvince] = useState('ភ្នំពេញ');
  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherJob, setFatherJob] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherJob, setMotherJob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle stream assignment when camera becomes active
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 } 
        }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("មិនអាចបើកកាមេរ៉ាបានទេ! សូមពិនិត្យការអនុញ្ញាតចួលប្រើប្រាស់។ (Could not access camera. Please check permissions.)");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const size = Math.min(videoWidth, videoHeight);
      
      canvas.width = 320;
      canvas.height = 320;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror horizontally to match normal user-facing camera perspective
        ctx.translate(320, 0);
        ctx.scale(-1, 1);
        
        const sx = (videoWidth - size) / 2;
        const sy = (videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleCloseForm = () => {
    stopCamera();
    setIsFormOpen(false);
  };

  // Real-time Parser for Excel (TSV) / CSV pasted data or CSV uploaded files
  useEffect(() => {
    if (!rawImportText.trim()) {
      setImportPreviewList([]);
      return;
    }

    const lines = rawImportText.split(/\r?\n/);
    const parsed: Partial<Student>[] = [];
    let generatedNo = students.length + 1;

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Skip common table headers if they mismatch values
      const lower = line.toLowerCase();
      if (
        lower.includes('ឈ្មោះ') || 
        lower.includes('name') || 
        lower.includes('id') || 
        lower.includes('gender') || 
        lower.includes('ភេទ') ||
        lower.includes('អត្តសញ្ញាណ')
      ) {
        continue;
      }

      let parts: string[] = [];
      // Excel/Sheets defaults to tab separations on copying table columns.
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        parts = [line];
      }

      parts = parts.map(p => p.trim());
      if (parts.length === 0 || parts[0] === '') continue;

      let id = '';
      let nKh = '';
      let nEn = '';
      let g: 'ប្រុស' | 'ស្រី' = 'ប្រុស';
      let d = '2015-01-01';
      let phone = '';
      let fName = '';
      let mName = '';

      // Auto columns mapping
      if (parts.length === 1) {
        nKh = parts[0];
      } else if (parts.length === 2) {
        nKh = parts[0];
        nEn = parts[1];
      } else if (parts.length === 3) {
        if (parts[2] === 'ប្រុស' || parts[2] === 'ស្រី' || ['m', 'f', 'male', 'female', 'boy', 'girl'].includes(parts[2].toLowerCase())) {
          nKh = parts[0];
          nEn = parts[1];
          const gStr = parts[2].toLowerCase();
          g = (gStr === 'ស្រី' || gStr === 'f' || gStr === 'female' || gStr === 'girl') ? 'ស្រី' : 'ប្រុស';
        } else {
          id = parts[0];
          nKh = parts[1];
          nEn = parts[2];
        }
      } else {
        // Checking if column 0 looks like standard ID prefix
        const looksLikeId = /^(std|id|\d+$)/i.test(parts[0]) || parts[0].length < 8;
        let startIdx = 0;
        if (looksLikeId) {
          id = parts[0];
          startIdx = 1;
        }

        nKh = parts[startIdx] || '';
        nEn = parts[startIdx + 1] || '';

        const genStr = (parts[startIdx + 2] || '').toLowerCase();
        g = (genStr === 'ស្រី' || genStr === 'f' || genStr === 'female' || genStr === 'girl' || genStr.includes('ស្រី') || genStr.includes('female')) ? 'ស្រី' : 'ប្រុស';

        d = parts[startIdx + 3] || '2015-01-01';
        phone = parts[startIdx + 4] || '';
        fName = parts[startIdx + 5] || '';
        mName = parts[startIdx + 6] || '';
      }

      // Safeguard date or fallback
      if (d && !d.includes('-') && d.length === 8) {
        // format YYYYMMDD
        d = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
      }

      // Format English names upper
      nEn = nEn.toUpperCase().replace(/[^A-Z\s]/g, '');

      // Generate local student ID avoiding existing ones
      if (!id) {
        let isDup = true;
        while (isDup) {
          const paddedNum = String(generatedNo).padStart(3, '0');
          const candidateId = `STD-${paddedNum}`;
          if (!students.some(s => s.id === candidateId) && !parsed.some(s => s.id === candidateId)) {
            id = candidateId;
            isDup = false;
          }
          generatedNo++;
        }
      }

      if (nKh) {
        parsed.push({
          id,
          nameKh: nKh,
          nameEn: nEn || nKh.split(' ').map(() => 'X').join(''),
          gender: g,
          dob: d,
          phoneNumber: phone,
          pob: '',
          pobProvince: 'ភ្នំពេញ',
          address: '',
          fatherName: fName,
          motherName: mName,
          fatherJob: '',
          motherJob: ''
        });
      }
    }

    setImportPreviewList(parsed);
  }, [rawImportText, students]);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setRawImportText(text);
      } catch (err) {
        setImportFileError('បរាជ័យក្នុងការអានឯកសារ CSV/Excel! (Could not read file.)');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdatePreviewField = (index: number, field: keyof Student, value: any) => {
    const updated = [...importPreviewList];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setImportPreviewList(updated);
  };

  const handleRemovePreviewRow = (index: number) => {
    const updated = importPreviewList.filter((_, idx) => idx !== index);
    setImportPreviewList(updated);
  };

  const handleConfirmBatchImport = () => {
    if (importPreviewList.length === 0) return;

    // Filter duplicate IDs from the final insert
    const finalStudents: Student[] = [];
    const idSet = new Set<string>();

    for (const s of importPreviewList) {
      let finalId = s.id || 'STD-' + Math.random().toString().slice(-4);
      
      // Ensure unique student ID
      let safetyCounter = 1;
      while (students.some(existing => existing.id === finalId) || idSet.has(finalId)) {
        finalId = `${s.id || 'STD'}-${safetyCounter}`;
        safetyCounter++;
      }

      idSet.add(finalId);

      finalStudents.push({
        id: finalId,
        nameKh: s.nameKh || '',
        nameEn: (s.nameEn || '').toUpperCase(),
        gender: s.gender || 'ប្រុស',
        dob: s.dob || '2015-01-01',
        pob: s.pob || '',
        pobProvince: s.pobProvince || 'ភ្នំពេញ',
        address: s.address || '',
        fatherName: s.fatherName || '',
        fatherJob: s.fatherJob || '',
        motherName: s.motherName || '',
        motherJob: s.motherJob || '',
        phoneNumber: s.phoneNumber || '',
        classTeacher: '',
        gradeClass: '',
        academicYear: ''
      });
    }

    if (onImportStudents) {
      onImportStudents(finalStudents);
    } else {
      finalStudents.forEach(st => onAddStudent(st));
    }

    setRawImportText('');
    setImportPreviewList([]);
    setIsImportOpen(false);
    alert(`នាំចូលសិស្សចំនួន ${finalStudents.length} នាក់ដោយជោគជ័យ! (Successfully imported ${finalStudents.length} students!)`);
  };

  // Handle opening form for adding
  const handleOpenAddForm = () => {
    setEditingStudent(null);
    setNameKh('');
    setNameEn('');
    setGender('ប្រុស');
    setDob('2015-01-01');
    setPob('');
    setPobProvince('ភ្នំពេញ');
    setAddress('');
    setFatherName('');
    setFatherJob('');
    setMotherName('');
    setMotherJob('');
    setPhoneNumber('');
    setPhotoUrl('');
    setIsFormOpen(true);
  };

  // Handle opening form for editing
  const handleOpenEditForm = (student: Student) => {
    setEditingStudent(student);
    setNameKh(student.nameKh);
    setNameEn(student.nameEn);
    setGender(student.gender);
    setDob(student.dob || '2015-01-01');
    setPob(student.pob || '');
    setPobProvince(student.pobProvince || 'ភ្នំពេញ');
    setAddress(student.address || '');
    setFatherName(student.fatherName || '');
    setFatherJob(student.fatherJob || '');
    setMotherName(student.motherName || '');
    setMotherJob(student.motherJob || '');
    setPhoneNumber(student.phoneNumber || '');
    setPhotoUrl(student.photoUrl || '');
    setIsFormOpen(true);
  };

  // Handle submitting form (add or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKh.trim()) return alert('សូមបញ្ចូលឈ្មោះជាភាសាខ្មែរ!');

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : 'STD-' + Date.now().toString().slice(-4),
      nameKh: nameKh.trim(),
      nameEn: nameEn.trim().toUpperCase(),
      gender,
      dob,
      pob: pob.trim(),
      pobProvince,
      address: address.trim(),
      fatherName: fatherName.trim(),
      fatherJob: fatherJob.trim(),
      motherName: motherName.trim(),
      motherJob: motherJob.trim(),
      phoneNumber: phoneNumber.trim(),
      classTeacher: editingStudent?.classTeacher || '',
      gradeClass: editingStudent?.gradeClass || '',
      academicYear: editingStudent?.academicYear || '',
      photoUrl: photoUrl.trim() || undefined,
    };

    if (editingStudent) {
      onUpdateStudent(studentData);
    } else {
      onAddStudent(studentData);
    }
    handleCloseForm();
  };

  const handleDelete = (id: string) => {
    onDeleteStudent(id);
    setShowDeleteConfirm(null);
  };

  const getMissingFields = (student: Student) => {
    const missing = [];
    if (!student.dob || student.dob === '2015-01-01' || student.dob === '—') missing.push('ថ្ងៃខែឆ្នាំកំណើត');
    if (!student.pob?.trim()) missing.push('ទីកន្លែងកំណើត');
    if (!student.address?.trim()) missing.push('អាសយដ្ឋាន');
    if (!student.phoneNumber?.trim()) missing.push('លេខទូរស័ព្ទ');
    if (!student.fatherName?.trim()) missing.push('ឈ្មោះឪពុក');
    if (!student.motherName?.trim()) missing.push('ឈ្មោះម្តាយ');
    return missing;
  };

  // Filter students based on search term and selected record completion status / gender
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nameKh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (recordFilter === 'boys') return student.gender === 'ប្រុស';
    if (recordFilter === 'girls') return student.gender === 'ស្រី';
    if (recordFilter === 'incomplete') {
      return getMissingFields(student).length > 0;
    }
    return true;
  });

  const maleCount = students.filter(s => s.gender === 'ប្រុស').length;
  const femaleCount = students.filter(s => s.gender === 'ស្រី').length;

  const handleExportCSV = () => {
    const headers = [
      'អត្តសញ្ញាណ (ID)',
      'ឈ្មោះខ្មែរ (Khmer Name)',
      'ឈ្មោះឡាតាំង (Latin Name)',
      'ភេទ (Gender)',
      'ថ្ងៃខែឆ្នាំកំណើត (DOB)',
      'ទីកន្លែងកំណើត (POB)',
      'ខេត្ត (Province)',
      'អាសយដ្ឋានបច្ចុប្បន្ន (Address)',
      'ឈ្មោះឪពុក (Father Name)',
      'មុខរបរឪពុក (Father Job)',
      'ឈ្មោះម្តាយ (Mother Name)',
      'មុខរបរម្តាយ (Mother Job)',
      'លេខទូរស័ព្ទ (Phone)'
    ];
    
    const rows = filteredStudents.map(s => [
      s.id,
      s.nameKh,
      s.nameEn,
      s.gender,
      s.dob || '',
      s.pob || '',
      s.pobProvince || '',
      s.address || '',
      s.fatherName || '',
      s.fatherJob || '',
      s.motherName || '',
      s.motherJob || '',
      s.phoneNumber || ''
    ]);

    exportToCSV('បញ្ជីឈ្មោះសិស្ស_students_list.csv', headers, rows);
  };

  return (
    <>
      <div className="space-y-6 no-print">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-indigo-600 text-sm font-medium">សិស្សសរុប (Total Students)</p>
            <h3 className="text-3xl font-bold font-mono text-indigo-900 mt-1">{students.length} នាក់</h3>
          </div>
          <div className="bg-indigo-500 text-white p-3 rounded-xl shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-blue-600 text-sm font-medium">សិស្សប្រុស (Boys)</p>
            <h3 className="text-3xl font-bold font-mono text-blue-900 mt-1">{maleCount} នាក់</h3>
          </div>
          <div className="bg-blue-500 text-white p-3 rounded-xl shadow-xs">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-rose-600 text-sm font-medium">សិស្សស្រី (Girls)</p>
            <h3 className="text-3xl font-bold font-mono text-rose-900 mt-1">{femaleCount} នាក់</h3>
          </div>
          <div className="bg-rose-500 text-white p-3 rounded-xl shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main List & Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 flex-1 select-none">
            <div className="relative w-full md:max-w-xs shrink-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="ស្វែងរកតាម ឈ្មោះ ឬអត្តសញ្ញាណ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50"
              />
            </div>

            {/* Filter segments */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-50 border border-gray-150 rounded-2xl">
              <button
                onClick={() => setRecordFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  recordFilter === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                }`}
              >
                ទាំងអស់ ({students.length})
              </button>
              <button
                onClick={() => setRecordFilter('boys')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  recordFilter === 'boys'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                }`}
              >
                សិស្សប្រុស ({students.filter(s => s.gender === 'ប្រុស').length})
              </button>
              <button
                onClick={() => setRecordFilter('girls')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  recordFilter === 'girls'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-900 border border-transparent'
                }`}
              >
                សិស្សស្រី ({students.filter(s => s.gender === 'ស្រី').length})
              </button>
              <button
                onClick={() => setRecordFilter('incomplete')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  recordFilter === 'incomplete'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
                title="សិស្សដែលខ្វះព័ត៌មាន (ថ្ងៃកំណើត ទីកន្លែងកំណើត ឈ្មោះឪពុកម្តាយ លេខទូរស័ព្ទ ឬអាសយដ្ឋាន)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                ឯកសារមិនគ្រប់ ({students.filter(s => getMissingFields(s).length > 0).length})
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <button
              onClick={() => setIsImportOpen(true)}
              className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm shadow-xs hover:shadow-sm cursor-pointer"
              title="នាំចូលបញ្ជីឈ្មោះសិស្សពី Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4" />
              នាំចូលសិស្ស Excel/Sheets
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
              title="នាំចេញបញ្ជីឈ្មោះសិស្សជាឯកសារ Excel ឬ CSV"
            >
              <Download className="w-4 h-4" />
              នាំចេញ Excel/CSV
            </button>

            <button
              onClick={() => window.print()}
              className="bg-sky-600 hover:bg-sky-700 transition-colors text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
              title="បោះពុម្ពបញ្ជីឈ្មោះសិស្សជាទម្រង់បែបបទផ្លូវការ"
            >
              <Printer className="w-4 h-4" />
              បោះពុម្ពបញ្ជីសិស្ស
            </button>

            <button
              onClick={handleOpenAddForm}
              className="bg-indigo-600 hover:bg-indigo-750 transition-colors text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              ចុះឈ្មោះសិស្សថ្មី (Add Student)
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium">មិនមានទិន្នន័យសិស្សទេ។</p>
              <p className="text-xs text-gray-400 mt-1">សូមចុចប៊ូតុងខាងលើដើម្បីបង្កើត ឬចុះឈ្មោះសិស្ស។</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">អត្តសញ្ញាណ</th>
                  <th className="px-6 py-4">ឈ្មោះខ្មែរ</th>
                  <th className="px-6 py-4">ឈ្មោះឡាតាំង</th>
                  <th className="px-6 py-4">ភេទ</th>
                  <th className="px-6 py-4">ថ្ងៃខែឆ្នាំកំណើត (អាយុ)</th>
                  <th className="px-6 py-4">អាណាព្យាបាល / ទំនាក់ទំនង</th>
                  <th className="px-6 py-4 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-xs text-gray-400 group-hover:text-indigo-600 transition-colors">
                      {student.id}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.photoUrl?.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.nameEn || student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                          alt={student.nameKh}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-gray-150 object-cover bg-slate-50 shrink-0 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.nameEn || student.id)}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`;
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-850">{student.nameKh}</span>
                          {getMissingFields(student).length > 0 ? (
                            <span 
                              className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-2 py-0.5 mt-0.5 max-w-fit font-sans flex items-center gap-1 font-medium transition-all hover:bg-amber-100" 
                              title={`ឯកសារខ្វះចម្លើយ៖ ${getMissingFields(student).join(', ')}`}
                            >
                              <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                              ខ្វះ៖ {getMissingFields(student).slice(0, 2).join(', ')}{getMissingFields(student).length > 2 && '...'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded-lg px-2 py-0.5 mt-0.5 max-w-fit font-sans font-semibold flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                              ឯកសារគ្រប់ជ្រុងជ្រោយ
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap uppercase">
                      {student.nameEn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        student.gender === 'ស្រី'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{student.dob || '—'}</span>
                        {student.dob && student.dob !== '—' && (
                          <span className="text-[10px] text-indigo-600 font-sans font-bold mt-0.5">
                            អាយុ៖ {toKhmerDigits(getStudentAge(student.dob, classInfo?.academicYear || '២០២៤-២០២៥'))} ឆ្នាំ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-0.5 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">ឪពុក៖ {student.fatherName || '—'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {student.phoneNumber || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2.5">
                        <button
                          onClick={() => handleOpenEditForm(student)}
                          className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="កែសម្រួលព័ត៌មាន"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(student.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="លុបសិស្ស"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 text-red-600 p-3 rounded-full">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="text-lg font-bold text-gray-900">ប្រុងប្រយ័ត្ន! លុបទិន្នន័យសិស្ស</h4>
                <p className="text-sm text-gray-500">
                  តើអ្នកពិតជាចង់លុបទិន្នន័យសិស្សនេះមែនទេ? ពិន្ទុ និងវត្តមានទាំងអស់របស់សិស្សរូបនេះនឹងត្រូវលុបបាត់បង់ជារៀងរហូត។
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                លុបចោល
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50 rounded-t-2xl">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {editingStudent ? 'កែប្រែព័ត៌មានសិស្ស' : 'ចុះឈ្មោះសិស្សថ្មី'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body / Scroll Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Box */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1">១. ព័ត៌មានផ្ទាល់ខ្លួនសិស្ស</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ឈ្មោះសិស្ស (ភាសាខ្មែរ) *</label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. សុខ ជា"
                      value={nameKh}
                      onChange={(e) => setNameKh(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ឈ្មោះសិស្ស (អក្សរឡាតាំង uppercase)</label>
                    <input
                      type="text"
                      placeholder="ឧ. SOK CHEA"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ភេទ *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 w-full cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === 'ប្រុស'}
                          onChange={() => setGender('ប្រុស')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        ប្រុស (Male)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 w-full cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                          type="radio"
                          name="gender"
                          checked={gender === 'ស្រី'}
                          onChange={() => setGender('ស្រី')}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        ស្រី (Female)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ថ្ងៃខែឆ្នាំកំណើត</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ទីកន្លែងកំណើត (ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ)</label>
                    <input
                      type="text"
                      placeholder="ឧ. ភូមិអូរដឹម សង្កាត់ចោមចៅ ខណ្ឌពោធិ៍សែនជ័យ"
                      value={pob}
                      onChange={(e) => setPob(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ខេត្ត/រាជធានី (កំណើត)</label>
                    <input
                      type="text"
                      placeholder="ឧ. រាជធានីភ្នំពេញ"
                      value={pobProvince}
                      onChange={(e) => setPobProvince(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">អាសយដ្ឋានបច្ចុប្បន្ន</label>
                  <input
                    type="text"
                    placeholder="ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-gray-700 block">រូបថតសិស្ស (Student Photo)</label>
                  
                  {isCameraActive ? (
                    <div className="relative w-full max-w-xs mx-auto aspect-square rounded-2xl overflow-hidden bg-black border border-gray-300 shadow-inner flex flex-col justify-end">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
                      />
                      {/* Interactive view bounds overlay for photo alignment */}
                      <div className="absolute inset-4 border border-white/20 rounded-full pointer-events-none flex items-center justify-center">
                        <div className="w-2/3 h-2/3 border border-dashed border-white/30 rounded-full" />
                      </div>
                      
                      {/* Floating control buttons */}
                      <div className="relative z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-full shadow-md hover:shadow-indigo-900/40 cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                          ថតរូប (Capture)
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs py-2 px-4 rounded-full cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <VideoOff className="w-4 h-4" />
                          បិទកាមេរ៉ា
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {/* Image Thumbnail */}
                      <div className="relative w-24 h-24 rounded-2xl border-2 border-gray-200 overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 shadow-sm">
                        <img 
                          src={photoUrl.trim() || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nameEn || 'sample')}&hairColor=2c1b18,4a3728&skinColor=e0a47d,f8d3bb,fbd3c6`}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        {photoUrl.trim() && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                            title="លុបរូបភាព"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Photo Capture & URL source selection controls */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-xs"
                          >
                            <Video className="w-4 h-4" />
                            បើកកាមេរ៉ាថតរូប (Use Camera)
                          </button>
                          
                          {photoUrl.trim().startsWith('data:image/') && (
                            <button
                              type="button"
                              onClick={startCamera}
                              className="bg-slate-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              ថតរូបឡើងវិញ (Retake)
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">ឬ បញ្ចូលតំណភ្ជាប់រូបថត (Or Enter URL)</span>
                          <input
                            type="text"
                            placeholder="បញ្ចូលតំណភ្ជាប់រូបភាពពីអ៊ីនធឺណិត (https://...)"
                            value={photoUrl.startsWith('data:image/') ? '' : photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            disabled={photoUrl.startsWith('data:image/')}
                            className="w-full px-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans disabled:bg-gray-50 disabled:text-gray-400"
                          />
                          {photoUrl.startsWith('data:image/') && (
                            <p className="text-[9px] text-amber-600 italic">
                              * រូបភាពបច្ចុប្បន្នត្រូវបានថតចេញពីកាមេរ៉ាផ្ទាល់។ លុបរូបភាពដើម្បីលីងទៅកាន់ URL ផ្សេង។
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="bg-red-50 text-red-700 px-3.5 py-2.5 rounded-xl border border-red-100 text-xs font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <p className="text-[10px] text-gray-400">
                    * អ្នកអាចថតរូបផ្ទាល់ពីឧបករណ៍ ឬបញ្ចូលតំណភ្ជាប់រូបភាពពីអ៊ីនធឺណិត ឬទុកទទេដើម្បីឱ្យប្រព័ន្ធបង្កើតរូបគំនូរតំណាង (Avatar) ដោយស្វ័យប្រវត្តសម្រាប់តារាងកិត្តិយស។
                  </p>
                </div>
              </div>

              {/* Parents Box */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-1">២. ព័ត៌មានអាណាព្យាបាល (ឪពុក-ម្តាយ)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ឈ្មោះឪពុក</label>
                    <input
                      type="text"
                      placeholder="ឈ្មោះឪពុក"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">មុខរបរឪពុក</label>
                    <input
                      type="text"
                      placeholder="ឧ. កសិករ គ្រូបង្រៀន..."
                      value={fatherJob}
                      onChange={(e) => setFatherJob(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">ឈ្មោះម្តាយ</label>
                    <input
                      type="text"
                      placeholder="ឈ្មោះម្តាយ"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">មុខរបរម្តាយ</label>
                    <input
                      type="text"
                      placeholder="ឧ. អាជីវករ មេផ្ទះ..."
                      value={motherJob}
                      onChange={(e) => setMotherJob(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">លេខទូរស័ព្ទ / ទំនាក់ទំនងអាណាព្យាបាល</label>
                    <input
                      type="text"
                      placeholder="ឧ. 012 345 678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer (inside scroll area, but bottom-pinned ideally) */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-5 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingStudent ? 'រក្សាទុកការកែប្រែ' : 'យល់ព្រមចុះឈ្មោះ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel/Google Sheet Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-50/50 rounded-t-2xl">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-700" />
                <span>នាំចូលបញ្ជីឈ្មោះសិស្សពី Excel / Google Sheets</span>
              </h3>
              <button
                onClick={() => {
                  setIsImportOpen(false);
                  setRawImportText('');
                  setImportPreviewList([]);
                  setImportFileError(null);
                }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Instructions and help layout */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                <p className="font-bold text-[13px] text-amber-950">💡 របៀបប្រើប្រាស់៖</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-800">របៀបទី១៖ Copy-Paste (ងាយស្រួលបំផុត)</p>
                    <p className="leading-relaxed">ចម្លងជួរឈរ (Columns) ពីកម្មវិធី Excel ឬ Google Sheets របស់លោកគ្រូ-អ្នកគ្រូ រួចចុចផាស (Paste) ចូលប្រអប់ខាងក្រោម។</p>
                    <p className="leading-relaxed font-semibold">សណ្ដាប់ធ្នាប់ជួរឈរគំរូ៖</p>
                    <code className="block bg-amber-100/75 p-1.5 rounded text-[10px] whitespace-pre-wrap font-mono">អត្តសញ្ញាណ (ID) | ឈ្មោះខ្មែរ | ឈ្មោះឡាតាំង | ភេទ | ថ្ងៃកំណើត | ទូរស័ព្ទ</code>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-800">របៀបទី២៖ ផ្ទុកឡើងឯកសារ CSV/Excel</p>
                    <p className="leading-relaxed">លោកគ្រូអាចទាញយក ឬរក្សាទុកតារាងជាឯកសារ .csv រួចជ្រើសរើសផ្ទុកឡើងដើម្បីទាញព័ត៌មានដោយស្វ័យប្រវត្ត។</p>
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors text-[11px] shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        ជ្រើសរើសឯកសារ CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paste/Write Text Box */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">ប្រអប់ផាសទិន្នន័យ (Paste Rows Table Text Here *):</label>
                <textarea
                  rows={4}
                  value={rawImportText}
                  onChange={(e) => setRawImportText(e.target.value)}
                  placeholder={`ចម្លង (Copy) រួចផាស (Paste) តារាង Excel ទីនេះ...\n\nឧទាហរណ៍៖\nSTD-101   សុខ ម៉េង   SOK MENG   ប្រុស   2015-05-12   012345678\nSTD-102   កែវ ចិត្រា   KEV CHETRA   ប្រុស   2015-11-20   098765432`}
                  className="w-full p-4 text-xs font-mono border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-gray-50/50 leading-relaxed shrink-0 h-32"
                />
                {importFileError && (
                  <p className="text-xs text-red-650 font-bold">{importFileError}</p>
                )}
              </div>

              {/* Parsed Preview Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>លទ្ធផលលម្អិតមុនពេលរក្សាទុក ({importPreviewList.length} នាក់)</span>
                  </h4>
                  {importPreviewList.length > 0 && (
                    <div className="flex gap-4 text-xs font-bold text-gray-500">
                      <span className="text-blue-650">ប្រុស៖ {importPreviewList.filter(s => s.gender === 'ប្រុស').length} នាក់</span>
                      <span className="text-rose-600">ស្រី៖ {importPreviewList.filter(s => s.gender === 'ស្រី').length} នាក់</span>
                    </div>
                  )}
                </div>

                {importPreviewList.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
                    <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs">មិនទាន់មានទិន្នន័យត្រូវបានបញ្ចូល ឬផាសទេ។</p>
                    <p className="text-[10px] text-gray-400 mt-1">សូមបញ្ចូលទិន្នន័យដើម្បីពិនិត្យមើល និងកែសម្រួលលទ្ធផលបណ្តោះអាសន្ន។</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-150 rounded-xl">
                    <table className="w-full border-collapse text-left text-xs bg-white">
                      <thead>
                        <tr className="bg-gray-50 font-semibold text-gray-650 border-b border-gray-150 uppercase tracking-wider text-[10px]">
                          <th className="px-3 py-2 text-center w-12">ល.រ</th>
                          <th className="px-3 py-2 w-28">អត្តលេខ ID</th>
                          <th className="px-3 py-2"><b>ឈ្មោះខ្មែរ *</b></th>
                          <th className="px-3 py-2">ឈ្មោះឡាតាំង</th>
                          <th className="px-3 py-2 w-24">ភេទ</th>
                          <th className="px-3 py-2 w-32">ថ្ងៃខែឆ្នាំកំណើត</th>
                          <th className="px-3 py-2">លេខទូរស័ព្ទ</th>
                          <th className="px-3 py-2 text-center w-12">លុប</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {importPreviewList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.id || ''}
                                onChange={(e) => handleUpdatePreviewField(idx, 'id', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 font-mono uppercase bg-transparent text-gray-800"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                required
                                value={item.nameKh || ''}
                                onChange={(e) => handleUpdatePreviewField(idx, 'nameKh', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-bold text-gray-800 focus:outline-none focus:border-indigo-500 bg-transparent"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.nameEn || ''}
                                onChange={(e) => handleUpdatePreviewField(idx, 'nameEn', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 font-mono uppercase bg-transparent text-gray-600"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <select
                                value={item.gender}
                                onChange={(e) => handleUpdatePreviewField(idx, 'gender', e.target.value as any)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 bg-transparent"
                              >
                                <option value="ប្រុស">ប្រុស</option>
                                <option value="ស្រី">ស្រី</option>
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={item.dob || ''}
                                onChange={(e) => handleUpdatePreviewField(idx, 'dob', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 font-mono bg-transparent"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="text"
                                value={item.phoneNumber || ''}
                                onChange={(e) => handleUpdatePreviewField(idx, 'phoneNumber', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 font-mono bg-transparent text-gray-600"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemovePreviewRow(idx)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="លុបជួរដេកនេះ"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <p className="text-[10px] text-gray-400 leading-normal max-w-sm">
                * ព័ត៌មានបន្ថែមដូចជា ទីកន្លែងកំណើត និងប្រវត្តិអាណាព្យាបាល លោកគ្រូ-អ្នកគ្រូអាចចូលមកកែរូបតំណាងសិស្សម្តងម្នាក់ៗតាមក្រោយ។
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setRawImportText('');
                    setImportPreviewList([]);
                    setImportFileError(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-250 rounded-xl transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchImport}
                  disabled={importPreviewList.length === 0}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  នាំចូលទាំងស្រុង (Confirm Import)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* 2. Formal beautiful Khmer document: Visible ONLY when printing */}
    <div className="hidden print:block font-sans bg-white p-4 text-black text-xs leading-relaxed">
      {/* Kingdom & Nation Slogan Header */}
      <div className="flex justify-between items-start">
        <div className="text-left space-y-1">
          <div className="font-bold text-[13px]">{classInfo?.schoolName || 'សាលាបឋមសិក្សាគំរូពញាក្រែក'}</div>
          <div className="font-bold text-[12px]">ថ្នាក់រៀន៖ <span className="font-normal font-sans">{classInfo?.gradeClass || 'ថ្នាក់ទី ៥ អា'}</span></div>
          <div className="font-bold text-[12px]">ឆ្នាំសិក្សា៖ <span className="font-normal font-mono">{classInfo?.academicYear || '២០២៤-២០២៥'}</span></div>
          <div className="font-bold text-[12px]">គ្រូបន្ទុកថ្នាក់៖ <span className="font-normal">{classInfo?.classTeacher || 'កែវ ច័ន្ទតារា'}</span></div>
        </div>
        
        <div className="text-center font-bold">
          <div className="font-moul text-[12px] uppercase tracking-wider">ព្រះរាជាណាចក្រកម្ពុជា</div>
          <div className="font-moul text-[10px] tracking-wide mt-1">ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
          <div className="flex justify-center mt-1">
            <svg width="120" height="8" viewBox="0 0 120 8" fill="none">
              <path d="M10 4 C 30 1, 30 7, 50 4 C 70 1, 70 7, 90 4 C 100 2, 110 5, 115 4" stroke="#000" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-6 space-y-1">
        <div className="font-moul text-sm tracking-wide leading-relaxed">បញ្ជីឈ្មោះសិស្សានុសិស្សប្រចាំថ្នាក់</div>
        <div className="text-[10px] font-semibold text-gray-400 font-mono uppercase tracking-wider">Official Class Student Registry</div>
      </div>

      {/* Statistics Summary bar */}
      <div className="mb-3 text-[11px] font-semibold text-slate-700 flex justify-between bg-slate-50 p-2.5 rounded-lg border border-gray-200">
        <span>សិស្សសរុបរួម៖ {students.length} នាក់</span>
        <span>សិស្សស្រីសរុប៖ {students.filter(s => s.gender === 'ស្រី').length} នាក់</span>
        <span>សិស្សប្រុសសរុប៖ {students.filter(s => s.gender === 'ប្រុស').length} នាក់</span>
      </div>

      {/* Printable Student Table */}
      <table className="w-full border-collapse border border-black text-[11px]">
        <thead>
          <tr className="bg-slate-100/50 font-bold">
            <th className="border border-black px-1.5 py-2 text-center w-8">ល.រ</th>
            <th className="border border-black px-1.5 py-2 text-center w-20">អត្តសញ្ញាណ</th>
            <th className="border border-black px-2 py-2 text-left">នាមត្រកូល និងនាមខ្លួន</th>
            <th className="border border-black px-2 py-2 text-left">ឈ្មោះឡាតាំង</th>
            <th className="border border-black px-1.5 py-2 text-center w-12">ភេទ</th>
            <th className="border border-black px-2 py-2 text-center w-24">ថ្ងៃខែឆ្នាំកំណើត</th>
            <th className="border border-black px-2 py-2 text-center w-28">លេខទូរស័ព្ទ</th>
            <th className="border border-black px-2 py-2 text-left">ទីកន្លែងកំណើត</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={8} className="border border-black p-4 text-center text-gray-500">
                មិនមានទិន្នន័យសិស្សទេ។
              </td>
            </tr>
          ) : (
            students.map((student, index) => (
              <tr key={student.id}>
                <td className="border border-black px-1 py-1.5 text-center font-mono text-[10px]">{index + 1}</td>
                <td className="border border-black px-1 py-1.5 text-center font-mono text-[10px]">{student.id}</td>
                <td className="border border-black px-2 py-1.5 font-bold text-gray-900">{student.nameKh}</td>
                <td className="border border-black px-2 py-1.5 font-mono text-[10px] uppercase text-gray-700">{student.nameEn}</td>
                <td className="border border-black px-1 py-1.5 text-center font-medium">{student.gender}</td>
                <td className="border border-black px-2 py-1.5 text-center font-mono text-[10px]">{student.dob || '—'}</td>
                <td className="border border-black px-2 py-1.5 text-center font-mono text-[10px]">{student.phoneNumber || '—'}</td>
                <td className="border border-black px-2 py-1.5 text-[10px]">
                  {student.pob ? `${student.pob}${student.pobProvince ? `, ${student.pobProvince}` : ''}` : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Traditional Khmer Signature Footer */}
      <div className="mt-8 grid grid-cols-2 gap-4 text-xs">
        <div className="text-center space-y-16">
          <div className="font-bold">បានឃើញ និងពិនិត្យត្រឹមត្រូវ<br/>នាយកសាលា</div>
          <div className="font-mono text-[10px] text-gray-400 font-medium">(ហត្ថលេខា និងត្រា)</div>
        </div>
        <div className="text-center space-y-16">
          <div>
            <div className="italic text-[11px]">ថ្ងៃ...................ខែ............ឆ្នាំ............... ព.ស.២៥៧០</div>
            <div className="font-bold mt-1.5">គ្រូបន្ទុកថ្នាក់</div>
          </div>
          <div className="font-bold text-[12px]">{classInfo?.classTeacher || 'កែវ ច័ន្ទតារា'}</div>
        </div>
      </div>
    </div>
  </>
  );
}
