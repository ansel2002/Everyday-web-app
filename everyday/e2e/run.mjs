// End-to-end test of every feature, in a real headless Edge or Chrome, against the
// development fake cloud. No test framework or downloads: Node + the browser's DevTools protocol.
//
//   npm run dev:fake          (in one terminal, serves http://localhost:5174)
//   npm run test:e2e          (in another)
//
// Every step checks behaviour; any page error or console error fails the run.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const BASE = process.env.E2E_URL ?? 'http://localhost:5174/';
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const browserPath = process.env.E2E_BROWSER ?? BROWSERS.find((p) => existsSync(p));
if (!browserPath) throw new Error('No Edge or Chrome found. Set E2E_BROWSER to its path.');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9500 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(path.join(os.tmpdir(), 'everyday-e2e-'));
const browser = spawn(browserPath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const stopBrowser = () => {
  if (process.platform === 'win32') spawn('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
  else browser.kill('SIGKILL');
};

// ---------- DevTools protocol ----------
let targets = [];
for (let i = 0; i < 60 && !targets.some((t) => t.type === 'page'); i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  } catch {
    await sleep(200);
  }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let nextId = 1;
const pending = new Map();
const pageErrors = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  // Only errors from the app's own code count; browsers sometimes inject scripts of their own.
  const fromApp = (url, frames = []) => [url, ...frames.map((f) => f.url)].some((u) => u && u.startsWith(new URL(BASE).origin));
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    if (fromApp(d.url, d.stackTrace?.callFrames)) pageErrors.push(d.exception?.description ?? d.text);
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error' && fromApp('', msg.params.stackTrace?.callFrames)) {
    pageErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  }
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, (msg) => (msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${HELPERS}; ${expression} })()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description?.split('\n')[0] ?? r.exceptionDetails.text);
  return r.result.value;
};

// Helpers available inside every evaluate().
const HELPERS = `
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const waitFor = async (sel, ms = 15000) => { for (let i = 0; i < ms / 100; i++) { const el = $(sel); if (el) return el; await sleep(100); } throw new Error('Timed out waiting for ' + sel + ' (on: ' + ($('h1')?.textContent ?? 'no h1') + ')'); };
  const waitUntil = async (fn, what, ms = 15000) => { for (let i = 0; i < ms / 100; i++) { if (await fn()) return; await sleep(100); } throw new Error('Timed out: ' + what); };
  const byText = (text, sel = 'button, a') => $$(sel).find((el) => el.textContent.trim().startsWith(text) && el.offsetParent !== null);
  const click = async (text, sel) => { const el = byText(text, sel); if (!el) throw new Error('No visible control: ' + text); el.click(); await sleep(250); };
  const type = (sel, value) => { const el = $(sel); const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement; Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); };
  const go = async (hash) => { location.hash = hash; await sleep(450); };
  const h1 = () => $('main h1')?.textContent ?? $('h1')?.textContent;
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
`;

async function reload() {
  await send('Page.reload', { ignoreCache: true });
  await sleep(2500);
}

async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
}

