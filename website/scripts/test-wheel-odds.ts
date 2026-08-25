/**
 * Prize wheel odds, layout and calendar-month boundaries.
 *
 * Odds are the part of this feature a screenshot cannot show, so they get a
 * real test: a wheel that pays 20% more often than intended is expensive, and
 * one that pays it less often is a broken promise.
 *
 * Run: cd website && npm run test:wheel-odds
 */
import {
  PRIZE_WEIGHTS,
  WHEEL_LAYOUT,
  currentPeriodKey,
  drawPrize,
  generateWheelCode,
  isWheelCode,
  periodExpiresAt,
  segmentForPercent,
} from "../src/lib/ecommerce/prizeWheel";

let checks = 0;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
  checks += 1;
}

function testLayoutMatchesWeights() {
  const counts = WHEEL_LAYOUT.reduce<Record<number, number>>((acc, percent) => {
    acc[percent] = (acc[percent] || 0) + 1;
    return acc;
  }, {});

  for (const [percent, weight] of Object.entries(PRIZE_WEIGHTS)) {
    const share = (counts[Number(percent)] || 0) / WHEEL_LAYOUT.length;
    assert(
      Math.abs(share - weight) < 1e-9,
      `wedge share for ${percent}% is ${share}, expected ${weight} — the visible wheel must not contradict the real odds`
    );
  }
}

function testDrawConvergesOnWeights() {
  const samples = 200_000;
  const counts: Record<number, number> = { 5: 0, 10: 0, 20: 0 };

  for (let i = 0; i < samples; i += 1) {
    const { percent, segmentIndex } = drawPrize();
    counts[percent] += 1;
    assert(
      WHEEL_LAYOUT[segmentIndex] === percent,
      `segment ${segmentIndex} shows ${WHEEL_LAYOUT[segmentIndex]}% but the prize was ${percent}%`
    );
  }

  for (const [percent, weight] of Object.entries(PRIZE_WEIGHTS)) {
    const observed = counts[Number(percent)] / samples;
    assert(
      Math.abs(observed - weight) < 0.01,
      `${percent}% came up ${(observed * 100).toFixed(2)}% of the time, expected ${(weight * 100).toFixed(0)}%`
    );
  }

  console.log(
    "  odds:",
    Object.entries(counts)
      .map(([percent, count]) => `${percent}%=${((count / samples) * 100).toFixed(2)}%`)
      .join("  ")
  );
}

function testDrawIsDeterministicWithSeededRandom() {
  // Roll below 0.4 must land on 5%, the first bucket.
  assert(drawPrize(() => 0.1).percent === 5, "a 0.1 roll should award 5%");
  // 0.4-0.9 is the 10% bucket.
  assert(drawPrize(() => 0.5).percent === 10, "a 0.5 roll should award 10%");
  // Above 0.9 is the jackpot.
  assert(drawPrize(() => 0.95).percent === 20, "a 0.95 roll should award 20%");
  // Guard the floating-point upper edge.
  assert(drawPrize(() => 0.999999).percent === 20, "a roll just under 1 should still award 20%");
}

function testSegmentForPercent() {
  for (const percent of [5, 10, 20]) {
    assert(
      WHEEL_LAYOUT[segmentForPercent(percent)] === percent,
      `segmentForPercent(${percent}) pointed at a wedge showing something else`
    );
  }
}

function testPeriodBoundaries() {
  // Portugal runs UTC+1 in summer, so 23:30 UTC on 31 July is already August
  // in store time. Bucketing in UTC would wrongly bill that spin to July.
  assert(
    currentPeriodKey(new Date("2026-07-31T23:30:00Z")) === "2026-08",
    "a summer-time spin just after local midnight should belong to the new month"
  );
  assert(
    currentPeriodKey(new Date("2026-01-31T23:30:00Z")) === "2026-01",
    "in winter Lisbon matches UTC, so 23:30 on the 31st is still January"
  );
  assert(
    currentPeriodKey(new Date("2026-03-15T12:00:00Z")) === "2026-03",
    "mid-month should bucket to that month"
  );

  const july = periodExpiresAt("2026-07");
  assert(
    july.toISOString() === "2026-07-31T22:59:59.999Z",
    `July expiry should be local 23:59:59.999 (22:59:59.999Z in summer), got ${july.toISOString()}`
  );
  const january = periodExpiresAt("2026-01");
  assert(
    january.toISOString() === "2026-01-31T23:59:59.999Z",
    `January expiry should be 23:59:59.999Z, got ${january.toISOString()}`
  );
  const december = periodExpiresAt("2026-12");
  assert(
    december.toISOString() === "2026-12-31T23:59:59.999Z",
    `December must roll into the next year, got ${december.toISOString()}`
  );
}

function testCodes() {
  const codes = new Set<string>();
  for (let i = 0; i < 5_000; i += 1) codes.add(generateWheelCode(20));
  assert(codes.size === 5_000, `expected 5000 distinct codes, got ${codes.size}`);

  const sample = generateWheelCode(5);
  assert(sample.startsWith("RODA5-"), `unexpected code shape: ${sample}`);
  assert(isWheelCode(sample), `isWheelCode rejected its own output: ${sample}`);
  assert(!isWheelCode("JHONNY10"), "the fixed welcome coupon is not a wheel code");
  assert(!isWheelCode("RODA10"), "the retired fixed wheel coupon is not a per-spin code");
  // 0/O/1/I are excluded so codes survive being read aloud or retyped.
  assert(
    !/[01OI]/.test(sample.split("-")[1]!),
    `ambiguous characters leaked into ${sample}`
  );
}

function main() {
  testLayoutMatchesWeights();
  testDrawConvergesOnWeights();
  testDrawIsDeterministicWithSeededRandom();
  testSegmentForPercent();
  testPeriodBoundaries();
  testCodes();
  console.log(`\nPrize wheel checks passed (${checks} assertions).`);
}

main();
