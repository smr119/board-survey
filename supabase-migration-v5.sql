-- اگر migration-v4 را اجرا کرده‌اید، این فایل را در Supabase > SQL Editor اجرا کنید
-- پشتیبانی از چند پرسشنامه مستقل

CREATE TABLE IF NOT EXISTS surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE;

-- ساخت پرسشنامه پیش‌فرض از تنظیمات قبلی
INSERT INTO surveys (title, subtitle, description, image_url, sort_order)
SELECT
  COALESCE((SELECT value FROM site_settings WHERE key = 'survey_title'), 'نظرسنجی اهداف و استراتژی'),
  COALESCE((SELECT value FROM site_settings WHERE key = 'survey_subtitle'), ''),
  COALESCE((SELECT value FROM site_settings WHERE key = 'survey_description'), ''),
  COALESCE((SELECT value FROM site_settings WHERE key = 'survey_image_url'), ''),
  0
WHERE NOT EXISTS (SELECT 1 FROM surveys);

-- اتصال سوالات قبلی به پرسشنامه پیش‌فرض
UPDATE questions
SET survey_id = (SELECT id FROM surveys ORDER BY sort_order, created_at LIMIT 1)
WHERE survey_id IS NULL;

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read surveys"
    ON surveys FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can manage surveys"
    ON surveys FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete questions"
    ON questions FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
