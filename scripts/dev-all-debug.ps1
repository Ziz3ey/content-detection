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
    pwsh -File scripts/dev-all.ps1 -Action Stop
#>

param(
  [Parameter(Position=0)]
  [ValidateSet('Start', 'Stop', 'Status', 'Restart')]
  [string]$Action = 'Start'
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Resolve-Path
$ServicesRoot = Join-Path $ProjectRoot 'services'

# Service definitions: name, port, directory, start command
$Services = @(
  @{
    Name = 'text-detection-service';
    Port = 3000;
    Dir  = Join-Path $ServicesRoot 'text-detection-service';
    Cmd  = 'node src/server.js';
    Health = 'http://localhost:3000/health';
  },
  @{
    Name = 'crawler-service';
    Port = 3001;
    Dir  = Join-Path $ServicesRoot 'crawler-service';
    Cmd  = 'node src/server.js';
    Health = 'http://localhost:3001/health';
  },
  @{
    Name = 'defacement-service';
    Port = 3002;
    Dir  = Join-Path $ServicesRoot 'defacement-service';
    Cmd  = 'node src/server.js';
    Health = 'http://localhost:3002/health';
  },
  @{
    Name = 'link-detection-service';
    Port = 3003;
    Dir  = Join-Path $ServicesRoot 'link-detection-service';
    Cmd  = 'node src/server.js';
    Health = 'http://localhost:3003/health';
  },
  @{
    Name = 'aggregator-service';
    Port = 3004;
    Dir  = Join-Path $ServicesRoot 'aggregator-service';
    Cmd  = 'node --env-file-if-exists=.env src/server.js';
    Health = 'http://localhost:3004/health';
  },
  @{
    Name = 'dashboard';
    Port = 5173;
    Dir  = Join-Path $ProjectRoot 'dashboard';
    Cmd  = 'npx vite --port 5173 --host 0.0.0.0';
    Health = 'http://localhost:5173/health';
  }
)

function Test-PortOpen {
  param([int]$Port)
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", $Port)
    $tcp.Close()
    return $true
  } catch {
    return $false
  }
}

