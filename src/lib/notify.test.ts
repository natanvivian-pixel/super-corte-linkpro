import { test } from "node:test";
import assert from "node:assert/strict";
import { recipientsFor } from "./notify.functions";
test("Júnior agenda notifies Júnior and Natan", () => assert.deepEqual(recipientsFor("JUNIOR").sort(), ["juniorjosias2018@gmail.com", "natanvivian39@gmail.com"]));
test("Douglas agenda notifies Douglas and Natan", () => assert.deepEqual(recipientsFor("DOUGLAS").sort(), ["douglasmachadodigao@gmail.com", "natanvivian39@gmail.com"]));
