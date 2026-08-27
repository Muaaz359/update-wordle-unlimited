<?php
/**
 * Professional HD WebP Asset Generator for Wordle Unlimited
 * Uses TrueType Fonts (Segoe UI / Arial) to render high-resolution (1200x675) modern graphics.
 */

if (!is_dir('assets')) {
    mkdir('assets', 0777, true);
}

$fontBold = 'C:/Windows/Fonts/segoeuib.ttf';
if (!file_exists($fontBold)) $fontBold = 'C:/Windows/Fonts/arialbd.ttf';

$fontReg = 'C:/Windows/Fonts/segoeui.ttf';
if (!file_exists($fontReg)) $fontReg = 'C:/Windows/Fonts/arial.ttf';

// Helper function: Draw Rounded Filled Rectangle
function drawRoundedRect($im, $x, $y, $w, $h, $r, $color) {
    imagefilledrectangle($im, $x + $r, $y, $x + $w - $r, $y + $h, $color);
    imagefilledrectangle($im, $x, $y + $r, $x + $w, $y + $h - $r, $color);
    imagefilledellipse($im, $x + $r, $y + $r, $r * 2, $r * 2, $color);
    imagefilledellipse($im, $x + $w - $r, $y + $r, $r * 2, $r * 2, $color);
    imagefilledellipse($im, $x + $r, $y + $h - $r, $r * 2, $r * 2, $color);
    imagefilledellipse($im, $x + $w - $r, $y + $h - $r, $r * 2, $r * 2, $color);
}

// Helper function: Draw Tile with Letter
function drawTile($im, $x, $y, $size, $letter, $bgColor, $textColor, $font, $fontSize = 24) {
    drawRoundedRect($im, $x, $y, $size, $size, 10, $bgColor);
    if ($letter !== '') {
        $box = imagettfbbox($fontSize, 0, $font, $letter);
        $w = $box[2] - $box[0];
        $h = $box[1] - $box[7];
        $lx = $x + ($size - $w) / 2;
        $ly = $y + ($size + $h) / 2 - 4;
        imagettftext($im, $fontSize, 0, $lx, $ly, $textColor, $font, $letter);
    }
}

// =========================================================================
// 1. IMAGE 1: assets/wordle-game-preview.webp (1200 x 675)
// =========================================================================
$w = 1200; $h = 675;
$im1 = imagecreatetruecolor($w, $h);
imageantialias($im1, true);

// Background Gradient
for ($i = 0; $i < $h; $i++) {
    $ratio = $i / $h;
    $r = (int)(241 + (235 - 241) * $ratio);
    $g = (int)(245 + (240 - 245) * $ratio);
    $b = (int)(249 + (248 - 249) * $ratio);
    $col = imagecolorallocate($im1, $r, $g, $b);
    imageline($im1, 0, $i, $w, $i, $col);
}

// Colors
$cWhite   = imagecolorallocate($im1, 255, 255, 255);
$cGreen   = imagecolorallocate($im1, 34, 197, 94);   // #22c55e
$cYellow  = imagecolorallocate($im1, 234, 179, 8);   // #eab308
$cGray    = imagecolorallocate($im1, 100, 116, 139); // #64748b
$cEmpty   = imagecolorallocate($im1, 255, 255, 255);
$cEmptyB  = imagecolorallocate($im1, 203, 213, 225); // #cbd5e1
$cKeyBg   = imagecolorallocate($im1, 226, 232, 240); // #e2e8f0
$cDark    = imagecolorallocate($im1, 15, 23, 42);    // #0f172a
$cMuted   = imagecolorallocate($im1, 100, 116, 139);
$cShadow  = imagecolorallocatealpha($im1, 0, 0, 0, 115);
$cBrand   = imagecolorallocate($im1, 22, 163, 74);
$cBadgeBg = imagecolorallocate($im1, 220, 252, 231);

// Outer Container Card with Shadow
drawRoundedRect($im1, 150, 45, 900, 585, 24, $cShadow);
drawRoundedRect($im1, 145, 40, 910, 595, 24, $cWhite);

// Header inside Card
imagettftext($im1, 22, 0, 190, 95, $cDark, $fontBold, "WORDLE");
imagettftext($im1, 22, 0, 305, 95, $cBrand, $fontBold, "UNLIMITED");

// Tag Badge
drawRoundedRect($im1, 740, 70, 270, 36, 18, $cBadgeBg);
imagettftext($im1, 12, 0, 755, 93, $cBrand, $fontBold, "INFINITE FREE WORD PUZZLES");

