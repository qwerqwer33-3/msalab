param(
  [string]$TestPdf,
  [string]$TestTitle
)



$ErrorActionPreference = 'Stop'

$root = Resolve-Path "${PSScriptRoot}\.."
$dataPath = Join-Path $root 'data\publications.json'
$pdfDir = Join-Path $root 'public\LAB_paper'
$reportPath = Join-Path $root 'data\publications_authors_report.json'
$initialsPath = Join-Path $root 'data\publications_authors_initials_only.json'

$pdftotext = 'C:\Users\RYZEN\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin\pdftotext.exe'
if (-not (Test-Path $pdftotext)) { throw "pdftotext not found: $pdftotext" }

$raw = Get-Content -Raw -Encoding UTF8 $dataPath
$raw = $raw.TrimStart([char]0xFEFF)
$data = $raw | ConvertFrom-Json
$pubs = $data.selected

$stopwords = @('the','a','an','of','for','and','in','on','with','toward','towards','to','via','by','under','into','from','based','using','case','study')
$stopwordSet = [System.Collections.Generic.HashSet[string]]::new()
foreach ($w in $stopwords) { [void]$stopwordSet.Add($w) }

$bannedLineRe = '(?i)(abstract|keywords|introduction|received|accepted|available online|corresponding|author|doi|www\.|http|department|university|institute|laboratory|college|school|center|email|e-mail|tel|fax|rights reserved|copyright|journal|volume|issue|page|pages)'
$bannedNameRe = '(?i)(conference|proceedings|journal|materials|department|university|institute|laboratory|college|school|center|republic|korea|doi|available|online|copyright|rights|reserved|received|accepted|abstract|keywords|cite|this|acs|omega)'

function Normalize-Title([string]$str) {
  if (-not $str) { return '' }
  $s = $str.ToLower()
  $s = $s -replace '[\u2010-\u2015]', '-'
  $s = $s -replace '[^a-z0-9]+', ' '
  $s = $s -replace '\s+', ' '
  return $s.Trim()
}

function Get-TokenSet([string]$str) {
  $set = [System.Collections.Generic.HashSet[string]]::new()
  $norm = Normalize-Title $str
  if (-not $norm) { return $set }
  foreach ($t in $norm.Split(' ')) {
    if ($t -and -not $stopwordSet.Contains($t)) { [void]$set.Add($t) }
  }
  return $set
}

function Get-Jaccard($a, $b) {
  if ($a.Count -eq 0 -or $b.Count -eq 0) { return 0 }
  $inter = 0
  foreach ($t in $a) { if ($b.Contains($t)) { $inter++ } }
  $union = $a.Count + $b.Count - $inter
  if ($union -eq 0) { return 0 }
  return $inter / $union
}

function Read-PdfText([string]$pdfPath) {
  $tmp = Join-Path $env:TEMP ("pdftotext_tmp_{0}.txt" -f ([System.Guid]::NewGuid().ToString('N')))
  & $pdftotext -f 1 -l 3 -layout $pdfPath $tmp | Out-Null
  if (-not (Test-Path $tmp)) { return '' }
  $text = Get-Content -Raw -Encoding UTF8 $tmp
  Remove-Item $tmp -Force
  return $text
}

function Find-TitleIndex($lines, $titleTokens) {
  $bestIdx = 0
  $bestScore = 0
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $tokens = Get-TokenSet $lines[$i]
    if ($tokens.Count -eq 0) { continue }
    $shared = 0
    foreach ($t in $titleTokens) { if ($tokens.Contains($t)) { $shared++ } }
    if ($titleTokens.Count -eq 0) { continue }
    $score = $shared / $titleTokens.Count
    if ($score -gt $bestScore) { $bestScore = $score; $bestIdx = $i }
  }
  if ($bestScore -ge 0.25) { return $bestIdx }
  return 0
}

function Is-TitleLikeLine([string]$line, $titleTokens) {
  if ($titleTokens.Count -eq 0) { return $false }
  $tokens = Get-TokenSet $line
  if ($tokens.Count -eq 0) { return $false }
  $shared = 0
  foreach ($t in $titleTokens) { if ($tokens.Contains($t)) { $shared++ } }
  $ratio = $shared / $titleTokens.Count
  return ($ratio -ge 0.4)
}

function Line-Score([string]$line) {
  $commaCount = ([regex]::Matches($line, ',')).Count
  $score = $commaCount * 2
  if ($line -match '\band\b') { $score++ }
  if ($line -match '[•·]') { $score++ }
  if ($line -match $bannedLineRe) { $score -= 5 }
  if ($line -match '\b20\d{2}\b') { $score -= 2 }
  if ($line.Length -lt 20) { $score -= 1 }
  if ($line.Length -gt 400) { $score -= 2 }
  return $score
}

function Normalize-NameText([string]$text) {
  if (-not $text) { return '' }
  $s = $text -replace '[\u00A0\u2007\u202F]', ' '
  $s = $s -replace '[^A-Za-z\s\-.]', ''
  $s = $s -replace '\s+', ' '
  return $s.Trim()
}

