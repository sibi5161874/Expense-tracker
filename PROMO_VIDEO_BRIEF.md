# KashMap — Promo Video Brief

A single reference document for briefing an AI (ChatGPT, a video-generation tool, or a human editor) to produce a promo video for KashMap. Everything factual in here (features, numbers, screens) is pulled directly from the actual product — nothing invented — so a generated script won't promise something the app doesn't do.

---

## 1. What KashMap is (the elevator pitch)

**KashMap** is a privacy-first personal finance and net-worth tracker built specifically for how people in India actually manage money — not a generic budgeting app with rupees bolted on.

**Tagline:** *"Privacy-first net worth tracking, built for how Indians actually invest."*

**One-line pitch:** One dashboard for every asset, liability, and rupee moving through your accounts — bank balances, stocks, mutual funds, gold, EPF, real estate, and more — instead of a pile of spreadsheets and five different apps.

**Hero headline (as used on the actual landing page):**
> "Master your net worth. Your data, your rules."
>
> "Stop guessing your expenses across fragmented spreadsheets. One dashboard for every asset, liability, and rupee moving through your accounts — built for how India actually invests."

**Platforms:** Web app (any browser) + native mobile app (Android/iOS via Expo). Full feature parity between both — everything below works on either.

---

## 2. Who it's for (target audience)

- Someone tracking money across **many places at once**: a couple of bank accounts, a Zerodha/Groww portfolio, EPF, maybe a fixed deposit or gold, and no single place that adds it all up.
- Indians specifically — the app understands NSE/BSE, INR formatting, Indian tax concepts (LTCG offset), and Indian bank/broker statement formats out of the box.
- People who are privacy-conscious: no ad tracking, no data reselling, built by a solo developer, not a VC-funded data-harvesting play.
- Both casual users (free tier is genuinely usable, not a crippled demo) and serious investors (Pro unlocks deeper analysis).

---

## 3. Core value props (pick 3–4 for the video, don't try to cram all of them)

1. **See your whole financial picture in one place.** 13 asset classes — bank accounts, stocks, mutual funds, Fixed Deposits, Gold, EPF, NPS, SSY, SGB, ULIP, Real Estate, PPF, Recurring Deposits, NSC, Vehicles — rolled up into one net worth number.
2. **Import, don't retype.** Drop in a bank or broker statement CSV — support for HDFC, SBI, ICICI, Axis, Kotak, IDFC FIRST, plus Zerodha, Upstox, Groww, and more. It cross-checks the import against the file's own running balance, so a bad column mapping gets caught instead of silently corrupting your numbers. Duplicates are skipped automatically on re-import.
3. **One score for your financial health.** The "Financial Essentials Check" scores your emergency fund, term insurance, and health insurance cover against what you actually need — no spreadsheet math, no financial-advisor jargon.
4. **Real investing tools, not just a ledger.** Live price refresh, stock fundamentals (P/E, 52-week range, margins), tax-loss harvesting insights, a portfolio-vs-Nifty-50 benchmark chart, SIP/Lumpsum/stock-averaging calculators.
5. **Your data stays yours.** No third-party tracking. Full JSON export of everything, anytime. Account deletion is instant and real, not a support-ticket runaround.
6. **Free tier is actually usable.** Unlimited transactions, up to 25 tracked assets, all 14 reports viewable, recurring transactions — free, forever. Pro (₹850 once, lifetime — no subscription) unlocks bank/broker import, live prices, calculators, and PDF/Excel export.

---

## 4. Concrete numbers you can put on screen (all real, verified against the codebase)

| Stat | Value |
|---|---|
| Asset classes tracked | 13 |
| Built-in reports | 14 (+ 1 combined "Overall Report") |
| Banks supported for statement import | HDFC, SBI, ICICI, Axis, Kotak, IDFC FIRST (+ Doha Bank, Commercial Bank of Qatar) |
| Brokers supported | Zerodha, Upstox, Groww, INDmoney, ICICI Direct, Angel One, 5paisa, Interactive Brokers, and more |
| Pricing | Free forever, or ₹850 **one-time** for lifetime Pro (no subscription) |
| Free trial | 30 days, ₹1 refundable verification charge |
| Free tier asset cap | 25 tracked assets |

---

## 5. Screens/features to actually show on camera

Real screens, in a sensible narrative order (problem → import → insight → payoff):

1. **The "before" moment (optional cold open):** a cluttered spreadsheet or a stack of bank statements — the "pile of statements" the landing page itself references. Sets up the problem KashMap solves.
2. **Dashboard** — net worth hero number front and center, income/expense KPIs, a 6-month cash flow chart, portfolio KPIs. This is the "wow, it's all in one place" shot.
3. **Import flow** — dragging a bank statement CSV in, picking the bank from a list (with real bank logos), the app auto-detecting columns and reconciling against the statement's own balance. This is the single best "magic moment" to show — it's the app's actual technical differentiator, not just a claim.
4. **Portfolio + Allocation view** — the donut chart showing cash vs. equity vs. debt vs. gold vs. real estate, holdings table with live prices.
5. **Financial Essentials Check** — the 0–10 score card with term insurance / health insurance / emergency fund, each with a progress bar. Very visual, easy to explain in 3 seconds.
6. **Reports** — quickly flash through 3–4 report thumbnails (Net Worth Statement, Budget vs Actual, Category Breakdown) to convey "there's a report for everything," without lingering on any one.
7. **Calculators** — SIP calculator with a number ticking up is a satisfying, easy-to-animate beat.
8. **Mobile app** — a few seconds of the same dashboard/portfolio on a phone, to land "web and mobile, always in sync."
9. **Settings → Data & Privacy** — the "Export all data" / "Delete account" screen, for the privacy beat. Doesn't need much screen time — a quick flash while the voiceover makes the privacy point is enough.
10. **Closing CTA screen** — the pricing page or signup page: "Free forever. No credit card required to start."

