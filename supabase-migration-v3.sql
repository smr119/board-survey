-- اگر migration-v2 را اجرا کرده‌اید، این فایل را در Supabase > SQL Editor اجرا کنید

-- نوع سوال: open (باز) | single (تک‌گزینه‌ای) | multi (چندگزینه‌ای)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'open';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;

INSERT INTO site_settings (key, value) VALUES ('survey_image_url', '')
ON CONFLICT (key) DO NOTHING;

-- باکت ذخیره تصویر پرسشنامه
INSERT INTO storage.buckets (id, name, public)
VALUES ('survey-images', 'survey-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read survey images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'survey-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can upload survey images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'survey-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can update survey images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'survey-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can delete survey images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'survey-images');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
