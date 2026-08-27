<?php
$src = 'C:/Users/kidzx/.gemini/antigravity/brain/ddbe5ae0-e873-458d-9fe0-becb5b375501/wordle_globe_logo_1787844106519.jpg';
if (file_exists($src)) {
    $im = imagecreatefromjpeg($src);
    if ($im) {
        imagewebp($im, 'assets/logo.webp', 95);
        
        // Create 64x64 favicon
        $fav = imagecreatetruecolor(64, 64);
        imagecopyresampled($fav, $im, 0, 0, 0, 0, 64, 64, imagesx($im), imagesy($im));
        imagepng($fav, 'assets/favicon.png');
        imagedestroy($fav);
        imagedestroy($im);
        echo "Logo and favicon saved in assets/ successfully!\n";
    }
}
