# slice-sprites.ps1
# 从大尺寸概念图裁切单个 sprite 到 sprites 目录
#
# 用法：
#   1. 修改下方的 $slices 配置，填入每张 sprite 的坐标和名称
#   2. 运行：.\quick-start\slice-sprites.ps1
#   3. 切好的 PNG 会输出到 client/public/assets/sprites/ 对应子目录

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

# ============================================================
# 配置区：在这里填写每张 sprite 的裁切参数
# ============================================================

# 原图所在目录
$sourceDir = Join-Path $repoRoot "pic_resource"

# 输出根目录
$outputRoot = Join-Path $repoRoot "client\public\assets\sprites"

# 裁切清单
# 每个条目：
#   src      = 原图文件名（存放在 pic_resource/）
#   x, y     = 裁切起点（在原图中的像素坐标，左上角为 0,0）
#   w, h     = 裁切宽高（像素）
#               地面 tile: 96×60
#               建筑:      96×110
#               角色:      48×64
#               图标:      32×32
#   name     = 输出文件名（不含扩展名，按 snake_case 命名）
#   category = 输出子目录（tiles / buildings / characters / icons）
#
# 示例（坐标需要你根据实际概念图位置填写）：
$slices = @(
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 200; y = 300; w = 96; h = 110; name = "mine";           category = "buildings" },
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 350; y = 280; w = 96; h = 110; name = "hospital";       category = "buildings" },
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 500; y = 320; w = 96; h = 110; name = "restaurant";     category = "buildings" },
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 650; y = 260; w = 96; h = 110; name = "school";         category = "buildings" },
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 800; y = 350; w = 96; h = 110; name = "shop_convenience"; category = "buildings" },
  # @{ src = "ed813a8b-607c-4810-ab3c-191cd0e7bfe7.png"; x = 950; y = 400; w = 96; h = 110; name = "fishing_hut";    category = "buildings" }
)

# ============================================================
# 执行裁切（无需修改以下内容）
# ============================================================

Add-Type -AssemblyName System.Drawing

if ($slices.Count -eq 0) {
  Write-Host "[slice-sprites] 请先在脚本中配置 `$slices 清单，然后取消注释。" -ForegroundColor Yellow
  Write-Host "[slice-sprites] 每个条目需要填写 src / x / y / w / h / name / category。" -ForegroundColor Yellow
  exit 0
}

$sliced = 0
$skipped = 0

foreach ($s in $slices) {
  $srcPath = Join-Path $sourceDir $s.src
  if (-not (Test-Path $srcPath)) {
    Write-Host "[slice-sprites] 跳过：找不到原图 $srcPath" -ForegroundColor Red
    $skipped++
    continue
  }

  $outDir = Join-Path $outputRoot $s.category
  if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
  }
  $outPath = Join-Path $outDir "$($s.name).png"

  $srcImage = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $srcW = $srcImage.Width
    $srcH = $srcImage.Height

    # 边界检查
    if ($s.x + $s.w -gt $srcW -or $s.y + $s.h -gt $srcH -or $s.x -lt 0 -or $s.y -lt 0) {
      Write-Host "[slice-sprites] 跳过 $($s.name)：裁切区域超出原图范围 (原图 ${srcW}×${srcH})" -ForegroundColor Red
      $skipped++
      continue
    }

    # 创建目标位图（带透明通道）
    $destImage = New-Object System.Drawing.Bitmap($s.w, $s.h)
    $destImage.MakeTransparent()
    $g = [System.Drawing.Graphics]::FromImage($destImage)
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 裁切
    $srcRect = New-Object System.Drawing.Rectangle($s.x, $s.y, $s.w, $s.h)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $s.w, $s.h)
    $g.DrawImage($srcImage, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destImage.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destImage.Dispose()

    Write-Host "[slice-sprites] 已裁切: $($s.name).png → sprites/$($s.category)/ ($($s.w)×$($s.h))" -ForegroundColor Green
    $sliced++
  }
  finally {
    $srcImage.Dispose()
  }
}

Write-Host "[slice-sprites] 完成：成功 $sliced，跳过 $skipped" -ForegroundColor Cyan
