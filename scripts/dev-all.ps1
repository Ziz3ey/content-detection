<#
.SYNOPSIS
  Startup keseluruhan sistem Content Detection (microservices + dashboard).
.DESCRIPTION
  Skrip ini akan:
  - Memeriksa port setiap service sebelum menjalankan.
  - Tidak menjalankan ulang service yang sudah aktif & sehat.
  - Menjalankan service yang belum aktif.
  - Menunggu health check setiap service berhasil.
  - Menjalankan dashboard setelah aggregator siap.
  - Menampilkan status setiap service dan port.
  - Menampilkan pesan error yang jelas jika suatu service gagal aktif.

  Untuk menghentikan service yang dikelola script ini:
    powershell -File scripts/dev-all.ps1 -Action Stop
#>

param(
  [Parameter(Position=0)]
  [ValidateSet('Start', 'Stop', 'Status', 'Restart')]
  [string]$Action = 'Start'
)

$ErrorActionPreference = 'Stop'

# Determine project root - script is in scripts/ subdirectory
if ($PSScriptRoot) {
  $ProjectRoot = Split-Path -Parent $PSScriptRoot
} else {
  $ProjectRoot = Resolve-Path '.'
}
$ProjectRoot = Resolve-Path $ProjectRoot
$ServicesRoot = Join-Path $ProjectRoot 'services'

# Service definitions: name, port, directory, start command
$Services = @(
  @{
    Name   = 'text-detection-service'
    Port   = 3000
    Dir    = Join-Path $ServicesRoot 'text-detection-service'
    Cmd    = 'node src/server.js'
    Health = 'http://localhost:3000/health'
  },
  @{
    Name   = 'crawler-service'
    Port   = 3001
    Dir    = Join-Path $ServicesRoot 'crawler-service'
    Cmd    = 'node src/server.js'
    Health = 'http://localhost:3001/health'
  },
  @{
    Name   = 'defacement-service'
    Port   = 3002
    Dir    = Join-Path $ServicesRoot 'defacement-service'
    Cmd    = 'node src/server.js'
    Health = 'http://localhost:3002/health'
  },
  @{
    Name   = 'link-detection-service'
    Port   = 3003
    Dir    = Join-Path $ServicesRoot 'link-detection-service'
    Cmd    = 'node src/server.js'
    Health = 'http://localhost:3003/health'
  },
  @{
    Name   = 'aggregator-service'
    Port   = 3004
    Dir    = Join-Path $ServicesRoot 'aggregator-service'
    Cmd    = 'node --env-file-if-exists=.env src/server.js'
    Health = 'http://localhost:3004/health'
  },
  @{
    Name   = 'local-test-site'
    Port   = 8080
    Dir    = $ProjectRoot
    Cmd    = 'node local-test-http-server.js'
    Health = 'http://127.0.0.1:8080/index.html'
  },
  @{
    Name   = 'dashboard'
    Port   = 5173
    Dir    = Join-Path $ProjectRoot 'dashboard'
    Cmd    = 'npx vite --port 5173 --host 0.0.0.0'
    Health = 'http://localhost:5173/health'
  }
)

function Test-PortOpen {
  param([int]$Port)
  if (-not $Port -or $Port -le 0) { return $false }
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $ar = $tcp.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $ar.AsyncWaitHandle.WaitOne(400, $false)
    if ($ok) {
      $tcp.EndConnect($ar)
      $tcp.Close()
      return $true
    }
    $tcp.Close()
  } catch {}
  try {
    $tcp6 = New-Object System.Net.Sockets.TcpClient([System.Net.Sockets.AddressFamily]::InterNetworkV6)
    $ar6 = $tcp6.BeginConnect("::1", $Port, $null, $null)
    $ok6 = $ar6.AsyncWaitHandle.WaitOne(400, $false)
    if ($ok6) {
      $tcp6.EndConnect($ar6)
      $tcp6.Close()
      return $true
    }
    $tcp6.Close()
  } catch {}
  return $false
}

