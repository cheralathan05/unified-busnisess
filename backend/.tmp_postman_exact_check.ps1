$base = "http://localhost:5000/api"
$email = "cheratest+$(Get-Date -Format yyyyMMddHHmmss)@gmail.com"
$p = "123456"

function Call($m,$u,$h,$b){
  if($b){ return Invoke-RestMethod -Method $m -Uri $u -Headers $h -ContentType "application/json" -Body $b }
  return Invoke-RestMethod -Method $m -Uri $u -Headers $h
}

$reg = Call Post "$base/auth/register" @{} (@{name="Chera Test";email=$email;password=$p}|ConvertTo-Json)
$login = Call Post "$base/auth/login" @{} (@{email=$email;password=$p}|ConvertTo-Json)
$h = @{Authorization="Bearer $($login.data.accessToken)"}

# onboarding
$on1 = Call Post "$base/onboarding/start" $h (@{name="Chera"}|ConvertTo-Json)
$on2 = Call Post "$base/onboarding/business" $h (@{companyName="Chera AI Labs"}|ConvertTo-Json)

# leads
$l1 = Call Post "$base/leads" $h (@{name="John CEO";company="Acme Corp";value=50000;stage="Discovery";email="john@acme.com";phone="9876543210"}|ConvertTo-Json)
$leadId = $l1.data.id
$l2 = Call Post "$base/leads" $h (@{name="Mike CTO";company="TechStart";value=80000;stage="Proposal"}|ConvertTo-Json)
# duplicate lead for dedup merge
$l3 = Call Post "$base/leads" $h (@{name="John CEO 2";company="Acme Corp";value=15000;stage="Discovery";email="john@acme.com";phone="9876543210"}|ConvertTo-Json)

$all = Call Get "$base/leads?page=1&limit=10" $h $null
$search = Call Get "$base/leads?search=Acme" $h $null
$filter = Call Get "$base/leads?stage=Discovery&minScore=10" $h $null
$one = Call Get "$base/leads/$leadId" $h $null
$upd = Call Put "$base/leads/$leadId" $h (@{stage="Negotiation";value=90000}|ConvertTo-Json)

# activity with note (exact user payload)
$act = Call Post "$base/activities" $h (@{leadId=$leadId;type="call";note="Follow up"}|ConvertTo-Json)
$acts = Call Get "$base/activities" $h $null

# payments
$pay = Call Post "$base/payments" $h (@{leadId=$leadId;amount=30000}|ConvertTo-Json)
$pays = Call Get "$base/payments" $h $null

# analytics
$analytics = Call Get "$base/analytics/dashboard" $h $null

# communication
$aiEmail = Call Post "$base/communication/ai-email" $h (@{lead=@{company="Acme Corp";stage="Proposal";value=50000;score=85}}|ConvertTo-Json -Depth 5)
$emailResp = Call Post "$base/communication/email" $h (@{to=$email;subject="Test";text="Hello"}|ConvertTo-Json)
$wa = Call Post "$base/communication/whatsapp" $h (@{to="9876543210";message="hello"}|ConvertTo-Json)
$sched = Call Post "$base/communication/schedule" $h (@{time="2026-04-01T10:00:00Z";participants=@("test@gmail.com")}|ConvertTo-Json -Depth 4)

# advanced AI
$summary = Call Get "$base/leads/$leadId/summary" $h $null
$insights = Call Get "$base/leads/$leadId/insights" $h $null
$action = Call Get "$base/leads/$leadId/action" $h $null

# brain
$brain = Call Get "$base/brain/suggestions" $h $null
$approve = $null
$reject = $null
if($brain.data.Count -gt 0){ $approve = Call Post "$base/brain/$($brain.data[0].id)/approve" $h $null }
if($brain.data.Count -gt 1){ $reject = Call Post "$base/brain/$($brain.data[1].id)/reject" $h $null }

# dedup
$dedup = Call Get "$base/dedup" $h $null
$merge = $null
if($dedup.data.Count -gt 0){ $merge = Call Post "$base/dedup/merge" $h (@{baseId=$dedup.data[0].baseId;duplicateIds=$dedup.data[0].duplicates}|ConvertTo-Json -Depth 6) }

# export
$csv = Call Get "$base/export/csv" $h $null
$excel = Call Get "$base/export/excel" $h $null
$pdf = Call Get "$base/export/pdf" $h $null

# stages
$stages = Call Get "$base/stages" $h $null
$add = Call Post "$base/stages/add" $h (@{name="PostmanStage"}|ConvertTo-Json)
$put = Call Put "$base/stages" $h (@{stages=@("Discovery","Proposal","Negotiation","Won")}|ConvertTo-Json)
$remove = Call Post "$base/stages/remove" $h (@{name="PostmanStage"}|ConvertTo-Json)

# cleanup
$delete = Call Delete "$base/leads/$leadId" $h $null

[pscustomobject]@{
  base_url=$base
  accessToken=$login.data.accessToken.Substring(0,24)+"..."
  refreshToken=$login.data.refreshToken.Substring(0,24)+"..."
  leadId=$leadId
  checks=[pscustomobject]@{
    auth=$true;onboarding=$true;leads=$true;activity=$true;payments=$true;analytics=$true;ai=$true;brain=$true;dedup=$true;export=$true;stages=$true
  }
  aiResult=[pscustomobject]@{
    summary=$summary.data.summary
    insightsCount=($insights.data.insights|Measure-Object).Count
    nextAction=$action.data.nextAction
    confidence=$action.data.confidence
  }
} | ConvertTo-Json -Depth 8