function Test-Healthy {
  param([string]$Url, [int]$Timeout = 5)
  try {
    $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $Timeout -UseBasicParsing
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Start-ManagedService {
  param([Hashtable]$Svc)

  Write-Host "[START] $($Svc.Name) (port $($Svc.Port))" -ForegroundColor Yellow

  # Check if already running
  if (Test-PortOpen -Port $Svc.Port) {
    Write-Host "  -> Port $($Svc.Port) sudah terbuka. Memeriksa health..." -ForegroundColor Gray
    if (Test-Healthy -Url $Svc.Health) {
      Write-Host "  -> $($Svc.Name) sudah sehat dan berjalan." -ForegroundColor Green
      return $true
    } else {
      Write-Host "  -> Port terbuka tapi health gagal. Mencoba start ulang." -ForegroundColor Yellow
    }
  }

  # Start the service
  Push-Location $Svc.Dir
  try {
    $proc = Start-Process -FilePath 'powershell.exe' -ArgumentList ("-NoProfile -ExecutionPolicy Bypass -Command ""$($Svc.Cmd)""") -PassThru
    Write-Host "  -> Started PID $proc.Id" -ForegroundColor Green
  } catch {
    Write-Host "  -> ERROR starting service: $_" -ForegroundColor Red
  } finally {
    Pop-Location
  }

  # Wait for health
  $i = 0
  while ((Test-PortOpen -Port $Svc.Port) -and -not (Test-Healthy -Url $Svc.Health)) {
    Start-Sleep -Seconds 1
    $i++
    if ($i -gt 30) {
      Write-Host "  -> ERROR $($Svc.Name) tidak sehat setelah 30 detik." -ForegroundColor Red
      return $false
    }
  }

  if (Test-Healthy -Url $Svc.Health) {
    Write-Host "  -> $($Svc.Name) healthy pada port $($Svc.Port)" -ForegroundColor Green
    return $true
  } else {
    Write-Host "  -> ERROR $($Svc.Name) tidak sehat." -ForegroundColor Red
    return $false
  }
}

function Stop-Service {
  param([Hashtable]$Svc)

  Write-Host ">>> [STOP] $($Svc.Name) (port $($Svc.Port))" -ForegroundColor Yellow

  # Find process using the port
  $proc = Get-Process | Where-Object { $_.Path -like '*node.exe*' -or $_.Path -like '*vite*' } |
           Where-Object { (Test-PortOpen -Port $Svc.Port) -and (Get-Process -Id $_.Id).Path -like '*node*' }

  if ($proc) {
    Write-Host "  -> Mencari process: $($proc.Id)" -ForegroundColor Gray
    try {
      Stop-Process -Id $proc.Id -Force -ErrorAction Stop
      Write-Host "  -> Berhasil menghentikan PID $proc.Id" -ForegroundColor Green
    } catch {
      Write-Host "  -> ERROR menghentikan: $_" -ForegroundColor Red
    }
  } else {
    Write-Host "  -> Tidak ada process Node/Vite yang ditemukan di port $($Svc.Port)." -ForegroundColor Gray
  }

  # Wait for port to close
  $i = 0
  while ((Test-PortOpen -Port $Svc.Port) -and ($i -lt 10)) {
    Start-Sleep -Seconds 1
    $i++
  }
  if (-not (Test-PortOpen -Port $Svc.Port)) {
    Write-Host "  -> Port $($Svc.Port) sudah ter Tutup." -ForegroundColor Green
  } else {
    Write-Host "  -> PERINGATAN: port $($Svc.Port) masih terbuka." -ForegroundColor Red
  }
}

function Show-Status {
  param([Hashtable[]]$SvcList)
  foreach ($Svc in $SvcList) {
    $up = Test-PortOpen -Port $Svc.Port
    $healthy = $false
    if ($up) {
      $healthy = Test-Healthy -Url $Svc.Health
    }
    $color = if ($healthy) { 'Green' } elseif ($up) { 'Yellow' } else { 'Red' }
    $status = if ($healthy) { 'HEALTHY' } elseif ($up) { 'LISTENING (tidak sehat)' } else { 'TIDAK ADA' }
    Write-Host "  $($Svc.Name.PadRight(30)) port=$($Svc.Port.ToString().PadRight(6)) status=$status" -ForegroundColor $color
  }
}

# Main
if ($Action -eq 'Stop') {
  foreach ($Svc in $Services) {
    Stop-Service -Svc $Svc
  }
  exit
}

if ($Action -eq 'Status') {
  Show-Status -SvcList $Services
  exit
}

# Start all services
Write-Host "=== Startup Content Detection System ===" -ForegroundColor Cyan
Write-Host "Port  Service                 Status"
Write-Host "------ -------------------------" -ForegroundColor Cyan

# Start aggregators & detectors
$results = @()
foreach ($Service in $Services) {
  if ($Service.Name -eq 'dashboard') { continue }
  $ok = Start-ManagedService -Svc $Service
  $results += @( @{ Name = $Service.Name; Healthy = $ok } )
}

# Start dashboard after aggregator is ready
$dashboardSvc = $Services | Where-Object { $_.Name -eq 'dashboard' }
if ($dashboardSvc) {
  Write-Host "[MENUNGGU aggregator sehat sebelum memulai dashboard...]" -ForegroundColor Cyan
  if ((Test-PortOpen -Port 3004) -and (Test-Healthy -Url 'http://localhost:3004/health')) {
    $ok = Start-ManagedService -Svc $dashboardSvc
    $results += @( @{ Name = 'dashboard'; Healthy = $ok } )
  } else {
    Write-Host "  -> Aggregator belum sehat. Dashboard tidak akan dimulai." -ForegroundColor Red
  }
}

# Final status
Write-Host "`n=== Status Akhir ===" -ForegroundColor Cyan
$allHealthy = $true
foreach ($Service in $Services) {
  $found = $results | Where-Object { $_['Name'] -eq $Service.Name }
  if ($found) {
    $healthy = $found[0]['Healthy']
  } else {
    $healthy = $false
  }
  if (-not $healthy) { $allHealthy = $false }
}
Show-Status -SvcList $Services

if ($allHealthy) {
  Write-Host ">>> SEMUA SERVICE SIAP. Dashboard: http://localhost:5173" -ForegroundColor Green
} else {
  Write-Host ">>> Tertunda: beberapa service belum sehat. Periksa log." -ForegroundColor Red
}

# Keep script alive if no action specified
if ($Action -eq 'Start') {
  Write-Host ">>> Script akan berjalan sampai dihentikan. Tekan Ctrl+C untuk berhenti." -ForegroundColor Yellow
  while ($true) { Start-Sleep -Seconds 5 }
}

