// Self-check for src/lib/timecode.ts. Run: node scripts/check-timecode.ts
import assert from "node:assert/strict";
import { formatSeconds, formatTimecode, parseTime, timecodeParts } from "../src/lib/timecode.ts";

assert.deepEqual(timecodeParts(12.5), ["00:00:", "12:15"]);
assert.deepEqual(timecodeParts(83), ["00:", "01:23:00"]);
assert.equal(formatTimecode(3600 + 1 / 30), "01:00:00:01");
assert.equal(formatSeconds(12.46), "0:12.5");
assert.equal(formatSeconds(62), "1:02.0");
assert.equal(parseTime("1:23", 0), 83);
assert.equal(parseTime("83", 0), 83);
assert.equal(parseTime("1:23:15", 0), 83.5);
assert.equal(parseTime("00:01:23:15", 0), 83.5);
assert.equal(parseTime("+2s", 10), 12);
assert.equal(parseTime("-15f", 10), 9.5);
assert.equal(parseTime("-30", 10), 0);
assert.equal(parseTime("abc", 10), null);
console.log("timecode ok");