// ---------- Test runner ----------
const results = [];
async function step(name, body) {
  const errorsBefore = pageErrors.length;
  try {
    await body();
    const newErrors = pageErrors.slice(errorsBefore);
    if (newErrors.length) throw new Error('Console/page error: ' + newErrors.join(' | ').slice(0, 300));
    results.push({ name, ok: true });
    console.log(`  ok   ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`  FAIL ${name}\n       ${error.message}`);
  }
}

const PASS = 'quiet e2e passphrase ' + Math.random().toString(36).slice(2, 8);
const PIN = String(100000 + Math.floor(Math.random() * 900000));

await send('Runtime.enable');
await send('Page.enable');
await viewport(390, 844);
await send('Page.navigate', { url: BASE });
await sleep(2500);
await evaluate(`localStorage.clear(); return 1`);
await reload();

console.log(`Everyday end-to-end test at ${BASE}`);

await step('Sign-in screen offers Google and an email link', async () => {
  await evaluate(`
    await waitFor('#email');
    assert(byText('Continue with Google'), 'No Google button');
    assert(byText('Email me a sign-in link'), 'No email button');
    type('#email', 'not-an-email'); await click('Email me a sign-in link');
    assert($('#email-message').textContent.includes('does not look complete'), 'No message for a bad email');
  `);
});

await step('Google sign-in leads to choosing a passphrase, with checks', async () => {
  await evaluate(`
    await click('Continue with Google');
    await waitFor('#passphrase');
    assert(h1() === 'Choose a passphrase', 'Expected Choose a passphrase, got ' + h1());
    type('#passphrase', 'short'); await click('Save passphrase');
    assert($('.gate [role=status]').textContent.includes('at least 10'), 'No short-passphrase message');
    type('#passphrase', ${JSON.stringify(PASS)}); type('#passphrase-again', 'something else entirely');
    await click('Save passphrase');
    assert($('.gate [role=status]').textContent.includes('do not match'), 'No mismatch message');
    type('#passphrase-again', ${JSON.stringify(PASS)}); await click('Save passphrase');
    await waitFor('.shell', 20000);
    assert(h1().includes('Everyday'), 'Not on Today after setup');
  `);
});

await step('Today: lesson card, mark done and undo, streak', async () => {
  await evaluate(`
    await go('#/today');
    assert($('.lesson-card__meta').textContent.startsWith('Lesson 1 of 8'), 'Fresh account should start at lesson 1');
    assert($('.streak__value').textContent === '0', 'Streak should start at 0');
    await click('Mark lesson done');
    assert(byText('Lesson done'), 'Button did not change to Lesson done');
    await waitUntil(() => $('.streak__value').textContent === '1', 'streak 1 after a lesson');
    await click('Lesson done');
    assert(byText('Mark lesson done'), 'Undo did not work');
    await click('Mark lesson done');
  `);
});

await step('Today: mood check-in selects and clears', async () => {
  await evaluate(`
    const mood = (label) => $$('.mood-option').find((b) => b.textContent === label);
    mood('Good').click(); await sleep(200);
    assert(mood('Good').getAttribute('aria-pressed') === 'true', 'Good not selected');
    mood('Good').click(); await sleep(200);
    assert(mood('Good').getAttribute('aria-pressed') === 'false', 'Good not cleared');
    mood('Bright').click(); await sleep(200);
    assert($$('.mood-option[aria-pressed=true]').length === 1, 'More than one mood selected');
  `);
});

await step('Lessons: list, statuses, month picker, lesson detail', async () => {
  await evaluate(`
    await go('#/lessons');
    assert($$('.lesson-item').length === 8, 'Expected 8 lessons');
    assert($('.lesson-item--done'), 'Lesson 1 should be Done');
    assert($('.month-card__count').textContent === '1 of 8 done', 'Month count wrong: ' + $('.month-card__count').textContent);
    const select = $('#month-select'); select.value = '1'; select.dispatchEvent(new Event('change', { bubbles: true })); await sleep(300);
    assert($('.month-card__theme').textContent === 'Fresh starts', 'January theme wrong');
    $$('.lesson-item')[2].click(); await sleep(450);
    assert($('.lesson-card__meta').textContent.includes('January'), 'Lesson detail missing month');
    await click('Mark lesson done');
    await go('#/lessons');
    assert($('.month-card__count').textContent === '1 of 8 done', 'January count wrong');
  `);
});

await step('Lesson insights: chart and year total', async () => {
  await evaluate(`
    await go('#/lessons/insights');
    assert($('.year-card__total').textContent.startsWith('2 of 96'), 'Year total wrong: ' + $('.year-card__total').textContent);
    assert($$('.bar-chart__col').length === 12, 'Chart should have 12 months');
    assert($('.chart-card ul.sr-only').textContent.includes('January: 1 of 8'), 'Screen-reader list missing');
  `);
});

await step('Habits: empty state, idea chip, add, done, undo, streak', async () => {
  await evaluate(`
    await go('#/habits');
    assert(h1() === 'Habits' && $('.habits-empty'), 'Expected the empty state');
    await click('Walk for ten minutes', '.habit-ideas a');
    await waitFor('#habit-name');
    assert($('#habit-name').value === 'Walk for ten minutes', 'Idea did not pre-fill');
    type('#habit-name', ''); await click('Save habit');
    assert($('.add-habit__error').textContent.includes('short name'), 'No empty-name message');
    type('#habit-name', 'Drink water');
    await click('Evening', '.chip');
    await click('Save habit');
    await waitFor('.habit-card');
    assert($('.habit-card__name').textContent === 'Drink water', 'Habit not added');
    await click('Mark done');
    assert($('.habit-card__streak').textContent === '1-day streak', 'Streak should be 1');
    assert($('.day-dot--done'), 'Today dot not filled');
    await click('Done today');
    assert(byText('Mark done'), 'Undo failed');
    await click('Mark done');
  `);
});

await step('Habits: remove dialog keeps by default, then removes', async () => {
  await evaluate(`
    await click('Add a habit', 'a');
    await waitFor('#habit-name'); type('#habit-name', 'Stretch'); await click('Save habit');
    await waitUntil(() => $$('.habit-card').length === 2, 'two habits');
    $$('.habit-card .icon-btn')[1].click(); await sleep(300);
    assert($('dialog[open]'), 'Dialog did not open');
    assert(document.activeElement.textContent === 'Keep habit', 'Keep habit should have focus');
    await click('Keep habit');
    assert($$('.habit-card').length === 2, 'Keep removed the habit');
    $$('.habit-card .icon-btn')[1].click(); await sleep(300);
    await click('Remove habit', 'dialog button');
    await waitUntil(() => $$('.habit-card').length === 1, 'habit removed');
  `);
});

await step('Today: habit summary reflects habits', async () => {
  await evaluate(`
    await go('#/today');
    assert($('.habit-summary__text').textContent === '1 of 1 done today', 'Summary: ' + $('.habit-summary__text')?.textContent);
  `);
});

await step('Journal: needs words, saves with mood, newest first', async () => {
  await evaluate(`
    await go('#/journal');
    assert($('.composer__prompt').textContent.length > 10, 'No lesson prompt');
    await click('Save entry');
    assert($('.composer__status').textContent.includes('Write a few words'), 'No empty message');
    type('#journal-text', 'First test entry.'); await click('Save entry');
    await sleep(50);
    type('#journal-text', 'Second test entry.'); await click('Save entry');
    await waitUntil(() => $$('.entry-card').length === 2, 'two entries');
    assert($('.entry-card__text').textContent === 'Second test entry.', 'Newest entry is not first');
    assert($('.entry-card .mood-chip').textContent.includes('Bright'), 'Entry should carry today\\'s mood');
  `);
});

await step('Weekly review: wins and a saved note', async () => {
  await evaluate(`
    await go('#/weekly');
    const wins = $('.win-list')?.textContent ?? '';
    assert(wins.includes('Drink water') && wins.includes('Finished Lesson 1'), 'Wins missing: ' + wins);
    type('#weekly-text', 'Rest and one long walk.'); await click('Save review');
    await go('#/today'); await go('#/weekly');
    assert($('#weekly-text').value === 'Rest and one long walk.', 'Weekly note not kept');
  `);
});

await step("Mood insights: this week shows today's mood", async () => {
  await evaluate(`
    await go('#/insights');
    assert($('.mood-week').textContent.includes('Bright'), 'Today\\'s mood missing from the week');
    assert($('.lift-list')?.textContent.includes('Drink water'), 'Habit lift missing');
  `);
});

await step('Focus: start, pause holds time, resume, stop', async () => {
  await evaluate(`
    await go('#/focus');
    await click('15 min', '.chip');
    await click('Start focus');
    await sleep(2200);
    const running = $('.focus-ring__time').textContent;
    assert(running.startsWith('14:5'), 'Timer not running: ' + running);
    await click('Pause'); const held = $('.focus-ring__time').textContent; await sleep(1500);
    assert($('.focus-ring__time').textContent === held, 'Pause did not hold');
    await click('Resume'); await click('Stop');
    assert($('.focus-ring__time').textContent === '15:00', 'Stop did not reset');
  `);
});

await step('Calm corner: breathing guides, wind-down saves a journal line', async () => {
  await evaluate(`
    await go('#/calm');
    await click('Begin breathing'); await sleep(1200);
    assert($('.breathing__phase').textContent === 'Breathe in', 'Breathing did not start');
    await click('Stop');
    await click('Start wind-down');
    type('.wind-down input', 'Put the day down.'); await click('Next');
    await click('Next'); await click('Done');
    assert($('.wind-down').textContent.includes('Rest well'), 'Wind-down did not finish');
    await go('#/journal');
    assert($$('.entry-card__text').some((p) => p.textContent === 'Put the day down.'), 'Wind-down line not in journal');
  `);
});

await step('Settings: theme override and back to device', async () => {
  await evaluate(`
    await go('#/settings');
    await click('Dark', '.chip');
    assert(document.documentElement.dataset.theme === 'dark', 'Dark not applied');
    await click('Match device', '.chip');
    assert(!document.documentElement.dataset.theme, 'Device theme not restored');
  `);
});

await step('Export: a readable JSON file with everything', async () => {
  const summary = await evaluate(`
    await go('#/settings');
    let blob, name;
    const create = URL.createObjectURL, clickA = HTMLAnchorElement.prototype.click;
    URL.createObjectURL = (b) => { blob = b; return 'blob:test'; };
    HTMLAnchorElement.prototype.click = function () { name = this.download; };
    try { await click('Export my data'); } finally { URL.createObjectURL = create; HTMLAnchorElement.prototype.click = clickA; }
    const data = JSON.parse(await blob.text());
    assert(name.startsWith('everyday-export-'), 'File name: ' + name);
    assert(data.journalEntries.length === 3 && data.habits.length === 1, 'Export counts wrong');
    return name;
  `);
  if (!summary) throw new Error('No export');
});

await step('Data stays after a reload (opens without the passphrase)', async () => {
  await reload();
  await evaluate(`
    await waitFor('.shell');
    await go('#/journal');
    assert($$('.entry-card').length === 3, 'Entries lost after reload');
  `);
});

await step('PIN lock: wrong PIN refused, right PIN opens, forgot PIN uses passphrase', async () => {
  await evaluate(`
    await go('#/settings');
    $('[aria-labelledby="pin-setting"]').click(); await waitFor('#pin-first');
    type('#pin-first', ${JSON.stringify(PIN)}); type('#pin-second', ${JSON.stringify(PIN)});
    $('dialog[open] button[type=submit]').click();
    await waitUntil(() => !$('dialog[open]'), 'PIN dialog closed');
  `);
  await reload();
  await evaluate(`
    await waitFor('#unlock-pin');
    type('#unlock-pin', '0000'); await click('Unlock');
    await waitUntil(() => $('.gate [role=status]').textContent.includes('does not match'), 'wrong PIN message');
    type('#unlock-pin', ${JSON.stringify(PIN)}); await click('Unlock');
    await waitFor('.shell', 20000);
  `);
  await reload();
  await evaluate(`
    await waitFor('#unlock-pin');
    await click('Forgot your PIN');
    await waitFor('#passphrase');
    type('#passphrase', ${JSON.stringify(PASS)}); await click('Unlock');
    await waitFor('.shell', 20000);
    await go('#/settings');
    assert($('[aria-labelledby="pin-setting"]').getAttribute('aria-checked') === 'false', 'PIN should be cleared after using the passphrase');
  `);
});

await step('New device: passphrase restores everything from the cloud', async () => {
  await evaluate(`
    await sleep(2500); // let sync finish
    await new Promise((r) => { const d = indexedDB.deleteDatabase('everyday-cache'); d.onsuccess = d.onerror = d.onblocked = r; });
    return 1;
  `);
  await reload();
  await evaluate(`
    await waitFor('#passphrase');
    assert(h1() === 'Enter your passphrase', 'Expected Enter your passphrase, got ' + h1());
    type('#passphrase', 'wrong passphrase value'); await click('Unlock');
    await waitUntil(() => $('.gate [role=status]').textContent.includes('does not open'), 'wrong passphrase message', 30000);
    type('#passphrase', ${JSON.stringify(PASS)}); await click('Unlock');
    await waitFor('.shell', 30000);
    await sleep(2500);
    await go('#/journal');
    await waitUntil(() => $$('.entry-card').length === 3, 'entries restored', 20000);
    await go('#/habits');
    assert($('.habit-card__name')?.textContent === 'Drink water', 'Habit not restored');
  `);
});

await step('Sign out clears this device; signing back in asks for the passphrase', async () => {
  await evaluate(`
    await go('#/settings');
    await click('Sign out');
    await waitFor('#email');
    const dbs = (await indexedDB.databases()).map((d) => d.name);
    await click('Continue with Google');
    await waitFor('#passphrase');
    assert(h1() === 'Enter your passphrase', 'Existing account should ask for its passphrase');
    type('#passphrase', ${JSON.stringify(PASS)}); await click('Unlock');
    await waitFor('.shell', 30000);
  `);
});

await step('Layouts: tab bar, rail and sidebar, no sideways scrolling, 44px targets', async () => {
  for (const [width, height, nav] of [[390, 844, '.tabbar'], [820, 1100, '.rail'], [1280, 860, '.sidebar']]) {
    await viewport(width, height);
    await evaluate(`
      for (const hash of ['#/today', '#/lessons', '#/habits', '#/journal', '#/settings']) {
        await go(hash);
        // Focused pages (like Settings) have no tab bar on phones, as on the boards.
        const focused = hash === '#/settings';
        if (!(focused && ${JSON.stringify(nav)} === '.tabbar')) {
          const navEl = $(${JSON.stringify(nav)});
          assert(navEl && getComputedStyle(navEl).display !== 'none', ${JSON.stringify(nav)} + ' missing on ' + hash + ' at ${width}px');
        }
        assert(document.documentElement.scrollWidth <= innerWidth, 'Sideways scroll on ' + hash + ' at ${width}px');
        const small = $$('main a[href], main button, main select, main textarea, main input, nav a').filter((el) => el.offsetParent && !el.closest('.dev-toolbar')).filter((el) => { const r = el.getBoundingClientRect(); return r.height < 44 || r.width < 44; });
        assert(!small.length, 'Small target on ' + hash + ' at ${width}px: ' + small.map((e) => e.textContent.trim().slice(0, 20)).join(', '));
      }
    `);
  }
  await viewport(390, 844);
});

await step('Delete everything removes the account and starts fresh', async () => {
  await evaluate(`
    await go('#/settings');
    await click('Delete all data');
    assert(document.activeElement.textContent === 'Keep my data', 'Keep my data should have focus');
    await click('Delete everything', 'dialog button');
    await waitFor('#email', 20000);
    await click('Continue with Google');
    await waitFor('#passphrase');
    assert(h1() === 'Choose a passphrase', 'After delete, a new account should choose a passphrase');
  `);
});

// ---------- Report ----------
ws.close();
stopBrowser();
await sleep(1000);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  // the browser may still hold a file for a moment; it is in the temp folder
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} of ${results.length} passed`);
process.exit(failed.length ? 1 : 0);
