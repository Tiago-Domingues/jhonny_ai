import { readFileSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const register = readFileSync(path.resolve(__dirname, "../src/app/api/auth/register/route.ts"), "utf8");
  const login = readFileSync(path.resolve(__dirname, "../src/app/api/auth/login/route.ts"), "utf8");
  assert(register.includes("registerCredentialsCustomer"), "register creates the account first");
  assert(register.includes("setSessionCookie"), "register lands in a session");
  assert(!register.includes("sendEmailVerificationEmail"), "register does not wait on welcome/verification mail");
  assert(login.includes("loginCustomer"), "login uses credentials");
  assert(login.includes("setSessionCookie"), "login lands in a session");

  const base = (process.env.LAUNCH_TEST_BASE_URL || process.env.AUTH_TEST_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    console.log("account auth HTTP skipped (set LAUNCH_TEST_BASE_URL to exercise register/login live)");
    return;
  }

  const stamp = Date.now().toString(36);
  const email = `auth-${stamp}@example.com`;
  const username = `auth${stamp}`.slice(0, 32);
  const password = "surflegend1";

  const registerRes = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, username, password }),
  });
  const registerBody = await registerRes.json().catch(() => ({}));
  assert(registerRes.ok, `register failed ${registerRes.status} ${JSON.stringify(registerBody)}`);
  assert(registerBody.user?.email === email, "register returns the new user");
  const registerCookie = registerRes.headers.get("set-cookie") || "";
  assert(registerCookie.includes("jss_session"), "register sets a session cookie");

  const meAfterRegister = await fetch(`${base}/api/auth/me`, {
    headers: { cookie: registerCookie },
  });
  const meAfterRegisterBody = await meAfterRegister.json().catch(() => ({}));
  assert(meAfterRegister.ok, `me after register failed ${meAfterRegister.status}`);
  assert(meAfterRegisterBody.user?.email === email, "session after register reaches /api/auth/me");

  const logout = await fetch(`${base}/api/auth/logout`, {
    method: "POST",
    headers: { cookie: registerCookie, Origin: base },
  }).catch(() => null);

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ emailOrUsername: email, password }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  assert(loginRes.ok, `login failed ${loginRes.status} ${JSON.stringify(loginBody)}`);
  const loginCookie = loginRes.headers.get("set-cookie") || "";
  assert(loginCookie.includes("jss_session"), "login sets a session cookie");

  const meAfterLogin = await fetch(`${base}/api/auth/me`, {
    headers: { cookie: loginCookie },
  });
  const meAfterLoginBody = await meAfterLogin.json().catch(() => ({}));
  assert(meAfterLogin.ok, `me after login failed ${meAfterLogin.status}`);
  assert(meAfterLoginBody.user?.email === email, "session after login reaches /api/auth/me");

  const dup = await fetch(`${base}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ email, username: `${username}2`, password }),
  });
  const dupBody = await dup.json().catch(() => ({}));
  assert(dup.status === 400, `duplicate register should be 400, got ${dup.status}`);
  assert(
    String(dupBody.message || "").includes("já está registado"),
    `duplicate register uses PT message, got ${JSON.stringify(dupBody)}`
  );

  const badLogin = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ emailOrUsername: email, password: "wrong-password" }),
  });
  const badLoginBody = await badLogin.json().catch(() => ({}));
  assert(badLogin.status === 401, `bad login should be 401, got ${badLogin.status}`);
  assert(
    String(badLoginBody.message || "").includes("inválidos"),
    `bad login uses PT message, got ${JSON.stringify(badLoginBody)}`
  );

  void logout;
  console.log("account auth HTTP ok");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
