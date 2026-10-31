// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.length > 0);

const txnRegistry = new Map();

for (const line of lines) {
  if (!line.trim()) continue;

  try {
    const event = JSON.parse(line);
    const id = event.txn_id;

    if (!id) continue;

    const status = event.status || "pending";
    const amount = Number(event.amount) || 0;
    const currentTs = event.ts ? new Date(event.ts).getTime() : 0;

    const existingTxn = txnRegistry.get(id);

    if (!existingTxn || currentTs >= existingTxn.ts) {
      txnRegistry.set(id, { status, amount, ts: currentTs });
    }
  } catch (error) {
    continue;
  }
}

for (const txn of txnRegistry.values()) {
  if (txn.status === "success") {
    total += txn.amount;
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
