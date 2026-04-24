$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="Chera Test";email=$email;password="123456"}|ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$email;password="123456"}|ConvertTo-Json)
$h = @{Authorization="Bearer $($login.data.accessToken)"}
$l1 = Invoke-RestMethod -Method Post -Uri "$base/leads" -Headers $h -ContentType "application/json" -Body (@{name="Dup A";company="Acme Corp";value=10000;stage="Discovery";email="dup@acme.com";phone="1111111111"}|ConvertTo-Json)
$l2 = Invoke-RestMethod -Method Post -Uri "$base/leads" -Headers $h -ContentType "application/json" -Body (@{name="Dup B";company="Acme Corp";value=15000;stage="Discovery";email="dup@acme.com";phone="1111111111"}|ConvertTo-Json)
$d = Invoke-RestMethod -Method Get -Uri "$base/dedup" -Headers $h
$grp = $d.data[0]
$m1 = Invoke-RestMethod -Method Post -Uri "$base/dedup/merge" -Headers $h -ContentType "application/json" -Body (@{baseId=$grp.baseId;duplicateIds=$grp.duplicates}|ConvertTo-Json -Depth 5)
$m2 = Invoke-RestMethod -Method Post -Uri "$base/dedup/merge" -Headers $h -ContentType "application/json" -Body (@{baseId=$grp.baseId;duplicates=@()}|ConvertTo-Json -Depth 5)
[pscustomobject]@{dedupGetCount=$d.data.Count;mergeWithDuplicateIds=$m1.success;mergeEmptyStatusExpected400=$m2.success} | ConvertTo-Json
