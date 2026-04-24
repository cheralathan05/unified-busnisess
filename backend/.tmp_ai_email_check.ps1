$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="Chera Test";email=$email;password="123456"}|ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$email;password="123456"}|ConvertTo-Json)
$h = @{Authorization="Bearer $($login.data.accessToken)"}
$r = Invoke-RestMethod -Method Post -Uri "$base/communication/ai-email" -Headers $h -ContentType "application/json" -Body (@{lead=@{company="Acme Corp";stage="Proposal";value=50000;score=85}}|ConvertTo-Json -Depth 5)
$r | ConvertTo-Json -Depth 5
