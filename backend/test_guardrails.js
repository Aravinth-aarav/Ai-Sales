const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOTI2Y2NlOWM2ODUxYjM5NWZlNjg2ZCIsImlhdCI6MTc4Nzk4ODc0NCwiZXhwIjoxNzkwNTgwNzQ0fQ.vQZLQ4lRXtY9bgi16CVMUUhNGcWy4TyIOKP0Lo8Ea-M";

async function runTest(name, payload) {
  console.log(`\n--- ${name} ---`);
  try {
    const res = await fetch("http://localhost:5000/api/campaigns", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const json = await res.json();
    console.log(`Status: ${status}`);
    console.log(`Response:`, JSON.stringify(json, null, 2));
  } catch (error) {
    console.error(`Failed to send request:`, error.message);
  }
}

async function startTests() {
  // Test Case 1: 20% discount (Should fail)
  await runTest("Test Case 1: 20% discount (Should fail with 400 POLICY_VIOLATION)", {
    title: "Test 20",
    type: "Discount",
    discount: "20% Off",
    marketingCopy: "test",
    durationDays: 7
  });

  // Test Case 2: 15% discount (Should pass)
  await runTest("Test Case 2: 15% discount (Should pass with 201 Success)", {
    title: "Test 15",
    type: "Discount",
    discount: "15% Off",
    marketingCopy: "test",
    durationDays: 7
  });

  // Test Case 3: 15.1% discount (Should fail)
  await runTest("Test Case 3: 15.1% discount (Should fail with 400 POLICY_VIOLATION)", {
    title: "Test 15.1",
    type: "Discount",
    discount: "15.1% Off",
    marketingCopy: "test",
    durationDays: 7
  });

  // Test Case 4: -5% discount (Should fail)
  await runTest("Test Case 4: -5% discount (Should fail with 400 POLICY_VIOLATION)", {
    title: "Test -5",
    type: "Discount",
    discount: "-5% Off",
    marketingCopy: "test",
    durationDays: 7
  });

  // Test Case 5: 31-day campaign duration (Should fail)
  await runTest("Test Case 5: 31-day duration (Should fail with 400 POLICY_VIOLATION)", {
    title: "Test 31 days",
    type: "Discount",
    discount: "10% Off",
    marketingCopy: "test",
    durationDays: 31
  });

  // Test Case 6: 30-day campaign duration (Should pass)
  await runTest("Test Case 6: 30-day duration (Should pass with 201 Success)", {
    title: "Test 30 days",
    type: "Discount",
    discount: "10% Off",
    marketingCopy: "test",
    durationDays: 30
  });
}

startTests();
