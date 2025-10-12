# Run npm audit and print suggested fixes (PowerShell helper)
npm audit | Out-String | Write-Output
Write-Output "Review the audit report and run 'npm audit fix' or 'npm audit fix --force' as needed. Do not run --force in production without testing."