imageline($im1, 180, 125, 1020, 125, $cEmptyB);

// Grid Draw (6 rows x 5 cols)
$gridStartX = 260;
$gridStartY = 150;
$tileSize = 58;
$tileGap = 10;

$guesses = [
    [['S', $cGreen], ['L', $cYellow], ['A', $cGray], ['T', $cGreen], ['E', $cGray]],
    [['S', $cGreen], ['H', $cGreen],  ['I', $cYellow], ['R', $cGreen], ['T', $cGreen]],
    [['S', $cGreen], ['H', $cGreen],  ['I', $cGreen],  ['N', $cGreen], ['Y', $cGreen]],
    [['', $cEmptyB], ['', $cEmptyB],  ['', $cEmptyB],  ['', $cEmptyB], ['', $cEmptyB]],
    [['', $cEmptyB], ['', $cEmptyB],  ['', $cEmptyB],  ['', $cEmptyB], ['', $cEmptyB]],
    [['', $cEmptyB], ['', $cEmptyB],  ['', $cEmptyB],  ['', $cEmptyB], ['', $cEmptyB]],
];

foreach ($guesses as $r => $row) {
    foreach ($row as $c => $tile) {
        $tx = $gridStartX + $c * ($tileSize + $tileGap);
        $ty = $gridStartY + $r * ($tileSize + $tileGap);
        $letter = $tile[0];
        $color = $tile[1];
        
        if ($letter === '') {
            drawRoundedRect($im1, $tx, $ty, $tileSize, $tileSize, 8, $cEmptyB);
            drawRoundedRect($im1, $tx + 2, $ty + 2, $tileSize - 4, $tileSize - 4, 6, $cWhite);
        } else {
            drawTile($im1, $tx, $ty, $tileSize, $letter, $color, $cWhite, $fontBold, 22);
        }
    }
}

// Side Info Column
$infoX = 640;
drawRoundedRect($im1, $infoX, 150, 370, 220, 16, $cKeyBg);
imagettftext($im1, 16, 0, $infoX + 24, 195, $cDark, $fontBold, "GENIUS! SOLVED IN 3/6");
imagettftext($im1, 12, 0, $infoX + 24, 230, $cMuted, $fontReg, "Streak: 18 Wins");
imagettftext($im1, 12, 0, $infoX + 24, 255, $cMuted, $fontReg, "Win Rate: 98%");
imagettftext($im1, 12, 0, $infoX + 24, 280, $cMuted, $fontReg, "Dictionary: Authentic 2,300+ Words");

drawRoundedRect($im1, $infoX + 24, 305, 180, 42, 10, $cGreen);
imagettftext($im1, 13, 0, $infoX + 45, 331, $cWhite, $fontBold, "NEXT PUZZLE 🔄");

// Bottom Features Bar
drawRoundedRect($im1, $infoX, 390, 370, 170, 16, $cWhite);
imagettftext($im1, 14, 0, $infoX + 20, 425, $cDark, $fontBold, "✨ Why Wordle Unlimited?");
imagettftext($im1, 12, 0, $infoX + 20, 455, $cMuted, $fontReg, "• No 24-hour waiting limits");
imagettftext($im1, 12, 0, $infoX + 20, 485, $cMuted, $fontReg, "• 100% Free with zero ads");
imagettftext($im1, 12, 0, $infoX + 20, 515, $cMuted, $fontReg, "• Works offline on all devices");

imagewebp($im1, 'assets/wordle-game-preview.webp', 95);
imagedestroy($im1);


// =========================================================================
// 2. IMAGE 2: assets/wordle-vowel-strategy.webp (1200 x 675)
// =========================================================================
$im2 = imagecreatetruecolor($w, $h);
imageantialias($im2, true);

for ($i = 0; $i < $h; $i++) {
    $ratio = $i / $h;
    $r = (int)(248 + (241 - 248) * $ratio);
    $g = (int)(250 + (245 - 250) * $ratio);
    $b = (int)(252 + (249 - 252) * $ratio);
    $col = imagecolorallocate($im2, $r, $g, $b);
    imageline($im2, 0, $i, $w, $i, $col);
}

