import React, { useState } from 'react';
import { Reminder } from '../types';
import { 
  Bell, 
  BellOff, 
  Calendar, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  GraduationCap, 
  CalendarDays, 
  Trash2,
  AlertTriangle,
  RotateCcw,
  Info,
  Search,
  PlusCircle,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Utility helper to convert standard digits to Khmer digits
export function toKhmerDigits(num: number | string): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return num.toString().replace(/\d/g, (d) => khmerDigits[parseInt(d)]);
}

// Utility to format standard YYYY-MM-DD date into Khmer Words
export function formatKhmerDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]).toString(); // Removes leading zero for day
  
  const khmerMonths = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];
  
  const khmerDay = toKhmerDigits(day);
  const khmerMonth = khmerMonths[monthIdx] || '';
  const khmerYear = toKhmerDigits(year);
  
  return `ថ្ងៃទី ${khmerDay} ខែ${khmerMonth} ឆ្នាំ${khmerYear}`;
}

// Utility to get relative date text in Khmer
export function getRelativeDaysText(dateStr: string): { text: string; isOverdue: boolean; isToday: boolean; daysRemaining: number } {
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { text: 'ថ្ងៃនេះ (Today)', isOverdue: false, isToday: true, daysRemaining: 0 };
  } else if (diffDays === 1) {
    return { text: 'ថ្ងៃស្អែក (Tomorrow)', isOverdue: false, isToday: false, daysRemaining: 1 };
  } else if (diffDays > 1) {
    return { text: `នៅសល់ ${toKhmerDigits(diffDays)} ថ្ងៃទៀត (In ${diffDays} days)`, isOverdue: false, isToday: false, daysRemaining: diffDays };
  } else {
    const absDays = Math.abs(diffDays);
    return { text: `ហួសកាលកំណត់ ${toKhmerDigits(absDays)} ថ្ងៃ (Overdue ${absDays} days)`, isOverdue: true, isToday: false, daysRemaining: diffDays };
  }
}

interface DashboardRemindersProps {
  reminders: Reminder[];
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (reminder: Omit<Reminder, 'id' | 'isRead'>) => void;
  onResetDefaults: () => void;
}

