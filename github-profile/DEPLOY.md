# Publishing this profile

This folder is a complete, ready-to-push copy of the `lakotafox/lakotafox`
profile repository (the repo has to be named exactly the GitHub username —
that's what makes its README show on the profile page).

The `svg/stats-*`, `streak-*`, `langs-*`, `year-*` files currently hold
mock data; the workflow replaces them with real numbers on its first run.

## Steps

1. Create the repo: https://github.com/new — name `lakotafox`, **public**,
   no README/license (empty).
2. Push this folder's contents to `main`:

   ```sh
   cd github-profile
   git init -b main
   git add -A && git commit -m "self-generating profile"
   git remote add origin https://github.com/lakotafox/lakotafox.git
   git push -u origin main
   ```

3. Run the stats workflow once (Actions tab → "refresh stats" → Run
   workflow), or just wait for the nightly cron at 05:17 UTC. It commits
   real stats SVGs and then only commits again when numbers change.
4. If the README doesn't show on the profile immediately, edit it once in
   the web UI — a brand-new profile README can be cached.

## Manual bits GitHub gives no API for

- Display name: Settings → Public profile → Name → "Lakota Fox"
  (currently renders as "lakota lakotafox").
- Bio: same page.
- Pinned repos: profile page → "Customize your pins".

## Regenerating locally

- `python3 scripts/generate_portrait.py` — portrait (needs pillow, numpy,
  scipy; reads `assets/skull-source.jpg`).
- `python3 scripts/generate_headings.py` — section headings.
- `python3 scripts/generate_stats.py --mock` — stats layout with fake data.
  Without `--mock` it needs `GITHUB_TOKEN` and `GH_LOGIN` env vars; in CI
  the workflow provides both. Don't run the real thing locally — let the
  action own the generated stats files, or you'll trade merge conflicts.
