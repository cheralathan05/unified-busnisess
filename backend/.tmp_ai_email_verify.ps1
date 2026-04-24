$base="http://localhost:5000/api"
$u="cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="AI Test";email=$u;password="123456"}|ConvertTo-Json) | Out-Null
$l=Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$u;password="123456"}|ConvertTo-Json)
$h=@{Authorization="Bearer $($l.data.accessToken)"}
$r=Invoke-RestMethod -Method Post -Uri "$base/communication/ai-email" -Headers $h -ContentType "application/json" -Body (@{lead=@{company="Acme Corp";stage="Proposal";value=50000;score=85}}|ConvertTo-Json -Depth 6)
$r | ConvertTo-Json -Depth 6
