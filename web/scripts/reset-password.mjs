// sets the email and password login for one user, since the app has no reset email
// run from web/: node --env-file=.env scripts/reset-password.mjs
import { createInterface } from "node:readline";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

// matches better auth's default minPasswordLength
const MIN_LENGTH = 8;

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  let muted = false;
  // readline redraws the line on each keystroke; muting after the prompt hides the typed password
  rl._writeToOutput = (text) => {
    if (!muted) rl.output.write(text);
  };
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
    muted = hidden;
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!process.env.DATABASE_URL)
  fail("DATABASE_URL is not set, run with --env-file=.env");
const sql = neon(process.env.DATABASE_URL);

const email = (await ask("Email: ")).trim();
const [user] = await sql`
  select u.id, a.id as credential_id from "user" u
  left join account a on a.user_id = u.id and a.provider_id = 'credential'
  where lower(u.email) = lower(${email})
`;
if (!user) fail(`no user found for ${email}`);

const password = await ask("New password: ", { hidden: true });
if (password.length < MIN_LENGTH) {
  fail(`password must be at least ${MIN_LENGTH} characters`);
}
const confirm = await ask("Confirm new password: ", { hidden: true });
if (password !== confirm) fail("passwords don't match");

const hash = await hashPassword(password);
if (user.credential_id) {
  await sql`
    update account set password = ${hash}, updated_at = now()
    where id = ${user.credential_id}
  `;
  console.log(`password updated for ${email}`);
} else {
  // users who only signed in with google have no credential account; better auth keys it by user id
  await sql`
    insert into account (account_id, provider_id, user_id, password, updated_at)
    values (${user.id}, 'credential', ${user.id}, ${hash}, now())
  `;
  console.log(`password login added for ${email}`);
}