export default function DashboardReminders({
  reminders = [],
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onAdd,
  onResetDefaults
}: DashboardRemindersProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'exam' | 'deadline' | 'holiday'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Custom reminder form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<'exam' | 'deadline' | 'holiday' | 'other'>('other');
  const [formError, setFormError] = useState('');

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('សូមបញ្ចូលចំណងជើងរំលឹក (Title is required)');
      return;
    }
    if (!formDesc.trim()) {
      setFormError('សូមបញ្ចូលការពិពណ៌នាលម្អិត (Description is required)');
      return;
    }
    if (!formDate) {
      setFormError('សូមជ្រើសរើសកាលបរិច្ឆេទ (Date is required)');
      return;
    }

    onAdd({
      titleKh: formTitle.trim(),
      descriptionKh: formDesc.trim(),
      date: formDate,
      type: formType
    });

    // Reset Form
    setFormTitle('');
    setFormDesc('');
    setFormDate('');
    setFormType('other');
    setIsFormOpen(false);
  };

  // Filter and search logic
  const filteredReminders = reminders
    .filter((rem) => {
      // Apply primary filter
      if (filter === 'unread') return !rem.isRead;
      if (filter === 'exam') return rem.type === 'exam';
      if (filter === 'deadline') return rem.type === 'deadline';
      if (filter === 'holiday') return rem.type === 'holiday';
      return true;
    })
    .filter((rem) => {
      // Apply search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rem.titleKh.toLowerCase().includes(q) ||
        rem.descriptionKh.toLowerCase().includes(q)
      );
    })
    // Sort so overdue/closest deadlines appear first
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      // Unread system deadlines/exams first, then sorted by date
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      return dateA - dateB;
    });

  const unreadCount = reminders.filter(r => !r.isRead).length;

  return (
    <div id="dashboard-reminders-section" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
      
      {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <h3 className="font-bold text-gray-900 flex items-center gap-2.5 text-base">
            <div className="relative">
              <Bell className={`w-5 h-5 text-indigo-600 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {toKhmerDigits(unreadCount)}
                </span>
              )}
            </div>
            មជ្ឈមណ្ឌលជូនដំណឹង &amp; រំលឹកកាលបរិច្ឆេទ (Reminders &amp; Deadlines)
          </h3>
          <p className="text-xs text-gray-400">
            រំលឹកកាលបរិច្ឆេទសំខាន់ៗ ថ្ងៃប្រឡងប្រចាំខែ និងកាលកំណត់បញ្ចូលពិន្ទុសិស្សថ្នាក់បឋមសិក្សា
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {reminders.length < 5 && (
            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 border border-slate-250 hover:bg-slate-50 text-gray-600 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="បញ្ចូលកាលបរិច្ឆេទគំរូឡើងវិញ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              កំណត់ឡើងវិញ (Reset)
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isFormOpen 
                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
            }`}
          >
            {isFormOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                បិទផ្ទាំង (Close)
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                បន្ថែមការរំលឹក (Add custom)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Slide-down Form Container */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4 mb-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  បង្កើតការរំលឹកកាលបរិច្ឆេទថ្មី (Create Custom Reminder)
                </span>
                {formError && (
                  <span className="text-rose-600 text-[11px] font-bold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3" />
                    {formError}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-750 block">
                    ចំណងជើងនៃការរំលឹក (Remind Title) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. ប្រឡងឡើងវិញភាសាខ្មែរ, ប្រជុំអាណាព្យាបាល..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-sans placeholder-gray-350"
                  />
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-750 block">
                    ប្រភេទ (Reminder Type)
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-sans"
                  >
                    <option value="exam">ប្រឡងប្រចាំខែ/ឆមាស (Exam)</option>
                    <option value="deadline">កាលកំណត់បញ្ចូលពិន្ទុ (Deadline)</option>
                    <option value="holiday">ថ្ងៃឈប់សម្រាក (Holiday)</option>
                    <option value="other">ផ្សេងៗ (Other/Event)</option>
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-750 block">
                    កាលបរិច្ឆេទ (Target Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-sans"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-gray-750 block">
                    សេចក្តីពិពណ៌នាលម្អិត (Description Details) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    placeholder="បញ្ចូលសេចក្តីលម្អិតសម្រាប់ការរំលឹកនេះ ដើម្បីរៀបចំការងារ..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={1}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-sans min-h-[38px] placeholder-gray-350"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-250 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  រក្សាទុក (Save)
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-200/40">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/40' 
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            ទាំងអស់ ({toKhmerDigits(reminders.length)})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              filter === 'unread' 
                ? 'bg-white text-rose-700 shadow-xs border border-slate-200/40' 
                : 'text-gray-500 hover:text-rose-600'
            }`}
          >
            មិនទាន់អាន ({toKhmerDigits(unreadCount)})
            {unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>}
          </button>
          <button
            onClick={() => setFilter('exam')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'exam' 
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/40' 
                : 'text-gray-500 hover:text-indigo-600'
            }`}
          >
            ការប្រឡង ({toKhmerDigits(reminders.filter(r => r.type === 'exam').length)})
          </button>
          <button
            onClick={() => setFilter('deadline')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'deadline' 
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/40' 
                : 'text-gray-500 hover:text-amber-600'
            }`}
          >
            ផុតកំណត់ ({toKhmerDigits(reminders.filter(r => r.type === 'deadline').length)})
          </button>
          <button
            onClick={() => setFilter('holiday')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filter === 'holiday' 
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/40' 
                : 'text-gray-500 hover:text-emerald-600'
            }`}
          >
            ថ្ងៃសម្រាក ({toKhmerDigits(reminders.filter(r => r.type === 'holiday').length)})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="ស្វែងរកការរំលឹក... (Search reminders)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Reminders List Section */}
      <div className="space-y-3">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <BellOff className="w-8 h-8 text-gray-300" />
            <p className="text-xs font-bold text-gray-400 font-sans">
              {searchQuery ? 'រកមិនឃើញលទ្ធផលស្វែងរកទេ (No matching results found)' : 'គ្មានការរំលឹកដំណឹងទេ (No reminders in this category)'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredReminders.map((reminder) => {
                const relativeInfo = getRelativeDaysText(reminder.date);
                const khmerDateText = formatKhmerDate(reminder.date);
                
                // Color configuration depending on type
                let typeStyles = {
                  container: 'border-slate-100 bg-white hover:border-slate-200',
                  badge: 'bg-slate-100 text-slate-700',
                  iconBg: 'bg-slate-50 text-slate-500',
                  accentDot: 'bg-slate-400',
                  typeKh: 'ទូទៅ (Other)',
                  icon: Info
                };

                if (reminder.type === 'exam') {
                  typeStyles = {
                    container: 'border-indigo-100 bg-indigo-50/5 hover:border-indigo-200',
                    badge: 'bg-indigo-50 text-indigo-700',
                    iconBg: 'bg-indigo-100/50 text-indigo-600',
                    accentDot: 'bg-indigo-600',
                    typeKh: 'ការប្រឡង (Exam)',
                    icon: GraduationCap
                  };
                } else if (reminder.type === 'deadline') {
                  const isClose = relativeInfo.daysRemaining >= 0 && relativeInfo.daysRemaining <= 5;
                  typeStyles = {
                    container: isClose 
                      ? 'border-rose-200 bg-rose-50/5 hover:border-rose-300 shadow-2xs' 
                      : 'border-amber-100 bg-amber-50/5 hover:border-amber-200',
                    badge: isClose ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-amber-50 text-amber-800',
                    iconBg: isClose ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700',
                    accentDot: isClose ? 'bg-rose-600' : 'bg-amber-500',
                    typeKh: isClose ? 'ប្រញាប់! (Urgent)' : 'ផុតកំណត់ (Deadline)',
                    icon: AlertCircle
                  };
                } else if (reminder.type === 'holiday') {
                  typeStyles = {
                    container: 'border-emerald-100 bg-emerald-50/5 hover:border-emerald-200',
                    badge: 'bg-emerald-50 text-emerald-700',
                    iconBg: 'bg-emerald-100/50 text-emerald-600',
                    accentDot: 'bg-emerald-500',
                    typeKh: 'ថ្ងៃសម្រាក (Holiday)',
                    icon: CalendarDays
                  };
                }

                const IconComponent = typeStyles.icon;

                return (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all relative ${typeStyles.container} ${
                      reminder.isRead ? 'opacity-55 filter grayscale-15 border-slate-100' : ''
                    }`}
                  >
                    {/* Left Icon Panel */}
                    <div className={`p-2.5 rounded-xl shrink-0 ${typeStyles.iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 flex-1 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${typeStyles.badge}`}>
                          {typeStyles.typeKh}
                        </span>
                        
                        {!reminder.isSystem && (
                          <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                            ផ្ទាល់ខ្លួន (Custom)
                          </span>
                        )}

                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          relativeInfo.isOverdue ? 'text-rose-600 font-extrabold' : relativeInfo.isToday ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                          {relativeInfo.text}
                        </span>
                      </div>

                      <h4 className={`font-bold text-gray-850 text-xs sm:text-sm leading-snug flex items-center gap-1.5 ${
                        reminder.isRead ? 'line-through text-gray-400' : ''
                      }`}>
                        {reminder.titleKh}
                        {!reminder.isRead && (
                          <span className={`w-2 h-2 rounded-full ${typeStyles.accentDot} animate-pulse shrink-0`}></span>
                        )}
                      </h4>

                      <p className={`text-[11.5px] leading-relaxed font-sans ${
                        reminder.isRead ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {reminder.descriptionKh}
                      </p>

                      <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1 font-sans font-medium">
                        <Calendar className="w-3 h-3 text-gray-450" />
                        {khmerDateText} ({reminder.date})
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col gap-1 sm:self-center shrink-0">
                      {/* Mark as read/unread toggle */}
                      <button
                        onClick={() => reminder.isRead ? onMarkAsUnread(reminder.id) : onMarkAsRead(reminder.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          reminder.isRead 
                            ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-indigo-600' 
                            : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 shadow-3xs'
                        }`}
                        title={reminder.isRead ? 'សម្គាល់ថាមិនទាន់អាន' : 'សម្គាល់ថាបានអានរួច'}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete(reminder.id)}
                        className="p-1.5 rounded-lg border border-slate-100 bg-white text-gray-450 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all cursor-pointer"
                        title="លុបចោលការរំលឹកនេះ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
}
