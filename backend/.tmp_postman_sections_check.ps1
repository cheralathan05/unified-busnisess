$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
$pass = "123456"

$register = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body (@{name="Chera Test";email=$email;password=$pass}|ConvertTo-Json)
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body (@{email=$email;password=$pass}|ConvertTo-Json)
$h = @{ Authorization = "Bearer $($login.data.accessToken)" }

$lead = Invoke-RestMethod -Method Post -Uri "$base/leads" -Headers $h -ContentType "application/json" -Body (@{name="John CEO";company="Acme Corp";value=50000;stage="Discovery";email="john@acme.com";phone="9876543210"}|ConvertTo-Json)
$leadId = $lead.data.id

$paymentCreate = Invoke-RestMethod -Method Post -Uri "$base/payments" -Headers $h -ContentType "application/json" -Body (@{leadId=$leadId;amount=30000}|ConvertTo-Json)
$paymentGet = Invoke-RestMethod -Method Get -Uri "$base/payments" -Headers $h
$analytics = Invoke-RestMethod -Method Get -Uri "$base/analytics/dashboard" -Headers $h

$aiEmail = Invoke-RestMethod -Method Post -Uri "$base/communication/ai-email" -Headers $h -ContentType "application/json" -Body (@{lead=@{company="Acme Corp";stage="Proposal";value=50000;score=85}}|ConvertTo-Json -Depth 5)
$emailSend = Invoke-RestMethod -Method Post -Uri "$base/communication/email" -Headers $h -ContentType "application/json" -Body (@{to=$email;subject="Follow up";text="Hello from CRM"}|ConvertTo-Json)
$waSend = Invoke-RestMethod -Method Post -Uri "$base/communication/whatsapp" -Headers $h -ContentType "application/json" -Body (@{to="9876543210";message="Hi from CRM"}|ConvertTo-Json)
$schedule = Invoke-RestMethod -Method Post -Uri "$base/communication/schedule" -Headers $h -ContentType "application/json" -Body (@{time="2026-04-01T10:00:00Z";participants=@("test@gmail.com")}|ConvertTo-Json -Depth 5)

$summary = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/summary" -Headers $h
$insights = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/insights" -Headers $h
$action = Invoke-RestMethod -Method Get -Uri "$base/leads/$leadId/action" -Headers $h

$brain = Invoke-RestMethod -Method Get -Uri "$base/brain/suggestions" -Headers $h
$approve = $null
$reject = $null
if ($brain.data.Count -gt 0) {
  $approve = Invoke-RestMethod -Method Post -Uri "$base/brain/$($brain.data[0].id)/approve" -Headers $h
}
if ($brain.data.Count -gt 1) {
  $reject = Invoke-RestMethod -Method Post -Uri "$base/brain/$($brain.data[1].id)/reject" -Headers $h
}

$dedup = Invoke-RestMethod -Method Get -Uri "$base/dedup" -Headers $h
$exportCsv = Invoke-RestMethod -Method Get -Uri "$base/export/csv" -Headers $h
$exportExcel = Invoke-RestMethod -Method Get -Uri "$base/export/excel" -Headers $h
$exportPdf = Invoke-RestMethod -Method Get -Uri "$base/export/pdf" -Headers $h

$stages = Invoke-RestMethod -Method Get -Uri "$base/stages" -Headers $h
$stageAdd = Invoke-RestMethod -Method Post -Uri "$base/stages/add" -Headers $h -ContentType "application/json" -Body (@{name="TmpStage"}|ConvertTo-Json)
$stagePut = Invoke-RestMethod -Method Put -Uri "$base/stages" -Headers $h -ContentType "application/json" -Body (@{stages=@("Discovery","Proposal","Negotiation","Won")}|ConvertTo-Json)
$stageRemove = Invoke-RestMethod -Method Post -Uri "$base/stages/remove" -Headers $h -ContentType "application/json" -Body (@{name="TmpStage"}|ConvertTo-Json)

[pscustomobject]@{
  base_url = $base
  leadId = $leadId
  accessToken = $login.data.accessToken.Substring(0,24)+"..."
  refreshToken = $login.data.refreshToken.Substring(0,24)+"..."
  checks = [pscustomobject]@{
    payments_create = $paymentCreate.success
    payments_get = $paymentGet.success
    analytics = $analytics.success
    ai_email = $aiEmail.success
    email = $emailSend.success
    whatsapp = $waSend.success
    schedule = $schedule.success
    summary = $summary.success
    insights = $insights.success
    action = $action.success
    brain_suggestions = $brain.success
    brain_approve = if($approve){$approve.success}else{$false}
    dedup_get = $dedup.success
    export_csv = $exportCsv.success
    export_excel = $exportExcel.success
    export_pdf = $exportPdf.success
    stages_get = $stages.success
    stages_add = $stageAdd.success
    stages_put = $stagePut.success
    stages_remove = $stageRemove.success
  }
  analytics_data = $analytics.data
  ai_email_sample = $aiEmail.data
} | ConvertTo-Json -Depth 10
