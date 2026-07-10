const PERSIAN_STOP_WORDS = new Set([
  'و', 'در', 'به', 'از', 'که', 'این', 'را', 'با', 'است', 'برای',
  'آن', 'یک', 'شود', 'می', 'تا', 'بر', 'هم', 'برای', 'یا', 'اما',
  'اگر', 'چه', 'هر', 'همه', 'بود', 'شد', 'کرد', 'کنند', 'کند',
  'ما', 'شما', 'آنها', 'او', 'من', 'تو', 'خود', 'خودش', 'خودم',
  'باید', 'می‌توان', 'میتوان', 'نمی', 'نیست', 'هست', 'بوده',
  'باشد', 'باشند', 'دارد', 'دارند', 'داشت', 'داشتند', 'خواهد',
  'کرده', 'شده', 'گرفت', 'گرفته', 'داد', 'داده', 'بودن', 'شدن',
  'کردن', 'بودیم', 'بودید', 'بودند', 'هستیم', 'هستید', 'هستند',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'and', 'or', 'but', 'not', 'it', 'this', 'that', 'we', 'you',
]);

function normalizePersianText(text) {
  return text
    .replace(/[\u200c\u200b]/g, '')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
  ;
}

function extractWords(segment) {
  return segment
    .split(/[\s\-–—]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !PERSIAN_STOP_WORDS.has(w));
}

function tokenizeForWordCloud(texts) {
  const freq = {};
  const MAX_PHRASE_WORDS = 6;

  function bump(term, weight = 1) {
    if (!term || term.length < 2) return;
    freq[term] = (freq[term] || 0) + weight;
  }

  function addNgrams(words) {
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const slice = words.slice(i, i + n);
        if (slice.every((w) => w.length >= 2)) {
          bump(slice.join(' '), n === 3 ? 1.5 : 1.2);
        }
      }
    }
  }

  texts.forEach((text) => {
    if (!text) return;
    const normalized = normalizePersianText(text.trim());
    const segments = normalized
      .split(/[\n،,؛;.!?؟]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    segments.forEach((segment) => {
      const words = extractWords(segment);
      if (words.length === 0) return;

      if (words.length === 1) {
        bump(words[0]);
      } else if (words.length <= MAX_PHRASE_WORDS) {
        bump(words.join(' '), 2);
      } else {
        addNgrams(words);
        words.forEach((w) => bump(w));
      }
    });
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 150)
    .map(([term, count]) => [term, count]);
}

function showAlert(container, message, type = 'info') {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => {
    const alert = container.querySelector('.alert');
    if (alert) alert.remove();
  }, 4000);
}

function getSupabaseClient() {
  if (!window.APP_CONFIG?.supabaseUrl || window.APP_CONFIG.supabaseUrl === 'YOUR_SUPABASE_URL') {
    throw new Error('لطفاً فایل config.js را تنظیم کنید');
  }
  return window.supabase.createClient(
    window.APP_CONFIG.supabaseUrl,
    window.APP_CONFIG.supabaseAnonKey
  );
}

async function fetchActiveQuestions(client) {
  const { data, error } = await client
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchAllQuestions(client) {
  const { data, error } = await client
    .from('questions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchResponses(client, questionId = null) {
  let query = client.from('responses').select('*, questions(text)');
  if (questionId) query = query.eq('question_id', questionId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
