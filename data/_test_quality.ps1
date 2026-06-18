function Is-AuthorListQuality($names) {
  $bannedNameRe = '(?i)(conference|proceedings|journal|materials|department|university|institute|laboratory|college|school|center|republic|korea|doi|available|online|copyright|rights|reserved|received|accepted|abstract|keywords)'
  if (-not $names -or $names.Count -lt 2) { return $false }
  $totalWords = 0
  $goodWords = 0
  $badWords = 0
  $hasFull = $false
  foreach ($name in $names) {
    if (-not $name) { continue }
    if ($name -match $bannedNameRe) { return $false }
    if ($name -match '@|http|www\.') { return $false }
    $words = $name -split '\s+'
    foreach ($w in $words) {
      if ($w -match '^[A-Z][a-z]+(?:-[A-Z][a-z]+)*$') { $goodWords++; $hasFull = $true }
      elseif ($w -match '^[A-Z]\.$' -or $w -match '^[A-Z]{1,2}$') { $goodWords++ }
      elseif ($w -match '^[A-Z]{3,}$') { $badWords++ }
      elseif ($w -match '^[a-z]') { $badWords++ }
      else { $badWords++ }
      $totalWords++
    }
  }
  "good=$goodWords bad=$badWords hasFull=$hasFull"
  if (-not $hasFull) { return $false }
  if ($badWords -gt 2) { return $false }
  if ($goodWords -lt 4) { return $false }
  return $true
}
$names = @('Seungho Lee','Dongsoo Lee','Junhyuk Kang','Subi Yang','Min Sung Kang','Wooseop Jo','Jihoon Seo','Sung Beom Cho','Patrick Joohyun Kim')
Is-AuthorListQuality $names