function Test-Healthy {
  param([string]$Url, [int]$Timeout = 5)
  if (-not $Url) { return $false }
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-ManagedService {
  param(
    [Hashtable]$Svc,
    [switch]$SkipHealthCheck
  )

  if (-not $Svc -or -not $Svc['Port'] -or -not $Svc['Name']) {
    Write-Host "  -> ERROR: Definisi service tidak valid atau null." -ForegroundColor Red
    return $false
  }

  $name = [string]$Svc['Name']
  $port = [int]$Svc['Port']
  $healthUrl = [string]$Svc['Health']
  $cmd = [string]$Svc['Cmd']
  $dir = [string]$Svc['Dir']

  Write-Host "[START] $name (port $port)" -ForegroundColor Yellow

  # Check if already running
  if (Test-PortOpen -Port $port) {
    Write-Host "  -> Port $port sudah terbuka. Memeriksa health..." -ForegroundColor Gray
    if (-not $SkipHealthCheck) {
      if (Test-Healthy -Url $healthUrl) {
        Write-Host "  -> $name sudah sehat dan berjalan." -ForegroundColor Green
        return $true
      } else {
        Write-Host "  -> Port $port terbuka tapi health endpoint belum 200. Menunggu..." -ForegroundColor Yellow
      }
    } else {
      Write-Host "  -> Port $port sudah terbuka (dashboard/dev mode, skip health check)." -ForegroundColor Green
      return $true
    }
  } else {
    # Start the service
    Push-Location $dir
    try {
      $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -Command ""$cmd""") -PassThru
      Write-Host "  -> Started PID $($proc.Id)" -ForegroundColor Green
    } catch {
      Write-Host "  -> ERROR starting service: $_" -ForegroundColor Red
      Pop-Location
      return $false
    } finally {
      Pop-Location
    }
  }

  # Wait for health or port readiness
  $timeoutSec = 30
  $elapsed = 0
  $isReady = $false

  while ($elapsed -lt $timeoutSec) {
    if ($SkipHealthCheck) {
      if (Test-PortOpen -Port $port) {
        $isReady = $true
        break
      }
    } else {
      if (Test-Healthy -Url $healthUrl) {
        $isReady = $true
        break
      }
    }
    Start-Sleep -Seconds 1
    $elapsed++
  }

  if ($isReady) {
    Write-Host "  -> $name sehat pada port $port" -ForegroundColor Green
    return $true
  } else {
    Write-Host "  -> ERROR $name tidak sehat setelah $timeoutSec detik." -ForegroundColor Red
    return $false
  }
}

function Stop-Service {
  param([Hashtable]$Svc)

  if (-not $Svc -or -not $Svc['Port'] -or -not $Svc['Name']) {
    return
  }

  $name = [string]$Svc['Name']
  $port = [int]$Svc['Port']

  Write-Host ">>> [STOP] $name (port $port)" -ForegroundColor Yellow

  if (-not (Test-PortOpen -Port $port)) {
    Write-Host "  -> Port $port sudah tertutup." -ForegroundColor Gray
    return
  }

  # Find process listening on the port
  $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object { $_.OwningProcess -gt 4 }
  if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($p in $pids) {
      if ($p -and $p -gt 4) {
        $procObj = Get-Process -Id $p -ErrorAction SilentlyContinue
        if ($procObj) {
          try {
            Write-Host "  -> Menghentikan $($procObj.ProcessName) (PID $p) pada port $port..." -ForegroundColor Yellow
            Stop-Process -Id $p -Force -ErrorAction Stop
            Write-Host "  -> Berhasil menghentikan PID $p" -ForegroundColor Green
          } catch {
            Write-Host "  -> Gagal menghentikan PID $p - $_" -ForegroundColor Red
          }
        }
      }
    }
  }

  # Wait for port to close
  $i = 0
  while ((Test-PortOpen -Port $port) -and ($i -lt 10)) {
    Start-Sleep -Seconds 1
    $i++
  }
  if (-not (Test-PortOpen -Port $port)) {
    Write-Host "  -> Port $port sudah tertutup." -ForegroundColor Green
  } else {
    Write-Host "  -> PERINGATAN: port $port masih terbuka." -ForegroundColor Red
  }
}

function Show-Status {
  param([Hashtable[]]$SvcList)

  if (-not $SvcList -or $SvcList.Count -eq 0) {
    Write-Host "  Tidak ada service yang terdaftar." -ForegroundColor Yellow
    return
  }

  foreach ($Svc in $SvcList) {
    if (-not $Svc -or -not $Svc['Port']) { continue }
    $port = [int]$Svc['Port']
    $name = [string]$Svc['Name']
    $healthUrl = [string]$Svc['Health']

    $up = Test-PortOpen -Port $port
    $healthy = $false
    if ($up) {
      $healthy = Test-Healthy -Url $healthUrl
    }
    $color = if ($healthy) { 'Green' } elseif ($up) { 'Yellow' } else { 'Red' }
    $status = if ($healthy) { 'HEALTHY' } elseif ($up) { 'LISTENING (tidak sehat)' } else { 'TIDAK ADA' }
    Write-Host "  $($name.PadRight(30)) port=$($port.ToString().PadRight(6)) status=$status" -ForegroundColor $color
  }
}

# Main Actions Dispatch
if ($Action -eq 'Stop') {
  Write-Host "=== Menghentikan Seluruh Service Content Detection ===" -ForegroundColor Yellow
  foreach ($Svc in $Services) {
    Stop-Service -Svc $Svc
  }
  exit
}

if ($Action -eq 'Status') {
  Show-Status -SvcList $Services
  exit
}

if ($Action -eq 'Restart') {
  Write-Host "=== Menghentikan Seluruh Service untuk Restart ===" -ForegroundColor Yellow
  foreach ($Svc in $Services) {
    Stop-Service -Svc $Svc
  }
  Start-Sleep -Seconds 2
  Write-Host "=== Memulai Ulang Seluruh Service ===" -ForegroundColor Cyan
}

# Startup Microservices & Detector Services
Write-Host "=== Startup Content Detection System ===" -ForegroundColor Cyan
Write-Host "Port  Service                 Status"
Write-Host "------ -------------------------" -ForegroundColor Cyan

$results = @()
foreach ($SvcItem in $Services) {
  if (-not $SvcItem -or -not $SvcItem['Name']) { continue }
  if ($SvcItem['Name'] -eq 'dashboard') { continue }
  $ok = Start-ManagedService -Svc $SvcItem
  $results += @{ Name = $SvcItem['Name']; Healthy = $ok }
}

# Start dashboard after aggregator is ready
$dashboardObj = $null
foreach ($item in $Services) {
  if ($item -and $item['Name'] -eq 'dashboard') {
    $dashboardObj = $item
    break
  }
}

if ($dashboardObj) {
  Write-Host "[MENUNGGU aggregator sehat sebelum memulai dashboard...]" -ForegroundColor Cyan
  $aggWait = 0
  while (-not (Test-Healthy -Url 'http://localhost:3004/health') -and ($aggWait -lt 15)) {
    Start-Sleep -Seconds 1
    $aggWait++
  }

  if ((Test-PortOpen -Port 3004) -and (Test-Healthy -Url 'http://localhost:3004/health')) {
    $ok = Start-ManagedService -Svc $dashboardObj -SkipHealthCheck
    $results += @{ Name = 'dashboard'; Healthy = $ok }
  } else {
    Write-Host "  -> Aggregator belum sehat. Dashboard tidak akan dimulai." -ForegroundColor Red
    $results += @{ Name = 'dashboard'; Healthy = $false }
  }
} else {
  Write-Host "  -> Definisi service dashboard tidak ditemukan." -ForegroundColor Yellow
}

# Final status display
Write-Host "`n=== Status Akhir ===" -ForegroundColor Cyan
Show-Status -SvcList $Services

$allHealthy = $true
foreach ($Svc in $Services) {
  if (-not $Svc -or -not $Svc['Port']) { continue }
  $isUp = Test-PortOpen -Port $Svc['Port']
  $isHealthy = $false
  if ($isUp) {
    $isHealthy = Test-Healthy -Url $Svc['Health']
  }
  if (-not $isHealthy) { $allHealthy = $false }
}

if ($allHealthy) {
  Write-Host ">>> SEMUA SERVICE SIAP. Dashboard: http://localhost:5173" -ForegroundColor Green
} else {
  Write-Host ">>> Peringatan: beberapa service belum sehat. Periksa status." -ForegroundColor Yellow
}

# Keep script alive for interactive 'Start' and 'Restart' actions
if ($Action -in @('Start', 'Restart')) {
  Write-Host ">>> Script akan berjalan sampai dihentikan. Tekan Ctrl+C untuk berhenti." -ForegroundColor Yellow
  while ($true) { Start-Sleep -Seconds 5 }
}