function LooksLike-AuthorLine([string]$line) {
  if ($line -match $bannedLineRe) { return $false }
  $commaCount = ([regex]::Matches($line, ',')).Count
  if ($commaCount -lt 1) { return $false }
  $words = $line -split '\s+'
  $caps = 0
  $initials = 0
  $lower = 0
  foreach ($w in $words) {
    if ($w -match '^[A-Z][a-z]+') { $caps++ }
    elseif ($w -match '^[A-Z]{1,2}$' -or $w -match '^[A-Z]\.$') { $initials++ }
    elseif ($w -match '^[a-z]') { $lower++ }
  }
  if (($caps + $initials) -lt 4) { return $false }
  if ($lower -gt ($caps + $initials)) { return $false }
  return $true
}

function Is-NameLike([string]$part) {
  if (-not $part -or $part.Length -lt 4) { return $false }
  if ($part -match ':') { return $false }
  $check = Normalize-NameText $part
  if (-not $check) { return $false }
  if ($part -match '@|http|www\.') { return $false }
  if ($part -match $bannedNameRe) { return $false }
  $words = $check -split '\s+'
  if ($words.Count -gt 6) { return $false }
  $nameWords = 0
  $initials = 0
  $acronyms = 0
  $lower = 0
  foreach ($w in $words) {
    if ($w -match '^[A-Z][a-z]+(?:-[A-Z][a-z]+)*$') { $nameWords++; continue }
    if ($w -match '^[A-Z]\.$' -or $w -match '^[A-Z]{1,2}$') { $initials++; continue }
    if ($w -match '^[A-Z]{3,}$') { $acronyms++; continue }
    if ($w -match '^[a-z]') { $lower++ }
  }
  if (($nameWords + $initials) -lt 2) { return $false }
  if ($acronyms -gt 1) { return $false }
  if ($lower -gt 2) { return $false }
  return $true
}

function Is-AuthorListQuality($names) {
  if (-not $names -or $names.Count -lt 2) { return $false }
  $totalWords = 0
  $goodWords = 0
  $badWords = 0
  $hasFull = $false
  foreach ($name in $names) {
    if (-not $name) { continue }
    if ($name -match $bannedNameRe) { return $false }
    if ($name -match '@|http|www\\.') { return $false }
    $check = Normalize-NameText $name
    if (-not $check) { $badWords++; continue }
    $words = $check -split '\s+'
    foreach ($w in $words) {
      if ($w -match '^[A-Z][a-z]+(?:-[A-Z][a-z]+)*$') { $goodWords++; $hasFull = $true }
      elseif ($w -match '^[A-Z]\\.$' -or $w -match '^[A-Z]{1,2}$') { $goodWords++ }
      elseif ($w -match '^[A-Z]{3,}$') { $badWords++ }
      elseif ($w -match '^[a-z]') { $badWords++ }
      else { $badWords++ }
      $totalWords++
    }
  }
  if (-not $hasFull) { return $false }
  if ($badWords -gt 2) { return $false }
  if ($goodWords -lt 4) { return $false }
  return $true
}

function Clean-Part([string]$part) {
  $p = $part.Trim()
  if (-not $p) { return '' }
  $p = $p -replace '[†‡*]', ''
  $p = $p -replace '\s+and\s+', ', '
  $p = $p -replace '[•·]', ', '
  $p = $p -replace '\[[^\]]*\]', ''
  $p = $p -replace '\([^)]*@[^)]*\)', ''
  $p = $p -replace '\bORCID\b.*$', ''
  $p = $p -replace '(?i)Cite This.*$', ''
  $p = $p -replace '\b(Corresponding|Author|E-mail|Email)\b.*$', ''
  $p = $p -replace '\s+', ' '
  $p = $p -replace '\b[a-z]\b', ''
  $p = $p -replace '\b\d+\b', ''
  $p = $p -replace '\s*[†‡*]+', ''
  $p = $p -replace '\s+', ' '
  $words = $p -split '\s+'
  $firstCapIdx = -1
  for ($i = 0; $i -lt $words.Length; $i++) {
    if ($words[$i] -match '^[A-Z][a-z]' -or $words[$i] -match '^[A-Z]\.$' -or $words[$i] -match '^[A-Z]{1,2}$') { $firstCapIdx = $i; break }
  }
  if ($firstCapIdx -gt 0) { $p = ($words[$firstCapIdx..($words.Length-1)] -join ' ') }
  return $p.Trim()
}

