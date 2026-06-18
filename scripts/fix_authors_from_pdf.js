const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const dataPath = path.join(ROOT, 'data', 'publications.json');
const pdfDir = path.join(ROOT, 'public', 'LAB_paper');
const reportPath = path.join(ROOT, 'data', 'publications_authors_report.json');
const initialsPath = path.join(ROOT, 'data', 'publications_authors_initials_only.json');

const pdftotext = 'C:\\Users\\RYZEN\\AppData\\Local\\Microsoft\\WinGet\\Packages\\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\\poppler-25.07.0\\Library\\bin\\pdftotext.exe';
if (!fs.existsSync(pdftotext)) {
  console.error('pdftotext not found:', pdftotext);
  process.exit(1);
}

let raw = fs.readFileSync(dataPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);
const pubs = data.selected || [];

const stopwords = new Set([
  'the','a','an','of','for','and','in','on','with','toward','towards','to','via','by','under','into','from','based','using','case','study'
]);
const bannedLineRe = /(abstract|keywords|introduction|received|accepted|available online|corresponding|author|doi|www\.|http|department|university|institute|laboratory|college|school|center|email|e-mail|tel|fax|rights reserved|copyright|journal|volume|issue|page|pages)/i;
const bannedNameRe = /(conference|proceedings|journal|materials|department|university|institute|laboratory|college|school|center|republic|korea|doi|available|online|copyright|rights|reserved|received|accepted|abstract|keywords)/i;

function normalizeTitle(str) {
  return str
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(str) {
  const norm = normalizeTitle(str);
  if (!norm) return new Set();
  return new Set(norm.split(' ').filter(t => t && !stopwords.has(t)));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function readPdfText(pdfPath) {
  const tmp = path.join(ROOT, 'data', '.tmp_pdftotext.txt');
  const args = ['-f', '1', '-l', '3', '-layout', pdfPath, tmp];
  const res = spawnSync(pdftotext, args, { encoding: 'utf8' });
  if (res.error) return '';
  if (!fs.existsSync(tmp)) return '';
  const text = fs.readFileSync(tmp, 'utf8');
  fs.unlinkSync(tmp);
  return text;
}

function findTitleIndex(lines, titleTokens) {
  let bestIdx = 0;
  let bestScore = 0;
  for (let i = 0; i < lines.length; i++) {
    const tokens = tokenSet(lines[i]);
    if (!tokens.size) continue;
    let shared = 0;
    for (const t of titleTokens) if (tokens.has(t)) shared++;
    const score = shared / titleTokens.size;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestScore >= 0.25 ? bestIdx : 0;
}

function lineScore(line) {
  const commaCount = (line.match(/,/g) || []).length;
  let score = commaCount * 2;
  if (/\band\b/i.test(line)) score += 1;
  if (/[•·]/.test(line)) score += 1;
  if (bannedLineRe.test(line)) score -= 5;
  if (/\b20\d{2}\b/.test(line)) score -= 2;
  if (line.length < 20) score -= 1;
  if (line.length > 400) score -= 2;
  return score;
}

function isNameLike(part) {
  if (!part || part.length < 4) return false;
  if (/@|http|www\./i.test(part)) return false;
  if (bannedNameRe.test(part)) return false;
  const words = part.split(/\s+/).filter(Boolean);
  let nameWords = 0;
  let initials = 0;
  let acronyms = 0;
  let lower = 0;
  for (const w of words) {
    if (/^[A-Z][a-z]+(?:-[A-Z][a-z]+)*$/.test(w)) { nameWords++; continue; }
    if (/^[A-Z]\.$/.test(w) || /^[A-Z]{1,2}$/.test(w)) { initials++; continue; }
    if (/^[A-Z]{3,}$/.test(w)) { acronyms++; continue; }
    if (/^[a-z]/.test(w)) { lower++; }
  }
  if ((nameWords + initials) < 2) return false;
  if (acronyms > 1) return false;
  if (lower > 2) return false;
  return true;
}

function cleanPart(part) {
  let p = part.trim();
  if (!p) return '';
  p = p.replace(/[†‡*]/g, '');
  p = p.replace(/\s+and\s+/gi, ', ');
  p = p.replace(/[•·]/g, ', ');
  p = p.replace(/\[[^\]]*\]/g, '');
  p = p.replace(/\([^)]*@[^)]*\)/g, '');
  p = p.replace(/\bORCID\b.*$/i, '');
  p = p.replace(/\b(Corresponding|Author|E-mail|Email)\b.*$/i, '');
  p = p.replace(/\s+/g, ' ').trim();
  // Remove trailing affiliation markers like a, b, 1,2, *, †
  p = p.replace(/\s*[,;]?\s*[a-z]\b/g, '');
  p = p.replace(/\s*[,;]?\s*\d+\b/g, '');
  p = p.replace(/\s*[†‡*]+/g, '');
  p = p.replace(/\s+/g, ' ').trim();
  // If title fragment precedes the first capitalized word, drop it
  const words = p.split(/\s+/);
  const firstCap = words.findIndex(w => /^[A-Z][a-z]/.test(w) || /^[A-Z]\.$/.test(w) || /^[A-Z]{1,2}$/.test(w));
  if (firstCap > 0) {
    p = words.slice(firstCap).join(' ');
  }
  return p.trim();
}

