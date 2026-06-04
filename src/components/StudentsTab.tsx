import React, { useState } from 'react';
import { Student } from '../types';
import { UserPlus, Search, Edit2, Trash2, Users, UserCheck, ShieldAlert, GraduationCap, Phone, MapPin, Download } from 'lucide-react';
import { exportToCSV } from '../utils';

interface StudentsTabProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export default function StudentsTab({ students, onAddStudent, onUpdateStudent, onDeleteStudent }: StudentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
    };

    if (editingStudent) {
      onUpdateStudent(studentData);
    } else {
      onAddStudent(studentData);
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    onDeleteStudent(id);
    setShowDeleteConfirm(null);
  };

  // Filter students
  const filteredStudents = students.filter(student =>
    student.nameKh.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
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
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
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

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
              title="នាំចេញបញ្ជីឈ្មោះសិស្សជាឯកសារ Excel ឬ CSV"
            >
              <Download className="w-4 h-4" />
              នាំចេញ Excel/CSV
            </button>

            <button
              onClick={handleOpenAddForm}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 text-sm font-medium shadow-sm hover:shadow-md cursor-pointer"
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
                  <th className="px-6 py-4">ថ្ងៃខែឆ្នាំកំណើត</th>
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
                      {student.nameKh}
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
                      {student.dob || '—'}
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
                onClick={() => setIsFormOpen(false)}
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
                  onClick={() => setIsFormOpen(false)}
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
    </div>
  );
}
