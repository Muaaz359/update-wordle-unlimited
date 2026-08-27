<?php
$src = 'C:/Users/kidzx/.gemini/antigravity/brain/ddbe5ae0-e873-458d-9fe0-becb5b375501/wordle_w_logo_1787844272226.jpg';
if (file_exists($src)) {
    $im = imagecreatefromjpeg($src);
    if ($im) {
        // Save high quality WebP
        imagewebp($im, 'assets/wordle-logo.webp', 95);
        
        // Save 64x64 favicon
        $fav = imagecreatetruecolor(64, 64);
        imagecopyresampled($fav, $im, 0, 0, 0, 0, 64, 64, imagesx($im), imagesy($im));
        imagepng($fav, 'assets/favicon.png');
        
        // Save 128x128 app icon
        $appIcon = imagecreatetruecolor(128, 128);
        imagecopyresampled($appIcon, $im, 0, 0, 0, 0, 128, 128, imagesx($im), imagesy($im));
        imagepng($appIcon, 'assets/icon-128.png');
        
        imagedestroy($fav);
        imagedestroy($appIcon);
        imagedestroy($im);
        echo "Wordle W logo, favicon, and app icon generated successfully!\n";
    }
} else {
    echo "Source image not found!\n";
}