$cWhite2   = imagecolorallocate($im2, 255, 255, 255);
$cGreen2   = imagecolorallocate($im2, 34, 197, 94);
$cYellow2  = imagecolorallocate($im2, 234, 179, 8);
$cGray2    = imagecolorallocate($im2, 100, 116, 139);
$cDark2    = imagecolorallocate($im2, 15, 23, 42);
$cMuted2   = imagecolorallocate($im2, 100, 116, 139);
$cBorder2  = imagecolorallocate($im2, 226, 232, 240);
$cCardBg2  = imagecolorallocate($im2, 255, 255, 255);

// Title Header
imagettftext($im2, 26, 0, 80, 75, $cDark2, $fontBold, "WORDLE VOWEL STRATEGY GUIDE");
imagettftext($im2, 15, 0, 80, 110, $cMuted2, $fontReg, "Top 4 High-Vowel Opening Words Ranked by Letter Frequency & Information Theory");

// 4 Starters Cards
$starters = [
    [
        'word' => 'ADIEU',
        'badge' => '4 VOWELS (A, I, E, U)',
        'desc' => 'Eliminates 80% of English vowels in a single turn. Uncovers core word acoustics immediately.',
        'tag' => 'Most Popular Opener',
        'y' => 140
    ],
    [
        'word' => 'AUDIO',
        'badge' => '4 VOWELS (A, U, I, O)',
        'desc' => 'Replaces E with O to test rare vowel combos. Pairs perfectly with STERN on Turn 2.',
        'tag' => 'Best O & U Diagnostic',
        'y' => 260
    ],
    [
        'word' => 'CANOE',
        'badge' => '3 VOWELS + C, N',
        'desc' => 'Balances 3 major vowels (A, O, E) with top tier consonants C and N for balanced hits.',
        'tag' => 'Vowel-Consonant Balance',
        'y' => 380
    ],
    [
        'word' => 'ROATE',
        'badge' => '3 VOWELS + R, T',
        'desc' => '#1 Computational algorithm pick based on Shannon entropy and official word frequency.',
        'tag' => 'Algorithmic Champion',
        'y' => 500
    ]
];

foreach ($starters as $s) {
    $cy = $s['y'];
    drawRoundedRect($im2, 80, $cy, 1040, 100, 14, $cCardBg2);
    imagerectangle($im2, 80, $cy, 1120, $cy + 100, $cBorder2);
    
    // Draw 5 Letter Tiles
    $letters = str_split($s['word']);
    foreach ($letters as $idx => $char) {
        $tx = 105 + $idx * 52;
        $ty = $cy + 22;
        $tCol = in_array($char, ['A','E','I','O','U']) ? $cGreen2 : $cYellow2;
        drawTile($im2, $tx, $ty, 44, $char, $tCol, $cWhite2, $fontBold, 18);
    }
    
    // Text on Card
    imagettftext($im2, 14, 0, 390, $cy + 42, $cDark2, $fontBold, $s['badge']);
    imagettftext($im2, 12, 0, 390, $cy + 72, $cMuted2, $fontReg, $s['desc']);
    
    // Tag Badge
    drawRoundedRect($im2, 900, $cy + 30, 200, 36, 18, $cBorder2);
    imagettftext($im2, 11, 0, 915, $cy + 53, $cDark2, $fontBold, $s['tag']);
}

// Pro Tip Banner
imagewebp($im2, 'assets/wordle-vowel-strategy.webp', 95);
imagedestroy($im2);


// =========================================================================
// 3. IMAGE 3: assets/wordle-cheat-sheet.webp (1200 x 675)
// =========================================================================
$im3 = imagecreatetruecolor($w, $h);
imageantialias($im3, true);

for ($i = 0; $i < $h; $i++) {
    $ratio = $i / $h;
    $r = (int)(248 + (241 - 248) * $ratio);
    $g = (int)(250 + (245 - 250) * $ratio);
    $b = (int)(252 + (249 - 252) * $ratio);
    $col = imagecolorallocate($im3, $r, $g, $b);
    imageline($im3, 0, $i, $w, $i, $col);
}

$cWhite3   = imagecolorallocate($im3, 255, 255, 255);
$cGreen3   = imagecolorallocate($im3, 34, 197, 94);
$cYellow3  = imagecolorallocate($im3, 234, 179, 8);
$cRed3     = imagecolorallocate($im3, 239, 68, 68);
$cDark3    = imagecolorallocate($im3, 15, 23, 42);
$cMuted3   = imagecolorallocate($im3, 100, 116, 139);
$cBorder3  = imagecolorallocate($im3, 226, 232, 240);
$cBarBg3   = imagecolorallocate($im3, 241, 245, 249);

