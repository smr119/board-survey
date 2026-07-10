-- اگر قبلاً supabase-setup.sql را اجرا کرده‌اید، این فایل را هم در SQL Editor اجرا کنید

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES
  ('survey_title', 'نظرسنجی اهداف و استراتژی'),
  ('survey_subtitle', 'نظر شما درباره مهم‌ترین اهداف و راهبردهای دستیابی به آن‌ها')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can read settings"
    ON site_settings FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can manage settings"
    ON site_settings FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete responses"
    ON responses FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