---

## 6. Suggested voiceover script (≈45 seconds, adjust pacing to your final cut)

> *(0:00–0:05 — problem)*
> "Your money's everywhere. A bank account here, a broker there, an EPF statement you haven't opened in months."
>
> *(0:05–0:12 — the app / import)*
> "KashMap pulls it all into one place. Drop in a bank statement — it reads the columns, checks itself against your actual balance, and skips duplicates automatically."
>
> *(0:12–0:22 — the payoff / dashboard)*
> "One number for your entire net worth. Cash, stocks, mutual funds, gold, real estate, EPF — thirteen asset types, one dashboard."
>
> *(0:22–0:30 — the smart layer)*
> "It even tells you if you're under-insured, or sitting on an emergency fund that's too thin — a real financial health score, not just a spreadsheet."
>
> *(0:30–0:38 — investing tools)*
> "Live prices. Tax-loss harvesting. A SIP calculator that actually knows your numbers."
>
> *(0:38–0:45 — trust + CTA)*
> "No ads. No data reselling. Your data, exportable anytime. Free to start — KashMap."

**Alternate shorter tagline-style closer (15-second cutdown version):**
> "Every rupee, every asset, one dashboard. KashMap — free to start, built for how India actually invests."

---

## 7. On-screen text suggestions (captions/overlays, not voiceover)

Use these as punchy on-screen text while the corresponding screen is visible — most viewers watch with sound off first.

- "13 asset classes. 1 dashboard."
- "Import your bank statement. It checks its own math."
- "Your Financial Health Score."
- "Live prices. Real insights."
- "No ads. No tracking. Your data, your rules."
- "Free forever. Pro is ₹850. Once. Not a subscription."
- "Web + Mobile — always in sync."

---

## 8. Tone & style guide

- **Tone:** Calm, confident, competent — not hype-y "10x your wealth!!" fintech-bro energy. The product's own voice (from the actual UI copy) is plain-spoken and honest — e.g. calculators literally say "these tools are for planning, not advice."
- **Pacing:** Fast cuts (1.5–3 seconds per screen) for the feature-montage section; slow down for the emotional beats (the net worth number, the privacy statement).
- **Color/visual identity:** Match the app's own palette — it's a clean, modern dashboard UI with light/dark mode support; showing both once is a nice detail but not essential.
- **Music mood:** Confident, modern, understated — think "calm competence," not "epic trailer." Avoid anything that sounds like a crypto/get-rich-quick ad; that's the opposite of this brand.
- **What to avoid:** Don't claim AI-powered "predictions," guaranteed returns, or anything the app doesn't actually do. Don't oversell — "Free to start" and "built by a solo developer" are actually part of the trust pitch, not something to hide.

---

## 9. Full production guide

### Recommended structure (30–60 second promo)
1. **Hook (0–3s):** State the problem in one sentence, or show the "scattered spreadsheets" visual. Grab attention before anyone decides to skip.
2. **Solution intro (3–8s):** Name the product, show the dashboard's net worth hero number — the single most satisfying screen in the app.
3. **Core feature demo (8–30s):** 2–3 features max, each on screen for 3–6 seconds, each with one line of voiceover or on-screen text. Recommended combo: Import → Dashboard/Allocation → Financial Essentials Check.
4. **Secondary/differentiator beat (30–40s):** One privacy or pricing beat — this is what makes KashMap different from a generic budgeting app.
5. **CTA (last 5s):** Logo, tagline, and a clear call to action ("Get started free" / the signup URL). Keep it on screen long enough to actually read (minimum 3 seconds).

### Length guidance
- **15 seconds:** App-store/social ad cut — dashboard shot + one feature + logo/CTA. Use the short tagline-closer script above.
- **30 seconds:** Standard promo — hook, dashboard, one feature demo, CTA.
- **45–60 seconds:** Full explainer — use the full script in §6, can include the mobile-app beat and the privacy/pricing beat.

### Shot list checklist
- [ ] Cold open / problem statement (optional, stock footage or simple graphic is fine)
- [ ] Logo reveal / app name
- [ ] Dashboard — net worth number, hero metric
- [ ] Import flow — CSV drag-in, bank picker with logos, success state
- [ ] Portfolio / allocation donut chart
- [ ] Financial Essentials Check score card
- [ ] Quick report montage (3–4 report screens, fast cuts)
- [ ] Calculator (SIP) with an animated number
- [ ] Mobile app screen(s) — same dashboard on a phone
- [ ] Privacy/export screen (brief)
- [ ] Closing CTA card: tagline + "Get started free" + URL

### If you're prompting an AI video generator directly (not just ChatGPT for a script)
Break the script above into individual **scene prompts**, one per shot, each describing: the exact screen/UI element in frame, the camera movement (usually a slow zoom or static hold — this is a UI demo, not b-roll), the on-screen text overlay for that scene, and the duration in seconds. Keep each scene prompt self-contained (AI video tools generally don't retain context between scene generations), and specify "clean modern fintech dashboard UI, light background, blue/primary-color accents" as a consistent visual-style anchor across every scene prompt so the generated clips don't look stylistically disjointed when cut together.

### Practical note on getting real footage
The most convincing version of this video uses actual screen recordings of the live app (web at the signup/dashboard flow, and the mobile app), not AI-generated UI mockups — AI video tools are currently not reliable at rendering legible, consistent app UI (text, numbers, and charts tend to warp or hallucinate). If the goal is a polished promo, screen-record the real flows described in §5 and use ChatGPT / an AI tool for the script, voiceover, music selection, and captions rather than the UI visuals themselves.
