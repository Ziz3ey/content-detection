param(
  [string[]]$Ports = @("3000", "3001", "3002", "3003", "3004", "5173", "5174")
)

foreach ($port in $Ports) {
  $line = netstat -ano 2>$null | select-string ":$port" | head -1
  if ($line) {
    $parts = $line -split "\s+"
    $localAddr = $parts[0]
    $state = $parts[3]
    $pid = $parts[6]
    if ($state -eq "LISTENING") {
      $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
      $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
      $procPath = if ($proc) { $proc.Path } else { "Unknown" }
      Write-Host "Port ${port}: LISTENING (PID=$pid, Name=$procName, Path=$procPath)"
    } else {
      Write-Host "Port ${port}: $state (PID=$pid)"
    }
  } else {
    Write-Host "Port ${port}: CLOSED"
  }
}
