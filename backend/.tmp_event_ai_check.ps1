$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="Chera Test";email=$email;password="123456"}|ConvertTo-Json) | Out-Null
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$email;password="123456"}|ConvertTo-Json)
$h = @{Authorization="Bearer $($login.data.accessToken)"}
$lead = Invoke-RestMethod -Method Post -Uri "$base/leads" -Headers $h -ContentType "application/json" -Body (@{name="Event Check";company="Acme";value=60000;stage="Proposal";email="x@acme.com";phone="9999999999"}|ConvertTo-Json)
$leadId = $lead.data.id
$before = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/action" -Headers $h
Invoke-RestMethod -Method Post -Uri "$base/activities" -Headers $h -ContentType "application/json" -Body (@{leadId=$leadId;type="call";text="followup"}|ConvertTo-Json) | Out-Null
Invoke-RestMethod -Method Post -Uri "$base/payments" -Headers $h -ContentType "application/json" -Body (@{leadId=$leadId;amount=12000}|ConvertTo-Json) | Out-Null
Start-Sleep -Seconds 1
$afterAction = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/action" -Headers $h
$afterSummary = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/summary" -Headers $h
$afterInsights = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/insights" -Headers $h
[pscustomobject]@{
 leadId=$leadId
 beforeAction=$before.data.nextAction
 afterAction=$afterAction.data.nextAction
 afterConfidence=$afterAction.data.confidence
 afterSummary=$afterSummary.data.summary
 insightsCount=($afterInsights.data.insights | Measure-Object).Count
} | ConvertTo-Json -Depth 6
