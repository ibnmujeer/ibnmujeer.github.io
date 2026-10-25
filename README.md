# Awwfy Studios website

The home page for **awwfy.com**: science learning games for schools.
Plain HTML, CSS and JavaScript. No framework and no build step. It installs on phones as an app (PWA) and opens offline.

## What is in this folder

| Path | What it is |
|---|---|
| `index.html` | The home page |
| `js/content.js` | **All games, text and links. This is the file you edit.** |
| `js/app.js` | Page behaviour (filters, phone row, bunny video, offline) |
| `css/styles.css` | Look and feel. Colours and fonts are at the top, under `:root` |
| `assets/shots/` | Game screenshots. Named after the game's web address, for example `spark-lab.jpg` |
| `assets/video/`, `assets/img/` | Bunny videos, Valence art and gameplay, logo |
| `assets/fonts/` | Fonts, stored here so the site works offline |
| `assets/icons/` | App icons for phones |
| `sw.js` | Service worker: makes the site and played games open offline |
| `manifest.webmanifest` | Lets people install the site as an app |
| `offline.html`, `404.html` | "You're offline" and "Page not found" pages |
| `CNAME` | Tells GitHub the site lives at awwfy.com. Do not delete |
| `.nojekyll` | Tells GitHub to serve files as they are. Do not delete |
| `tests/` | Automated checks and a small local web server |

## Editing content

Open `js/content.js` in any text editor (Notepad works, VS Code is nicer).

**Add a game**
1. Take a phone screenshot of the game. Crop off the phone's status bar and the browser address bar.
2. Save it as `assets/shots/<game-address>.jpg`. For `awwfy.com/solar-system/` the name is `solar-system.jpg`. About 450 pixels wide is plenty.
3. In `content.js`, copy an existing game block into the `science` or `free` list and change `id`, `name`, `subject`, `lang` and `line`.
4. For an Arabic version, set `lang: "ar"`, put the Arabic title in `name` and an English name in `sub`.

**Other common edits**
- Change the featured phone row: edit the `showcase` list (game ids, in order).
- Make Valence playable: in the `science` list, remove `soon: true` from Valence. In `valence`, change `status` and `cta`.
- Change emails: edit `contact`.
- A game hosted somewhere else (for example Netlify): add `url: "https://..."` to that game.

Keep writing without em-dashes. The tests check for them.

## Run it on your computer

You need [Node.js](https://nodejs.org) version 18 or newer.

```bash
npm install
npx playwright install chromium   # one time, downloads the test browser
npm start                         # open http://localhost:8080
```

Opening `index.html` by double-clicking also works, but the moving hero bunny and offline mode only run from a web address (`npm start` or the live site). From a double-click you see the still bunny.

## Tests

```bash
npm test
```

There are 16 checks:
- no em-dashes
- every game has a screenshot, and every file the pages use exists
- every section renders with no errors
- every game card links to the right address
- every image loads
- header links and keyboard navigation work
- the subject and language filters work, including the "no games" message
- the phone row moves only with the scroll on a laptop and swipes on a phone
- "Get early access" takes you to the contact footer
- missing screenshots and failed videos fall back neatly
- the 404 page works
- the site works offline
- the site is installable

## Put it live on GitHub (awwfy.com)

The site goes in the repository **`ibnmujeer.github.io`**, which is already connected to awwfy.com. All your game repositories then appear under awwfy.com automatically, for example awwfy.com/spark-lab/.

1. Go to `https://github.com/ibnmujeer/ibnmujeer.github.io`.
2. Click **Add file**, then **Upload files**. On an empty repository, click the link **uploading an existing file** instead.
3. In File Explorer, open this `awwfy-site` folder. Press **Ctrl+A** to select everything inside it (folders and files) and drag it onto the GitHub page. Do **not** drag the `awwfy-site` folder itself, only what is inside it. Skip `node_modules` if you have one.
4. Wait until every file is listed. In "Commit changes", type `Launch awwfy.com website` and click **Commit changes**.
5. Click the **Actions** tab. When "pages build and deployment" shows a green tick (1 to 2 minutes), open https://awwfy.com.
6. In **Settings, then Pages**, tick **Enforce HTTPS** if it is not ticked yet.

**Updating later:** upload only the changed files the same way, replacing the old ones. If you changed anything other than `content.js` or screenshots, also open `sw.js` and raise `VERSION` (for example `"v1"` to `"v2"`) so phones that installed the site pick up the change.

## How offline works

- The service worker saves the home page, styles, fonts and logo on the first visit, so awwfy.com opens with no internet.
- Any game someone has opened while online is saved too, so it usually opens offline next time. Games that load parts from other websites may still need internet.
- Pages never visited show the friendly "You're offline" page.
- Games with their own offline setup (for example Number Meadow) keep using their own.

## Before sharing widely

- Make sure `hello@awwfy.com` and `join@awwfy.com` receive email.
- Ask a native Arabic speaker to read the Arabic game titles once.
- Little Creatures "Sea" shows a tortoise. A tortoise lives on land, so a sea turtle would be more accurate.
