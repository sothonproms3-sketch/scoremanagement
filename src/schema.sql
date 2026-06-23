-- =========================================================================
-- សេចក្តីលម្អិតអំពីគំនូសបំព្រួញប្រព័ន្ធទិន្នន័យ (Gradebook SQL Database Schema)
-- =========================================================================
-- This SQL schema is designed specifically for the digital Gradebook application.
-- It is compatible with PostgreSQL, SQLite, MySQL, and Cloud SQL databases.
-- It supports students, subject specific scores (including sub-subjects),
-- attendance records (with monthly teacher remarks), semester reports, and year-end evaluations.

-- =========================================================================
-- ១. តារាងព័ត៌មានថ្នាក់រៀន (Class Information Table)
-- =========================================================================
CREATE TABLE IF NOT EXISTS class_info (
    id SERIAL PRIMARY KEY,
    grade_class VARCHAR(50) NOT NULL,       -- កម្រិត/ថ្នាក់រៀន (e.g., "ថ្នាក់ទី ៥ អា")
    academic_year VARCHAR(50) NOT NULL,     -- ឆ្នាំសិក្សា (e.g., "២០២៤-២០២៥")
    class_teacher VARCHAR(100) NOT NULL,    -- គ្រូបន្ទុកថ្នាក់ (e.g., "កែវ ច័ន្ទតារា")
    school_name VARCHAR(255) NOT NULL,      -- ឈ្មោះសាលារៀន (e.g., "សាលាបឋមសិក្សា...")
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- ២. តារាងព័ត៌មានសិស្ស (Students Table)
-- =========================================================================
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,              -- អត្តលេខសិស្ស (e.g., "STD-01")
    name_kh VARCHAR(100) NOT NULL,          -- នាមខ្លួន-នាមត្រកូលជាភាសាខ្មែរ
    name_en VARCHAR(100) NOT NULL,          -- នាមខ្លួន-នាមត្រកូលជាអក្សរឡាតាំង
    gender VARCHAR(10) NOT NULL,            -- ភេទ (e.g., "ប្រុស" ឬ "ស្រី")
    dob VARCHAR(50) NOT NULL,               -- ថ្ងៃខែឆ្នាំកំណើត (e.g., "២០១៥-០៥-១២" ឬ YYYY-MM-DD)
    pob TEXT,                               -- ទីកន្លែងកំណើត
    pob_province VARCHAR(100),              -- ខេត្តក្រុងនៃកន្លែងកំណើត
    address TEXT,                           -- អាសយដ្ឋានបច្ចុប្បន្ន
    father_name VARCHAR(100),               -- ឈ្មោះឪពុក
    father_job VARCHAR(100),                -- មុខរបរឪពុក
    mother_name VARCHAR(100),               -- ឈ្មោះម្តាយ
    mother_job VARCHAR(100),                -- មុខរបរម្តាយ
    phone_number VARCHAR(50),               -- លេខទូរស័ព្ទទំនាក់ទំនងអាណាព្យាបាល
    class_teacher VARCHAR(100),             -- គ្រូបន្ទុកថ្នាក់បច្ចុប្បន្ន
    grade_class VARCHAR(50),                -- ថ្នាក់បច្ចុប្បន្ន
    academic_year VARCHAR(50),              -- ឆ្នាំសិក្សា
    photo_url TEXT,                         -- តំណភ្ជាប់រូបថត ឬអាវតារ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for optimization
CREATE INDEX IF NOT EXISTS idx_students_gender ON students(gender);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade_class);