// Header
imagettftext($im3, 26, 0, 80, 70, $cDark3, $fontBold, "WORDLE FREQUENCY CHEAT SHEET");
imagettftext($im3, 15, 0, 80, 105, $cMuted3, $fontReg, "Statistical Letter Distribution Across 2,300+ Official 5-Letter Target Words");

// Left Column: Letter Frequency Dashboard
drawRoundedRect($im3, 80, 135, 520, 480, 18, $cWhite3);
imagerectangle($im3, 80, 135, 600, 615, $cBorder3);
imagettftext($im3, 16, 0, 110, 180, $cDark3, $fontBold, "📊 Top Letter Frequencies (%)");

$freqs = [
    ['E', '46.2%', 462, $cGreen3],
    ['A', '39.1%', 391, $cGreen3],
    ['R', '38.7%', 387, $cGreen3],
    ['O', '29.2%', 292, $cYellow3],
    ['I', '28.4%', 284, $cYellow3],
    ['S', '27.3%', 273, $cYellow3],
    ['T', '26.5%', 265, $cYellow3],
    ['L', '25.1%', 251, $cYellow3],
];

foreach ($freqs as $idx => $f) {
    $fy = 220 + $idx * 48;
    drawTile($im3, 110, $fy - 22, 34, $f[0], $f[3], $cWhite3, $fontBold, 15);
    
    // Progress Bar
    drawRoundedRect($im3, 160, $fy - 12, 340, 16, 8, $cBarBg3);
    $barW = (int)(340 * ($f[2] / 500));
    drawRoundedRect($im3, 160, $fy - 12, $barW, 16, 8, $f[3]);
    
    imagettftext($im3, 13, 0, 520, $fy + 2, $cDark3, $fontBold, $f[1]);
}

// Right Column Top: Positional Insights
drawRoundedRect($im3, 630, 135, 490, 225, 18, $cWhite3);
imagerectangle($im3, 630, 135, 1120, 360, $cBorder3);
imagettftext($im3, 16, 0, 660, 180, $cDark3, $fontBold, "📍 High-Probability Positions");
imagettftext($im3, 13, 0, 660, 220, $cDark3, $fontBold, "Position 1 (Start):");
imagettftext($im3, 12, 0, 810, 220, $cMuted3, $fontReg, "S, C, B, T, P, A, F");
imagettftext($im3, 13, 0, 660, 260, $cDark3, $fontBold, "Position 2 & 3 (Core):");
imagettftext($im3, 12, 0, 830, 260, $cMuted3, $fontReg, "A, O, E, I, U, R");
imagettftext($im3, 13, 0, 660, 300, $cDark3, $fontBold, "Position 5 (End):");
imagettftext($im3, 12, 0, 810, 300, $cMuted3, $fontReg, "E, Y, T, R, L, N, D");

// Right Column Bottom: Trap Warning Box
drawRoundedRect($im3, 630, 385, 490, 230, 18, $cWhite3);
imagerectangle($im3, 630, 385, 1120, 615, $cBorder3);
imagettftext($im3, 16, 0, 660, 430, $cRed3, $fontBold, "⚠️ Hard Mode Trap Patterns");
imagettftext($im3, 12, 0, 660, 465, $cDark3, $fontBold, "• _IGHT Trap:");
imagettftext($im3, 12, 0, 770, 465, $cMuted3, $fontReg, "LIGHT, NIGHT, MIGHT, FIGHT, RIGHT, SIGHT");
imagettftext($im3, 12, 0, 660, 500, $cDark3, $fontBold, "• _ATCH Trap:");
imagettftext($im3, 12, 0, 770, 500, $cMuted3, $fontReg, "MATCH, CATCH, HATCH, LATCH, PATCH");
imagettftext($im3, 12, 0, 660, 535, $cDark3, $fontBold, "• _OUND Trap:");
imagettftext($im3, 12, 0, 770, 535, $cMuted3, $fontReg, "ROUND, SOUND, FOUND, BOUND, POUND");
imagettftext($im3, 11, 0, 660, 580, $cGreen3, $fontBold, "Pro Tip: Test multiple starting consonants on Turn 2!");

imagewebp($im3, 'assets/wordle-cheat-sheet.webp', 95);
imagedestroy($im3);

echo "All HD WebP assets generated with TrueType fonts successfully!\n";
