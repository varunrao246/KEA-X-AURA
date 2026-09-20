import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "./session";

describe("session cookie", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ uid: "u-aarav", role: "student" });
    const payload = await verifySession(token);
    expect(payload).toMatchObject({ uid: "u-aarav", role: "student" });
  });

  it("rejects a tampered role", async () => {
    const token = await signSession({ uid: "u-aarav", role: "student" });
    const [, sig] = token.split(".");
    const forged = btoa(JSON.stringify({ uid: "u-aarav", role: "facilitator", exp: 9999999999 }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(await verifySession(`${forged}.${sig}`)).toBeNull();
  });

  it("rejects expired and empty tokens", async () => {
    expect(await verifySession(await signSession({ uid: "u", role: "student" }, -10))).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("garbage")).toBeNull();
  });
});
