import { userInitials } from "../src/lib/userInitials";

const cases: Array<{ input: Parameters<typeof userInitials>[0]; expected: string }> = [
  { input: { fullName: "Tiago Domingues" }, expected: "TD" },
  { input: { fullName: "  maria   joao   silva " }, expected: "MS" },
  { input: { fullName: "Tiago" }, expected: "T" },
  { input: { username: "tiagodomingues" }, expected: "T" },
  { input: { email: "ada@example.com" }, expected: "A" },
  { input: {}, expected: "?" },
];

let failed = 0;
for (const test of cases) {
  const got = userInitials(test.input);
  if (got !== test.expected) {
    failed += 1;
    console.error(`FAIL ${JSON.stringify(test.input)} → ${got} (expected ${test.expected})`);
  } else {
    console.log(`ok ${JSON.stringify(test.input)} → ${got}`);
  }
}

if (failed) {
  process.exit(1);
}
console.log("userInitials tests passed");
