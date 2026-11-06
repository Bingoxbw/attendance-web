# Forward local 5433 -> server Postgres 5432 (keeps Neon out of local dev).
# Keep this window open while developing.
param(
  [string]$Server = "root@106.14.96.199",
  [int]$LocalPort = 5433
)

Write-Host "Tunnel: 127.0.0.1:$LocalPort -> ${Server}:127.0.0.1:5432"
Write-Host "Keep this window open. Ctrl+C to stop."
ssh -N -L "${LocalPort}:127.0.0.1:5432" $Server
