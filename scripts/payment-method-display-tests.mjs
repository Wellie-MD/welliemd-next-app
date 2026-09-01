import { strict as assert } from "node:assert"
import { getMaskedCardLast4 } from "../src/utils/paymentMethodDisplay.ts"

const test = (name, run) => {
  run()
  console.log(`PASS ${name}`)
}

test("extracts the last four digits from a spaced masked card number", () => {
  assert.equal(getMaskedCardLast4("**** **** **** 4242"), "4242")
})

test("extracts the last four digits from a compact masked card number", () => {
  assert.equal(getMaskedCardLast4("****1111"), "1111")
})

test("accepts a value containing only the last four digits", () => {
  assert.equal(getMaskedCardLast4("0000"), "0000")
})

test("falls back when the masked card value is unavailable or invalid", () => {
  for (const value of [undefined, null, "", "****", "**** 123"]) {
    assert.equal(getMaskedCardLast4(value), "****")
  }
})

console.log("\nAll payment-method display tests passed.")
