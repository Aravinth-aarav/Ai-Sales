$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOTI2Y2NlOWM2ODUxYjM5NWZlNjg2ZCIsImlhdCI6MTc4Nzk4ODc0NCwiZXhwIjoxNzkwNTgwNzQ0fQ.vQZLQ4lRXtY9bgi16CVMUUhNGcWy4TyIOKP0Lo8Ea-M"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

function Send-TestRequest($body) {
    try {
        $resp = Invoke-WebRequest -Method Post -Uri "http://localhost:5000/api/campaigns" -Headers $headers -Body $body -ErrorAction Stop
        return @{ "StatusCode" = $resp.StatusCode; "Content" = $resp.Content }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        return @{ "StatusCode" = $statusCode; "Content" = $content }
    }
}

Write-Host "`n--- Test Case 1: 20% discount (Should fail with 400 POLICY_VIOLATION) ---"
$tc1 = Send-TestRequest '{"title":"Test 20","type":"Discount","discount":"20% Off","marketingCopy":"test","durationDays":7}'
Write-Host "Status: $($tc1.StatusCode)"
Write-Host "Response: $($tc1.Content)"

Write-Host "`n--- Test Case 2: 15% discount (Should pass with 210/201 Success) ---"
$tc2 = Send-TestRequest '{"title":"Test 15","type":"Discount","discount":"15% Off","marketingCopy":"test","durationDays":7}'
Write-Host "Status: $($tc2.StatusCode)"
Write-Host "Response: $($tc2.Content)"

Write-Host "`n--- Test Case 3: 15.1% discount (Should fail with 400 POLICY_VIOLATION) ---"
$tc3 = Send-TestRequest '{"title":"Test 15.1","type":"Discount","discount":"15.1% Off","marketingCopy":"test","durationDays":7}'
Write-Host "Status: $($tc3.StatusCode)"
Write-Host "Response: $($tc3.Content)"

Write-Host "`n--- Test Case 4: -5% discount (Should fail with 400 POLICY_VIOLATION) ---"
$tc4 = Send-TestRequest '{"title":"Test -5","type":"Discount","discount":"-5% Off","marketingCopy":"test","durationDays":7}'
Write-Host "Status: $($tc4.StatusCode)"
Write-Host "Response: $($tc4.Content)"

Write-Host "`n--- Test Case 5: 31-day campaign duration (Should fail with 400 POLICY_VIOLATION) ---"
$tc5 = Send-TestRequest '{"title":"Test 31 days","type":"Discount","discount":"10% Off","marketingCopy":"test","durationDays":31}'
Write-Host "Status: $($tc5.StatusCode)"
Write-Host "Response: $($tc5.Content)"

Write-Host "`n--- Test Case 6: 30-day campaign duration (Should pass with 210/201 Success) ---"
$tc6 = Send-TestRequest '{"title":"Test 30 days","type":"Discount","discount":"10% Off","marketingCopy":"test","durationDays":30}'
Write-Host "Status: $($tc6.StatusCode)"
Write-Host "Response: $($tc6.Content)"
