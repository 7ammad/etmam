// Test file for PR-Agent code review verification
// This file contains intentional issues for the AI to catch

function calculateTotal(items: any[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price; // Missing null check
  }
  return total;
}

// Unused variable
const unusedVar = "test";

// Missing type safety
function processData(data: any) {
  return data.map((x: any) => x.value);
}

// Potential security issue - no input validation
function getUserInput(input: string) {
  return eval(input); // Dangerous!
}

// Missing error handling
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}
