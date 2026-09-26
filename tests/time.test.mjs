import test from "node:test";
import assert from "node:assert/strict";

// The browser may run in any zone: the inputs must still use Zurich time.
process.env.TZ = "America/New_York";

const {
  addZurichWall,
  fromZurichInput,
  recurrence,
  toZurichInput,
  zurichHour,
  zurichMidnight,
  zurichOffset,
} = await import("../shared/time.ts");

const iso = (s) => new Date(s).toISOString();

test("date inputs read and write Zurich time, whatever the browser zone", () => {
  assert.equal(new Date(0).getTimezoneOffset() !== -60, true);
  assert.equal(fromZurichInput("2026-01-15T08:00"), iso("2026-01-15T07:00Z"));
  assert.equal(fromZurichInput("2026-07-15T08:00"), iso("2026-07-15T06:00Z"));
  assert.equal(toZurichInput("2026-01-15T07:00:00Z"), "2026-01-15T08:00");
  assert.equal(toZurichInput("2026-07-15T06:00:00Z"), "2026-07-15T08:00");
  assert.equal(toZurichInput("2026-07-15T22:30:00Z", "date"), "2026-07-16");
  assert.equal(toZurichInput("2026-07-15T22:30:00Z", "time"), "00:30");
  assert.equal(fromZurichInput("2026-07-16"), iso("2026-07-15T22:00Z"));
  assert.equal(fromZurichInput(""), "");
  assert.equal(fromZurichInput("pas une date"), "");
  assert.equal(toZurichInput(""), "");
  assert.equal(toZurichInput("n’importe quoi"), "");
});

test("spring change of hour, 29 March 2026", () => {
  assert.equal(zurichOffset(Date.parse("2026-03-29T00:59Z")), 3_600_000);
  assert.equal(zurichOffset(Date.parse("2026-03-29T01:00Z")), 7_200_000);
  assert.equal(fromZurichInput("2026-03-29T01:30"), iso("2026-03-29T00:30Z"));
  assert.equal(fromZurichInput("2026-03-29T03:30"), iso("2026-03-29T01:30Z"));
  // 02:30 does not exist: it moves forward by the gap, to 03:30.
  assert.equal(fromZurichInput("2026-03-29T02:30"), iso("2026-03-29T01:30Z"));
  assert.equal(toZurichInput("2026-03-29T00:59:00Z"), "2026-03-29T01:59");
  assert.equal(toZurichInput("2026-03-29T01:00:00Z"), "2026-03-29T03:00");
});

test("autumn change of hour, 25 October 2026", () => {
  // 02:30 happens twice: the first occurrence (summer time) is taken.
  assert.equal(fromZurichInput("2026-10-25T02:30"), iso("2026-10-25T00:30Z"));
  assert.equal(fromZurichInput("2026-10-25T03:30"), iso("2026-10-25T02:30Z"));
  assert.equal(toZurichInput("2026-10-25T00:30:00Z"), "2026-10-25T02:30");
  assert.equal(toZurichInput("2026-10-25T01:30:00Z"), "2026-10-25T02:30");
  assert.equal(zurichHour(Date.parse("2026-10-25T01:30Z")), 2);
  assert.equal(
    zurichMidnight(Date.parse("2026-10-25T12:00Z")),
    Date.parse("2026-10-24T22:00Z"),
  );
});

test("every minute of both change days survives a round trip", () => {
  for (const day of ["2026-03-29", "2026-10-25"]) {
    const start = Date.parse(`${day}T00:00Z`) - 3 * 3_600_000;
    for (let t = start; t < start + 30 * 3_600_000; t += 15 * 60_000) {
      const back = Date.parse(fromZurichInput(toZurichInput(t)));
      // Only the repeated autumn hour maps back to its first occurrence.
      assert.ok(
        back === t || back === t - 3_600_000,
        new Date(t).toISOString(),
      );
    }
  }
});

test("recurring meetings keep their wall-clock hour across DST", () => {
  const first = Date.parse(fromZurichInput("2026-03-27T08:00"));
  const daily = recurrence(first, 24, 4).map((t) => toZurichInput(t));
  assert.deepEqual(daily, [
    "2026-03-27T08:00",
    "2026-03-28T08:00",
    "2026-03-29T08:00",
    "2026-03-30T08:00",
  ]);
  const autumn = Date.parse(fromZurichInput("2026-10-24T08:00"));
  assert.deepEqual(
    recurrence(autumn, 24, 3).map((t) => toZurichInput(t)),
    ["2026-10-24T08:00", "2026-10-25T08:00", "2026-10-26T08:00"],
  );
  // 25 hours elapsed over the autumn change, 23 in spring.
  assert.equal(addZurichWall(autumn, 24 * 60) - autumn, 25 * 3_600_000);
  assert.equal(addZurichWall(first, 48 * 60) - first, 47 * 3_600_000);
  // A 2-hour rhythm through the spring night skips the missing hour.
  const night = Date.parse(fromZurichInput("2026-03-29T00:00"));
  assert.deepEqual(
    recurrence(night, 2, 3).map((t) => toZurichInput(t)),
    ["2026-03-29T00:00", "2026-03-29T03:00", "2026-03-29T04:00"],
  );
});
