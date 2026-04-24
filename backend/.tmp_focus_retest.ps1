$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
$reg = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="Chera Test";email=$email;password="123456"}|ConvertTo-Json)
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$email;password="123456"}|ConvertTo-Json)
$h = @{Authorization="Bearer $($login.data.accessToken)"}
$on2 = Invoke-RestMethod -Method Post -Uri "$base/onboarding/business" -Headers $h -ContentType "application/json" -Body (@{companyName="Chera AI Labs"}|ConvertTo-Json)
$emailResp = Invoke-RestMethod -Method Post -Uri "$base/communication/email" -Headers $h -ContentType "application/json" -Body (@{to=$email;subject="Test";text="Hello"}|ConvertTo-Json)
$sched = Invoke-RestMethod -Method Post -Uri "$base/communication/schedule" -Headers $h -ContentType "application/json" -Body (@{date=(Get-Date).AddDays(1).ToString("o");participants=@("ops@example.com")}|ConvertTo-Json -Depth 5)
[pscustomobject]@{businessOk=$on2.success;emailOk=$emailResp.success;scheduleOk=$sched.success} | ConvertTo-Json
