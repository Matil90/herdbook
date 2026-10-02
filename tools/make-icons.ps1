# Regenerates the PNG app icons from the HerdBook sprout design.
# Usage: powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
param([string]$OutDir = [System.IO.Path]::GetDirectoryName($PSScriptRoot))
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing')

function Color($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

# Draws the sprout on a 512-unit canvas, scaled to $size.
# $rounded: rounded tile (for "any" icons); otherwise a full-bleed square (maskable / iOS round it themselves).
# $art: scale of the sprout around the centre (smaller keeps it inside Android's maskable safe zone).
function Draw($size, $rounded, $art, $file) {
  $bmp = [System.Drawing.Bitmap]::new($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $s = $size / 512.0
  $g.ScaleTransform($s, $s)

  $bg = [System.Drawing.SolidBrush]::new((Color '#2f6b3a'))
  if ($rounded) {
    $r = 224; $p = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $p.AddArc(0, 0, $r, $r, 180, 90); $p.AddArc(512 - $r, 0, $r, $r, 270, 90)
    $p.AddArc(512 - $r, 512 - $r, $r, $r, 0, 90); $p.AddArc(0, 512 - $r, $r, $r, 90, 90)
    $p.CloseFigure(); $g.FillPath($bg, $p)
  } else {
    $g.FillRectangle($bg, 0, 0, 512, 512)
  }

  $g.TranslateTransform(256, 271); $g.ScaleTransform($art, $art); $g.TranslateTransform(-256, -271)

  $pen = [System.Drawing.Pen]::new((Color '#f4f1ea'), 28)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round; $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($pen, 256, 404, 256, 252)

  $leaf = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leaf.AddBezier(256, 262, 256, 190, 308, 138, 390, 138)
  $leaf.AddBezier(390, 138, 390, 220, 338, 272, 256, 262)
  $g.FillPath([System.Drawing.SolidBrush]::new((Color '#f4f1ea')), $leaf)

  $leaf2 = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $leaf2.AddBezier(256, 304, 256, 242, 212, 200, 142, 200)
  $leaf2.AddBezier(142, 200, 142, 268, 186, 312, 256, 304)
  $g.FillPath([System.Drawing.SolidBrush]::new((Color '#cfe5c9')), $leaf2)

  $bmp.Save([System.IO.Path]::Combine($OutDir, $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Draw 192 $true 1.0 'icon-192.png'
Draw 512 $true 1.0 'icon-512.png'
Draw 512 $false 0.78 'icon-maskable-512.png'
Draw 180 $false 0.9 'apple-touch-icon.png'
[Console]::WriteLine('icons written to ' + $OutDir)
