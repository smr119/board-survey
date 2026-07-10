-- این SQL را در Supabase > SQL Editor اجرا کنید

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active questions"
  ON questions FOR SELECT USING (active = true);

CREATE POLICY "Anyone can insert responses"
  ON responses FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read responses"
  ON responses FOR SELECT USING (true);

CREATE POLICY "Anyone can manage questions"
  ON questions FOR ALL USING (true) WITH CHECK (true);