function Extract-Authors([string]$text, $titleTokens) {
  $rawLines = $text -split "`r?`n" | ForEach-Object { ($_ -replace '\s+', ' ').Trim() } | Where-Object { $_ }
  if (-not $rawLines -or $rawLines.Count -eq 0) { return @() }

  $titleIdx = Find-TitleIndex $rawLines $titleTokens
  $start = [Math]::Min($titleIdx + 1, $rawLines.Count - 1)
  $end = [Math]::Min($titleIdx + 15, $rawLines.Count - 1)
  $windowLines = $rawLines[$start..$end]
  $candidateLines = $windowLines | Where-Object { $_ -notmatch $bannedLineRe -and -not (Is-TitleLikeLine $_ $titleTokens) }
  $candidateLinesPrefer = $candidateLines | Where-Object { LooksLike-AuthorLine $_ }
  if ($candidateLinesPrefer -and $candidateLinesPrefer.Count -gt 0) {
    $candidateLines = if ($candidateLinesPrefer.Count -gt 3) { $candidateLinesPrefer[0..2] } else { $candidateLinesPrefer }
  }

  if (-not $candidateLines -or $candidateLines.Count -eq 0) {
    $maxLines = $rawLines[0..([Math]::Min(79, $rawLines.Count - 1))]
    $best = ''
    $bestScore = -999
    foreach ($line in $maxLines) {
      $s = Line-Score $line
      if ($s -gt $bestScore) { $bestScore = $s; $best = $line }
    }
    if ($best) { $candidateLines = @($best) }
  }

  $candidateText = ($candidateLines -join ' ').Trim()
  if (-not $candidateText) { return @() }

  $parts = @()
  foreach ($rawPart in ($candidateText -split '[,;]+')) {
    $cleaned = Clean-Part $rawPart
    if (-not $cleaned) { continue }
    if ($cleaned -match ',') {
      $parts += ($cleaned -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    } else {
      $parts += $cleaned
    }
  }
  $names = @()
  foreach ($part in $parts) {
    if (-not (Is-NameLike $part)) { continue }
    $clean = $part -replace '\b[a-z]\b', ''
    $clean = $clean.Trim()
    if (-not (Is-NameLike $clean)) { continue }
    if ($names -notcontains $clean) { $names += $clean }
  }
  $andMatches = [regex]::Matches($candidateText, '\band\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})')
  foreach ($m in $andMatches) {
    $andName = (Clean-Part $m.Groups[1].Value)
    if ($andName -and (Is-NameLike $andName) -and ($names -notcontains $andName)) {
      $names += $andName
    }
  }
  return $names
}

function Has-Initials([string]$str) {
  if (-not $str) { return $false }
  return $str -match '\b[A-Z]{1,2}\b|\b[A-Z]\.'
}

$pdfFiles = Get-ChildItem -Path $pdfDir -Filter *.pdf | Select-Object -ExpandProperty Name

if ($TestPdf) {
  $pdfPath = if ([IO.Path]::IsPathRooted($TestPdf)) { $TestPdf } else { Join-Path $pdfDir $TestPdf }
  $titleTokens = Get-TokenSet $TestTitle
  $text = Read-PdfText $pdfPath
  $names = Extract-Authors $text $titleTokens
  $names
  return
}


$pdfMeta = @()
foreach ($file in $pdfFiles) {
  $base = [IO.Path]::GetFileNameWithoutExtension($file)
  $pdfMeta += [pscustomobject]@{
    File = $file
    Tokens = Get-TokenSet $base
  }
}

$report = [ordered]@{
  unmatched = @()
  extraction_failed = @()
  initials_remaining = @()
  updated = 0
}

foreach ($pub in $pubs) {
  $pubTokens = Get-TokenSet $pub.title
  $best = $null
  $bestScore = 0
  foreach ($pdf in $pdfMeta) {
    $score = Get-Jaccard $pubTokens $pdf.Tokens
    if ($score -gt $bestScore) { $bestScore = $score; $best = $pdf }
  }

  if (-not $best -or $bestScore -lt 0.35) {
    $report.unmatched += [pscustomobject]@{ title = $pub.title; score = $bestScore }
    continue
  }

  $pdfPath = Join-Path $pdfDir $best.File
  $text = Read-PdfText $pdfPath
  $names = Extract-Authors $text $pubTokens
  if ($names.Count -ge 2 -and (Is-AuthorListQuality $names)) {
    $newAuthors = ($names -join ', ')
    if ($pub.authors -ne $newAuthors) { $report.updated++ }
    $pub.authors = $newAuthors
  } else {
    $report.extraction_failed += [pscustomobject]@{ title = $pub.title; file = $best.File }
  }

  if (Has-Initials $pub.authors) {
    $report.initials_remaining += [pscustomobject]@{ title = $pub.title; authors = $pub.authors }
  }
}

$data | ConvertTo-Json -Depth 6 | Set-Content -Path $dataPath -Encoding UTF8
$report | ConvertTo-Json -Depth 6 | Set-Content -Path $reportPath -Encoding UTF8
$report.initials_remaining | ConvertTo-Json -Depth 6 | Set-Content -Path $initialsPath -Encoding UTF8

"Updated authors: $($report.updated)"
"Unmatched: $($report.unmatched.Count)"
"Extraction failed: $($report.extraction_failed.Count)"
"Initials remaining: $($report.initials_remaining.Count)"







