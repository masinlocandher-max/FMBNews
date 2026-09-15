# Read Between the Headlines — Game Rules

Canonical editorial, progression, and anti-abuse rules for the FMB News weekly knowledge challenge.

## Purpose

Read Between the Headlines exists to make following the news more enjoyable and to reward understanding, not repeated guessing. The game should encourage players to read FMB News, remember context, and return for the next edition without turning the quiz into a points farm or a permanently visible site gimmick.

## 1. Timeliness standard

- Every edition is built around recently verified news.
- At least 24 of 30 questions must come from stories published or materially updated during the 7 days immediately before the edition is released.
- Up to 6 of 30 questions may use context from the previous 30 days, but only when that context directly explains a current story.
- Do not use old archive trivia simply to fill the bank.
- Do not phrase a scheduled or future event as if it has already happened.
- Every source must be rechecked before release. Any fact that changed, was corrected, was superseded, or cannot still be verified must be replaced before publication.
- The internal source map must record the source URL and verification date for every question cluster.

## 2. One visible challenge at a time

- The main FMB News navigation should expose only one quiz entry: **Weekly Challenge**.
- Do not create separate menu items for old editions.
- The menu entry should route the player to the one edition they are currently eligible to play: the current edition for a new player, a required catch-up edition if progression is incomplete, or the current status screen if already passed.
- Do not repeat the quiz as a persistent popup, takeover, or multiple homepage cards. A new-edition promotion may appear once in an editorially appropriate placement, then collapse to normal navigation.

## 3. Pass to progress

- Passing score: **21 correct out of 30 (70%)**.
- A new player may begin with the current edition; they are not forced to complete historical editions from before they joined.
- After a player starts the series, each later weekly edition remains locked until the immediately preceding required edition is passed.
- If a player misses one or more weeks, the system presents only the oldest required catch-up edition. Later editions remain locked until the chain is cleared.
- Passing an edition permanently unlocks the next required edition when it is released.

## 4. Attempts and points

- Each edition has only **one scored attempt**.
- The first completed or forfeited run is the scored attempt for that edition.
- Lifetime points can be added only from that first scored attempt. Replays never add more lifetime points.
- If the player does not reach 21/30, a **qualification retry** becomes available after a 24-hour cooldown.
- Qualification retries exist only to learn and unlock progression. They award **0 additional lifetime points**.
- A failed qualification retry starts another 24-hour cooldown. There is no benefit to rapid repeated guessing.
- Once an edition is passed, it cannot be replayed for points.

## 5. Question integrity

- Exactly 30 questions per edition.
- 30 seconds per question.
- 10 points per correct answer during the scored attempt; maximum scored-attempt total is 300.
- Question order is randomized. Multiple-choice option order is randomized.
- Select first, then lock the answer.
- Wrong, skipped, and timed-out questions do not reveal the correct answer.
- After a failed run, direct the player back to the relevant FMB News reading rather than exposing an answer key.

## 6. Run integrity

- Name and valid email are required before entry.
- Once a run starts, switching tabs/apps, hiding the page, refreshing, closing, or navigating away forfeits that run.
- A forfeited first run records 0 as the scored attempt. The player may still use a qualification retry after the normal cooldown.
- No public leaderboard is used while identity and scoring are device/client based.

## 7. Anti-abuse boundary

The current browser-only implementation can discourage casual abuse but cannot prevent a determined user from clearing storage, changing devices, opening developer tools, or manipulating client-side state. Production-grade enforcement requires a server-side attempt ledger and server-side scoring tied to a verified player identity.

When backend hardening is enabled, the minimum controls are:

- verified email or equivalent player identity;
- one canonical attempt record per player and edition;
- server-calculated score and pass/fail status;
- server-enforced 24-hour retry cooldown;
- rate limiting;
- no answer key sent to the browser before an answer is locked;
- immutable edition IDs and source manifests.

## 8. Product principle

The quiz is a learning feature, not the center of FMB News. Its success metric is not how many times one person can replay it. The desired behavior is: **read → play → learn → pass → return next week**.
