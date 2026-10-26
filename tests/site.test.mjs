// Automated checks for the Awwfy Studios website. Run with: npm test
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { chromium } from "playwright";
import { startServer } from "./server.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let server, base, browser, C;

async function loadContent() {
  const code = await readFile(join(ROOT, "js/content.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.AWWFY;
}
async function exists(p) { return !!(await stat(join(ROOT, p)).catch(() => null)); }
async function walk(dir) {
  const out = [];
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".git")) continue;
    const p = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(p))); else out.push(p);
  }
  return out;
}
async function page(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) p.errors.push(m.text()); });
  return p;
}

before(async () => {
  C = await loadContent();
  server = await startServer(0);
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

/* ---------- content and files ---------- */
test("no em-dashes anywhere in the site text", async () => {
  const files = (await walk("")).filter((f) => [".html", ".css", ".js", ".mjs", ".md", ".webmanifest", ".json"].includes(extname(f)));
  for (const f of files) {
    const t = await readFile(join(ROOT, f), "utf8");
    assert.ok(!t.includes(String.fromCharCode(0x2014)), `em-dash found in ${f}`);
  }
});

test("content.js is valid: unique ids, known subjects, screenshots exist", async () => {
  const subjects = ["physics", "chemistry", "biology", "space", "maths", "reading"];
  const all = [...C.science, ...C.free];
  const ids = new Set();
  for (const g of all) {
    assert.ok(g.id && g.name && g.line, `game missing id, name or line: ${JSON.stringify(g)}`);
    assert.ok(!ids.has(g.id), `duplicate id ${g.id}`); ids.add(g.id);
    assert.ok(subjects.includes(g.subject), `unknown subject for ${g.id}`);
    assert.ok(["en", "ar"].includes(g.lang), `unknown language for ${g.id}`);
    if (!g.soon) assert.ok(await exists(g.img || `assets/shots/${g.id}.jpg`), `missing screenshot for ${g.id}`);
  }
  for (const id of C.showcase) assert.ok(ids.has(id), `showcase id not in game lists: ${id}`);
  assert.equal(C.showcase[0], "solar-system", "Solar System should open the showcase");
});

test("every local file referenced by the pages exists", async () => {
  for (const f of ["index.html", "offline.html", "404.html"]) {
    const html = await readFile(join(ROOT, f), "utf8");
    const refs = [...html.matchAll(/(?:src|href|data-src|poster)="([^"#:]+?)"/g)].map((m) => m[1].replace(/^\//, ""));
    for (const r of refs) if (r) assert.ok(await exists(r), `${f} points to missing file: ${r}`);
  }
  const m = JSON.parse(await readFile(join(ROOT, "manifest.webmanifest"), "utf8"));
  for (const i of m.icons) assert.ok(await exists(i.src), `missing icon ${i.src}`);
  assert.equal((await readFile(join(ROOT, "CNAME"), "utf8")).trim(), "awwfy.com");
});

/* ---------- rendering ---------- */
test("home page renders every section without errors", async () => {
  const p = await page();
  await p.goto(base);
  await p.waitForLoadState("networkidle");
  for (const id of ["top", "showcase", "valence", "why", "library", "contact"]) assert.ok(await p.isVisible(`#${id}`), `#${id} visible`);
  assert.match(await p.textContent("h1"), /Interactive Science Games/i);
  assert.equal(await p.getAttribute(".logo img", "alt"), "Awwfy Studios");
  assert.match(await p.textContent("footer"), /Let's make\s*learning\s*click\./i);
  assert.match(await p.textContent("footer"), /hello@awwfy\.com/);
  assert.deepEqual(p.errors, []);
  await p.context().close();
});

test("library shows every game with the right link", async () => {
  const p = await page();
  await p.goto(base);
  assert.equal(await p.locator("#science .game").count(), C.science.length);
  assert.equal(await p.locator("#free .game").count(), C.free.length);
  const g = C.science.find((x) => !x.soon);
  const href = await p.getAttribute(`#science a.game[aria-label^="Play ${g.name}"]`, "href");
  assert.equal(href, `${C.site}${g.id}/`);
  assert.equal(await p.locator("#science .game.soon").count(), C.science.filter((x) => x.soon).length);
  await p.context().close();
});

test("all images on the page loaded", async () => {
  const p = await page();
  await p.goto(base);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await p.waitForLoadState("networkidle");
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.getAttribute("src") && i.complete && i.naturalWidth === 0).map((i) => i.src));
  assert.deepEqual(broken, []);
  await p.context().close();
});

/* ---------- navigation and interaction ---------- */
test("header links jump to sections that exist", async () => {
  const p = await page();
  await p.goto(base);
  for (const h of await p.$$eval(".top a[href^='#']", (as) => as.map((a) => a.getAttribute("href")))) {
    assert.ok(await p.$(h), `missing target ${h}`);
  }
  await p.keyboard.press("Tab");
  assert.equal(await p.evaluate(() => document.activeElement.className), "skip", "first Tab goes to the skip link");
  await p.context().close();
});

test("subject and language filters work, with an empty message", async () => {
  const p = await page();
  await p.goto(base);
  const ar = [...C.science, ...C.free].filter((g) => g.lang === "ar").length;
  await p.click("#fLang button[lang='ar']");
  assert.equal(await p.locator(".games .game:visible").count(), ar);
  await p.click("#fSubject button:has-text('Physics')");
  assert.ok(await p.isVisible("#empty"), "empty message shows when nothing matches");
  await p.click("#fLang button:has-text('All')");
  const phys = [...C.science, ...C.free].filter((g) => g.subject === "physics").length;
  assert.equal(await p.locator(".games .game:visible").count(), phys);
  assert.ok(!(await p.isVisible("#gFree")), "empty group is hidden");
  assert.equal(await p.getAttribute("#fSubject button:has-text('Physics')", "aria-pressed"), "true");
  await p.context().close();
});

test("laptop: phone row moves only with the scroll, no auto animation", async () => {
  const p = await page();
  await p.goto(base);
  await p.waitForLoadState("load");
  const top = await p.evaluate(() => document.getElementById("showcase").offsetTop);
  await p.evaluate((y) => scrollTo(0, y), top);
  await p.waitForTimeout(150);
  const a = await p.evaluate(() => getComputedStyle(document.getElementById("row")).transform);
  await p.waitForTimeout(700);
  const a2 = await p.evaluate(() => getComputedStyle(document.getElementById("row")).transform);
  assert.equal(a, a2, "row stays still when not scrolling");
  await p.evaluate((y) => scrollTo(0, y + 300), top);
  await p.waitForTimeout(150);
  const b = await p.evaluate(() => getComputedStyle(document.getElementById("row")).transform);
  assert.notEqual(a, b, "row moves when scrolling");
  assert.equal(await p.locator("#row .item").count(), C.showcase.length);
  await p.context().close();
});

test("phone: no sideways page scroll and the game row swipes", async () => {
  const p = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(base);
  await p.waitForLoadState("load");
  assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "page fits the phone width");
  const ov = await p.evaluate(() => { const r = document.getElementById("row"); return [getComputedStyle(r).overflowX, r.scrollWidth > r.clientWidth]; });
  assert.equal(ov[0], "auto"); assert.ok(ov[1], "row is wider than the screen so it can be swiped");
  await p.context().close();
});

test("form links point to the three Google Forms and open in a new tab", async () => {
  const p = await page();
  await p.goto(base);
  const expect = {
    valCta: "https://forms.gle/tFrTPmWRn5QRFe6PA", formEarly: "https://forms.gle/tFrTPmWRn5QRFe6PA",
    formContact: "https://forms.gle/ygbbGD3YRUBCfvpC7", formFeedback: "https://forms.gle/zX5pKgFtHgmtzWUu8"
  };
  for (const id of Object.keys(expect)) {
    assert.equal(await p.getAttribute("#" + id, "href"), expect[id], id);
    assert.equal(await p.getAttribute("#" + id, "target"), "_blank", id);
    assert.match(await p.getAttribute("#" + id, "rel"), /noopener/, id);
  }
  assert.match(await p.getAttribute("#mailHello", "href"), /^mailto:hello@awwfy\.com/);
  await p.context().close();
});

/* ---------- error handling ---------- */
test("a missing screenshot shows a neat text fallback", async () => {
  const p = await page({ serviceWorkers: "block" }); // so the broken-image rule applies to every request
  await p.route("**/assets/shots/balloon-minus.jpg", (r) => r.abort());
  await p.goto(base);
  const card = p.locator('#free a.game[aria-label^="Play Balloon Minus"]');
  await card.scrollIntoViewIfNeeded();
  await card.locator(".fallback").waitFor({ state: "visible", timeout: 10000 });
  assert.deepEqual(p.errors, []);
  await p.context().close();
});

test("if the hero video fails, the still bunny stays and nothing breaks", async () => {
  const p = await page({ serviceWorkers: "block" });
  await p.route("**/*.mp4", (r) => r.abort());
  await p.goto(base);
  await p.waitForTimeout(800);
  assert.ok(await p.isVisible("#bunny .poster"));
  assert.equal(await p.evaluate(() => getComputedStyle(document.querySelector("#bunny .poster")).opacity), "1");
  assert.deepEqual(p.errors, []);
  await p.context().close();
});

test("unknown address shows the friendly 404 page", async () => {
  const p = await page();
  const res = await p.goto(base + "no-such-page/");
  assert.equal(res.status(), 404);
  assert.match(await p.textContent("h1"), /Page not found/);
  await p.context().close();
});

/* ---------- offline (PWA) ---------- */
test("works offline after the first visit", async () => {
  const p = await page();
  await p.goto(base);
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await p.reload(); // page is now controlled by the service worker
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.waitForTimeout(500);
  await p.context().setOffline(true);
  await p.reload();
  assert.match(await p.textContent("h1"), /Interactive Science Games/i, "home page opens offline");
  await p.goto(base + "a-game-never-opened/");
  assert.match(await p.textContent("h1"), /offline/i, "offline page for pages never visited");
  await p.context().setOffline(false);
  await p.context().close();
});

test("manifest makes the site installable", async () => {
  const m = JSON.parse(await readFile(join(ROOT, "manifest.webmanifest"), "utf8"));
  assert.equal(m.display, "standalone");
  assert.ok(m.icons.some((i) => i.sizes === "512x512"));
  assert.ok(m.icons.some((i) => i.purpose === "maskable"));
});

/* ---------- plans ---------- */
test("pilot section renders the pilot card, the custom game strip and the small print", async () => {
  const p = await page();
  await p.goto(base);
  assert.equal(await p.textContent("#plansH"), C.plans.heading);
  assert.equal(await p.locator("#planGrid .plan").count(), 1);
  const text = await p.textContent("#plans");
  for (const c of C.plans.cards) { assert.ok(text.includes(c.name), `card ${c.name}`); }
  assert.ok(!/US\$/.test(text), "no prices shown");
  assert.ok(!/payment is late/i.test(text), "old late payment line is gone");
  assert.equal(await p.getAttribute("#pilotCta", "href"), "https://forms.gle/ygbbGD3YRUBCfvpC7", "school button opens the contact form");
  assert.equal(await p.getAttribute("#pilotCta", "target"), "_blank");
  assert.equal(await p.getAttribute("#customCta", "href"), "https://forms.gle/ygbbGD3YRUBCfvpC7", "custom strip opens the contact form");
  assert.ok(!/late fees/i.test(text), "no late fee line");
  const order = await p.evaluate(() => { const ids = [...document.querySelectorAll("main > section, footer")].map((e) => e.id); return [ids.indexOf("library"), ids.indexOf("plans")]; });
  assert.ok(order[1] === order[0] + 1, "plans sits right after the library");
  const footerAfter = await p.evaluate(() => document.getElementById("plans").compareDocumentPosition(document.getElementById("contact")) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(footerAfter, "footer comes after plans");
  assert.deepEqual(p.errors, []);
  await p.context().close();
});

test("header ( Pilot ) link scrolls to the plans section", async () => {
  const p = await page();
  await p.goto(base);
  await p.click(".top nav a[href='#plans']");
  await p.waitForTimeout(800);
  const top = await p.evaluate(() => document.getElementById("plans").getBoundingClientRect().top);
  assert.ok(top >= -5 && top < 200, `plans near the top of the screen (top=${top})`);
  await p.context().close();
});

test("with reduced motion, plans show at once without animation", async () => {
  const p = await page({ reducedMotion: "reduce" });
  await p.goto(base);
  await p.evaluate(() => document.getElementById("plans").scrollIntoView());
  const op = await p.$$eval("#planGrid .plan", (els) => els.map((e) => getComputedStyle(e).opacity));
  assert.deepEqual(op, ["1"]);
  await p.context().close();
});

/* ---------- search engines ---------- */
test("search and share tags are correct", async () => {
  const p = await page();
  await p.goto(base);
  assert.equal(await p.title(), "Awwfy Studios | Interactive Science Games for Kids and Schools");
  assert.equal(await p.getAttribute("meta[name=description]", "content"),
    "Interactive science games where the concept is the rule. Physics, chemistry, biology and space for school classrooms. Works in any browser, no installations, no setup. No logins, no ads.");
  assert.equal(await p.getAttribute("link[rel=canonical]", "href"), "https://awwfy.com/");
  assert.equal(await p.getAttribute("meta[property='og:url']", "content"), "https://awwfy.com/");
  assert.equal(await p.getAttribute("meta[property='og:site_name']", "content"), "Awwfy Studios");
  assert.ok(await p.getAttribute("meta[property='og:title']", "content"));
  assert.ok(await p.getAttribute("meta[property='og:description']", "content"));
  assert.equal(await p.getAttribute("meta[property='og:image']", "content"), "https://awwfy.com/assets/img/og-image.png");
  const ld = JSON.parse(await p.textContent("script[type='application/ld+json']"));
  const types = ld["@graph"].map((x) => x["@type"]);
  assert.ok(types.includes("WebSite") && types.includes("Organization"));
  for (const x of ld["@graph"]) { assert.equal(x.name, "Awwfy Studios"); assert.equal(x.url, "https://awwfy.com/"); }
  assert.ok(ld["@graph"].find((x) => x["@type"] === "Organization").logo);
  assert.equal(await p.locator("h1").count(), 1);
  assert.match(await p.textContent("h1"), /^Awwfy Studios: Interactive Science Games/);
  await p.context().close();
});

test("favicon, share image, robots.txt and sitemap.xml are valid", async () => {
  const ico = await readFile(join(ROOT, "favicon.ico"));
  assert.equal(ico.readUInt16LE(2), 1, "favicon.ico is an icon file");
  const sizes = []; for (let i = 0; i < ico.readUInt16LE(4); i++) sizes.push(ico[6 + i * 16] || 256);
  assert.ok(sizes.includes(48), "favicon.ico has a 48x48 size");
  const pngSize = async (f) => { const b = await readFile(join(ROOT, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  assert.deepEqual(await pngSize("icon-192.png"), [192, 192]);
  assert.deepEqual(await pngSize("assets/img/og-image.png"), [1200, 630]);
  const robots = await readFile(join(ROOT, "robots.txt"), "utf8");
  assert.match(robots, /User-agent: \*/); assert.match(robots, /Allow: \//); assert.match(robots, /Sitemap: https:\/\/awwfy\.com\/sitemap\.xml/);
  assert.ok(!/Disallow:\s*\/\s*$/m.test(robots), "robots.txt does not block the site");
  assert.match(await readFile(join(ROOT, "sitemap.xml"), "utf8"), /<loc>https:\/\/awwfy\.com\/<\/loc>/);
  const p = await page();
  for (const f of ["favicon.ico", "icon-192.png", "robots.txt", "sitemap.xml"]) assert.equal((await p.goto(base + f)).status(), 200, f);
  await p.context().close();
});

test("no leftover old site name or old age range", async () => {
  const files = (await walk("")).filter((f) => [".html", ".js", ".css", ".json", ".webmanifest", ".md", ".txt", ".xml"].includes(extname(f)) && !f.startsWith("tests/"));
  for (const f of files) {
    const t = await readFile(join(ROOT, f), "utf8");
    assert.ok(!/awwfy arcade/i.test(t), `"awwfy Arcade" found in ${f}`);
    assert.ok(!/4 to 12/.test(t), `"4 to 12" found in ${f}`);
    assert.ok(!/9 to 12/.test(t), `"9 to 12" found in ${f}`);
  }
});
