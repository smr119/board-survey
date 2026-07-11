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

const DEFAULT_SETTINGS = {
  survey_title: 'نظرسنجی اهداف و استراتژی',
  survey_subtitle: 'نظر شما درباره مهم‌ترین اهداف و راهبردهای دستیابی به آن‌ها',
  survey_image_url: '',
};

const QUESTION_TYPES = {
  open: 'باز (متنی)',
  single: 'تک‌گزینه‌ای',
  multi: 'چندگزینه‌ای',
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function parseQuestionOptions(options) {
  if (!options) return [];
  if (Array.isArray(options)) return options.map((o) => String(o).trim()).filter(Boolean);
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) return parsed.map((o) => String(o).trim()).filter(Boolean);
    } catch {
      return options.split('\n').map((o) => o.trim()).filter(Boolean);
    }
  }
  return [];
}

function getQuestionTypeLabel(type) {
  return QUESTION_TYPES[type] || QUESTION_TYPES.open;
}

function renderQuestionInput(question, index) {
  const type = question.question_type || 'open';
  const options = parseQuestionOptions(question.options);
  const qId = question.id;
  const label = `
    <label>
      <span class="q-number" style="display:inline-flex;margin-left:0.5rem">${index + 1}</span>
      ${escapeHtml(question.text)}
      <small class="q-type-badge">${getQuestionTypeLabel(type)}</small>
    </label>
  `;

  if (type === 'single' && options.length > 0) {
    const radios = options.map((opt, i) => `
      <label class="choice-option">
        <input type="radio" name="${qId}" value="${escapeHtml(opt)}" ${i === 0 ? '' : ''}>
        <span>${escapeHtml(opt)}</span>
      </label>
    `).join('');
    return `<div class="form-group" data-qid="${qId}" data-qtype="single">${label}<div class="choice-list">${radios}</div></div>`;
  }

  if (type === 'multi' && options.length > 0) {
    const checks = options.map((opt) => `
      <label class="choice-option">
        <input type="checkbox" name="${qId}" value="${escapeHtml(opt)}">
        <span>${escapeHtml(opt)}</span>
      </label>
    `).join('');
    return `<div class="form-group" data-qid="${qId}" data-qtype="multi">${label}<div class="choice-list">${checks}</div></div>`;
  }

  return `
    <div class="form-group" data-qid="${qId}" data-qtype="open">
      ${label}
      <textarea id="q-${qId}" name="${qId}" placeholder="نظر خود را بنویسید..."></textarea>
    </div>
  `;
}

function collectSurveyAnswers(form) {
  const entries = [];
  const groups = form.querySelectorAll('.form-group[data-qid]');

  groups.forEach((group) => {
    const qid = group.dataset.qid;
    const qtype = group.dataset.qtype;

    if (qtype === 'open') {
      const ta = group.querySelector('textarea');
      const answer = ta?.value.trim();
      if (answer) entries.push({ question_id: qid, answer });
      return;
    }

    if (qtype === 'single') {
      const selected = group.querySelector('input[type="radio"]:checked');
      if (selected?.value) entries.push({ question_id: qid, answer: selected.value });
      return;
    }

    if (qtype === 'multi') {
      const selected = [...group.querySelectorAll('input[type="checkbox"]:checked')].map((el) => el.value);
      if (selected.length) entries.push({ question_id: qid, answer: selected.join('، ') });
    }
  });

  return entries;
}

async function uploadSurveyImage(client, file) {
  if (!file.type.startsWith('image/')) throw new Error('فقط فایل تصویری مجاز است');
  if (file.size > 2 * 1024 * 1024) throw new Error('حداکثر حجم تصویر ۲ مگابایت است');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `banner-${Date.now()}.${ext}`;

  const { error: uploadError } = await client.storage
    .from('survey-images')
    .upload(fileName, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = client.storage.from('survey-images').getPublicUrl(fileName);
  return data.publicUrl;
}

async function removeSurveyImage(client, imageUrl) {
  if (!imageUrl) return;

  const marker = '/survey-images/';
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;

  const filePath = imageUrl.slice(idx + marker.length);
  await client.storage.from('survey-images').remove([filePath]);
}

function applySurveyHeader(settings) {
  const title = settings.survey_title || DEFAULT_SETTINGS.survey_title;
  const subtitle = settings.survey_subtitle || DEFAULT_SETTINGS.survey_subtitle;

  const titleEl = document.getElementById('survey-title');
  const subtitleEl = document.getElementById('survey-subtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
  document.title = title;

  const bannerWrap = document.getElementById('survey-banner-wrap');
  const bannerImg = document.getElementById('survey-banner');
  const imageUrl = settings.survey_image_url || '';

  if (!bannerWrap || !bannerImg) return;

  if (imageUrl) {
    bannerImg.src = imageUrl;
    bannerWrap.classList.remove('hidden');
  } else {
    bannerImg.removeAttribute('src');
    bannerWrap.classList.add('hidden');
  }
}

  const settings = { ...DEFAULT_SETTINGS };
  const { data, error } = await client.from('site_settings').select('key, value');
  if (error) return settings;

  (data || []).forEach((row) => {
    settings[row.key] = row.value;
  });
  return settings;
}

async function saveSettings(client, settings) {
  const rows = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}

async function fetchSettings(client) {
  const { error } = await client
    .from('responses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

async function clearAllQuestions(client) {
  const { error } = await client
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

function downloadFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob(['\uFEFF', content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportResponsesCSV(responses, filename = 'نتایج-نظرسنجی.csv') {
  const header = 'سوال,پاسخ,تاریخ';
  const rows = responses.map((r) => {
    const question = (r.questions?.text || '').replace(/"/g, '""');
    const answer = (r.answer || '').replace(/"/g, '""');
    const date = new Date(r.created_at).toLocaleString('fa-IR');
    return `"${question}","${answer}","${date}"`;
  });
  downloadFile(filename, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
}

function exportWordListCSV(wordList, filename = 'ابر-واژگان.csv') {
  const header = 'عبارت,تکرار';
  const rows = wordList.map(([term, count]) => {
    const safeTerm = String(term).replace(/"/g, '""');
    return `"${safeTerm}",${count}`;
  });
  downloadFile(filename, [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
}

function exportResponsesJSON(responses, filename = 'نتایج-نظرسنجی.json') {
  const data = responses.map((r) => ({
    question: r.questions?.text || '',
    answer: r.answer,
    created_at: r.created_at,
  }));
  downloadFile(filename, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
}

function exportWordCloudPNG(canvas, filename = 'ابر-واژگان.png') {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  ctx.fillStyle = '#1a2332';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  const link = document.createElement('a');
  link.download = filename;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}
