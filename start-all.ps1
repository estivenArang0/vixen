param(
    [switch]$SkipInfra
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $repoRoot 'frontend'

function Start-CommandProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$Arguments
    )

    $logDir = Join-Path $repoRoot '.logs'
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $logFile = Join-Path $logDir "$Name.log"

    $process = Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "cd /d `"$WorkingDirectory`" && $Command $Arguments") -PassThru -WindowStyle Hidden
    $process.Id | Out-File -FilePath (Join-Path $logDir "$Name.pid") -Encoding ascii
    Write-Host "Started $Name (PID $($process.Id))."
}

Set-Location $repoRoot

if (-not $SkipInfra) {
    Write-Host 'Starting infrastructure with Docker...'
    docker compose up -d mongodb redis elasticsearch
}

Write-Host 'Starting frontend...'
Start-CommandProcess -Name 'frontend' -WorkingDirectory $frontendDir -Command 'npm' -Arguments 'run dev -- --host 0.0.0.0'

Write-Host 'Starting backend gateway...'
Start-CommandProcess -Name 'backend' -WorkingDirectory $repoRoot -Command 'mvn' -Arguments 'spring-boot:run -pl api-gateway -am'

Write-Host ''
Write-Host 'Everything is starting.'
Write-Host 'Frontend: http://localhost:3000'
Write-Host 'API Gateway: http://localhost:8080'
