-- اگر migration-v3 را اجرا کرده‌اید، این را هم در SQL Editor اجرا کنید

INSERT INTO site_settings (key, value) VALUES
  ('survey_description', '')
ON CONFLICT (key) DO NOTHING;
