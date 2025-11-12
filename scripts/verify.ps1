Write-Host 'Verifying Archimedes web…'
pnpm -C app/web lint
pnpm -C app/web type-check
Write-Host 'OK'