function extractNamesFromText(text, titleTokens) {
  const rawLines = text.split(/\r?\n/)
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (!rawLines.length) return [];

  const titleIdx = findTitleIndex(rawLines, titleTokens);
  const windowLines = rawLines.slice(titleIdx + 1, titleIdx + 16);
  let candidateLines = windowLines.filter(l => !bannedLineRe.test(l));

  // Fallback: pick best scoring line in first 80 lines
  if (!candidateLines.length) {
    const maxLines = rawLines.slice(0, 80);
    let best = '';
    let bestScore = -999;
    for (const line of maxLines) {
      const s = lineScore(line);
      if (s > bestScore) { bestScore = s; best = line; }
    }
    if (best) candidateLines = [best];
  }

  let candidateText = candidateLines.join(' ');
  if (!candidateText) return [];

  candidateText = candidateText.replace(/\s+/g, ' ').trim();

  const parts = candidateText.split(/[,;]+/).map(p => cleanPart(p)).filter(Boolean);
  const names = [];
  for (let part of parts) {
    if (!part) continue;
    if (!isNameLike(part)) continue;
    // Remove lingering lowercase affiliation markers at end
    part = part.replace(/\s+[,;]?\s*[a-z]\b/g, '').trim();
    if (!isNameLike(part)) continue;
    if (!names.includes(part)) names.push(part);
  }
  return names;
}

function looksBadAuthors(str) {
  if (!str) return true;
  if (/^[a-z]/.test(str)) return true;
  if (bannedNameRe.test(str)) return true;
  if (/@|http|www\./i.test(str)) return true;
  return false;
}

function hasInitials(str) {
  if (!str) return false;
  return /\b[A-Z]{1,2}\b|\b[A-Z]\./.test(str);
}

const pdfFiles = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
const pdfMeta = pdfFiles.map(file => {
  const base = file.replace(/\.pdf$/i, '');
  return {
    file,
    base,
    tokens: tokenSet(base)
  };
});

const pdfAuthorsCache = new Map();

function getPdfAuthors(pdfFile, titleTokens) {
  if (pdfAuthorsCache.has(pdfFile)) return pdfAuthorsCache.get(pdfFile);
  const pdfPath = path.join(pdfDir, pdfFile);
  const text = readPdfText(pdfPath);
  const names = extractNamesFromText(text, titleTokens);
  pdfAuthorsCache.set(pdfFile, names);
  return names;
}

const report = {
  unmatched: [],
  extraction_failed: [],
  initials_remaining: [],
  updated: 0
};

for (const pub of pubs) {
  const pubTokens = tokenSet(pub.title || '');
  let best = { score: 0, file: null };
  for (const pdf of pdfMeta) {
    const score = jaccard(pubTokens, pdf.tokens);
    if (score > best.score) best = { score, file: pdf.file };
  }

  if (!best.file || best.score < 0.35) {
    report.unmatched.push({ title: pub.title, score: best.score });
    continue;
  }

  const names = getPdfAuthors(best.file, pubTokens);
  if (names.length >= 2) {
    const newAuthors = names.join(', ');
    if (pub.authors !== newAuthors) report.updated++;
    pub.authors = newAuthors;
  } else {
    if (looksBadAuthors(pub.authors)) {
      pub.authors = '';
    }
    report.extraction_failed.push({ title: pub.title, file: best.file });
  }

  if (hasInitials(pub.authors)) {
    report.initials_remaining.push({ title: pub.title, authors: pub.authors });
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
fs.writeFileSync(initialsPath, JSON.stringify(report.initials_remaining, null, 2));

console.log('Updated authors:', report.updated);
console.log('Unmatched:', report.unmatched.length);
console.log('Extraction failed:', report.extraction_failed.length);
console.log('Initials remaining:', report.initials_remaining.length);