-- =========================================================================
-- ៣. តារាងពិន្ទុមុខវិជ្ជាប្រចាំខែ និងប្រឡង (Subject Scores & Academic Period Scores)
-- =========================================================================
CREATE TABLE IF NOT EXISTS score_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,            -- តំណាក់កាល៖ 'nov', 'dec', 'jan', 'feb', 'mar', 'sem1_exam', 'apr_may', 'jun', 'jul', 'sem2_exam'
    
    -- ពិន្ទុមធ្យមភាគមុខវិជ្ជាធំៗ (Core Subjects Average Scores out of 10)
    khmer NUMERIC(4,2) NOT NULL DEFAULT 0.00,       -- ភាសាខ្មែរ
    math NUMERIC(4,2) NOT NULL DEFAULT 0.00,        -- គណិតវិទ្យា
    science NUMERIC(4,2) NOT NULL DEFAULT 0.00,     -- វិទ្យាសាស្ត្រ
    social NUMERIC(4,2) NOT NULL DEFAULT 0.00,      -- សិក្សាសង្គម
    arts_pe NUMERIC(4,2) NOT NULL DEFAULT 0.00,     -- អប់រំកាយ/សិល្បៈ

    -- ពិន្ទុផ្នែករងនៃ ភាសាខ្មែរ (Khmer Sub-Subjects: 0-10)
    khmer_reading NUMERIC(4,2) DEFAULT NULL,        -- រៀនអាន
    khmer_dictation NUMERIC(4,2) DEFAULT NULL,      -- សរសេរតាមអាន
    khmer_composition NUMERIC(4,2) DEFAULT NULL,    -- តែងសេចក្ដី

    -- ពិន្ទុផ្នែករងនៃ គណិតវិទ្យា (Math Sub-Subjects: 0-10)
    math_numbers NUMERIC(4,2) DEFAULT NULL,         -- ចំនួន
    math_measurement NUMERIC(4,2) DEFAULT NULL,     -- រង្វាស់រង្វាល់
    math_geometry_shape NUMERIC(4,2) DEFAULT NULL,   -- ធរណីមាត្រ
    math_algebra NUMERIC(4,2) DEFAULT NULL,         -- ពីជគណិត
    math_statistics NUMERIC(4,2) DEFAULT NULL,       -- ស្ថិតិ

    -- ពិន្ទុផ្នែករងនៃ សិក្សាសង្គម (Social Studies Sub-Subjects: 0-10)
    social_civics NUMERIC(4,2) DEFAULT NULL,        -- សីលធម៌-ពលរដ្ឋ
    social_geography NUMERIC(4,2) DEFAULT NULL,     -- ភូមិវិទ្យា
    social_history NUMERIC(4,2) DEFAULT NULL,       -- ប្រវត្តិវិទ្យា
    social_arts NUMERIC(4,2) DEFAULT NULL,          -- សិល្បៈចិត្រកម្ម

    -- មុខវិជ្ជាបន្ថែមផ្សេងៗ (Additional Subjects: 0-10)
    physical_education NUMERIC(4,2) DEFAULT NULL,   -- កីឡា/អប់រំកាយផ្ទាល់
    life_skills NUMERIC(4,2) DEFAULT NULL,          -- បំណិនជីវិត
    foreign_language NUMERIC(4,2) DEFAULT NULL,     -- ភាសាបរទេស (English/French)

    -- ពិន្ទុរួម និងមធ្យមភាគសរុប (Totals)
    sum_score NUMERIC(6,2) NOT NULL DEFAULT 0.00,   -- ពិន្ទុសរុប
    average_score NUMERIC(4,2) NOT NULL DEFAULT 0.00, -- មធ្យមភាគសរុបប្រចាំខែ (out of 10)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ធានាថាសិស្សម្នាក់មានកំណត់ត្រាពិន្ទុតែមួយគត់ក្នុងមួយខែ/តំណាក់កាលសិក្សា
    UNIQUE (student_id, period)
);

CREATE INDEX IF NOT EXISTS idx_scores_period ON score_records(period);

-- =========================================================================
-- ៤. តារាងវត្តមាន និងសង្កេតការណ៍គ្រូ (Attendance & Observation Records)
-- =========================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,             -- ខែសិក្សា៖ 'nov', 'dec', 'jan', 'feb', 'mar', 'apr_may', 'jun', 'jul'
    excused INT NOT NULL DEFAULT 0,          -- អវត្តមានមានច្បាប់ (P)
    unexcused INT NOT NULL DEFAULT 0,        -- អវត្តមានឥតច្បាប់ (A)
    late INT NOT NULL DEFAULT 0,             -- យឺត (L)
    teacher_notes TEXT DEFAULT NULL,         -- សេចក្តីសង្កេត ឬកំណត់សម្គាល់របស់គ្រូប្រចាំខែ
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ធានាថាសិស្សម្នាក់មានកំណត់ត្រាវត្តមានតែមួយក្នុងមួយខែសិក្សា
    UNIQUE (student_id, month)
);

-- =========================================================================
-- ៥. តារាងកំណត់ត្រាប្រចាំឆមាស (Semester Evaluation Summaries)
-- =========================================================================
CREATE TABLE IF NOT EXISTS semester_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester IN (1, 2)), -- ឆមាសទី ១ ឬ ឆមាសទី ២
    period_averages JSONB,                  -- កំណត់ត្រាមធ្យមភាគប្រចាំខែនីមួយៗជា JSON (e.g., {"nov": 7.5, "dec": 8.0...})
    exam_average NUMERIC(4,2) NOT NULL DEFAULT 0.00, -- ពិន្ទុធ្លាក់ប្រឡងឆមាស
    semester_average NUMERIC(4,2) NOT NULL DEFAULT 0.00, -- លទ្ធផលមធ្យមភាគរួមប្រចាំឆមាស
    rank INT NOT NULL,                       -- ចំណាត់ថ្នាក់ក្នុងថ្នាក់ប្រចាំឆមាស
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (student_id, semester)
);

-- =========================================================================
-- ៦. តារាងសង្ខេបលទ្ធផលចុងឆ្នាំសិក្សា (Year-End Academic Summaries)
-- =========================================================================
CREATE TABLE IF NOT EXISTS year_end_records (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    semester_1_average NUMERIC(4,2) NOT NULL DEFAULT 0.00, -- មធ្យមភាគឆមាសទី ១
    semester_2_average NUMERIC(4,2) NOT NULL DEFAULT 0.00, -- មធ្យមភាគឆមាសទី ២
    year_end_average NUMERIC(4,2) NOT NULL DEFAULT 0.00,   -- មធ្យមភាគប្រចាំឆ្នាំ
    rank INT NOT NULL,                       -- ចំណាត់ថ្នាក់ប្រចាំឆ្នាំ
    result_text VARCHAR(20) NOT NULL CHECK (result_text IN ('ជាប់', 'ធ្លាក់')), -- លទ្ធផល៖ "ជាប់" ឬ "ធ្លាក់"
    mention VARCHAR(100) NOT NULL,           -- ការវាយតម្លៃកម្រិតសិក្សា (e.g., ល្អណាស់, ល្អបង្គួរ, មធ្យម...)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (student_id)
);
