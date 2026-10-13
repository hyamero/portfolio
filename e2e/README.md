# Browser checks

Playwright checks for what unit tests can't see: the live WebGPU sky, scroll motion, layout and contrast. They need a GPU, so they run locally, not in CI.

```sh
bunx playwright install chromium firefox webkit   # once
bun run build && bun run start                    # in another terminal: a prod build on :3000
bun run e2e                                       # all suites; or `bun run e2e voyage`
node e2e/voyage.mjs test_frames test_link_rows    # single tests
```

`URL=http://localhost:3007/` points any script at another server. Screenshots land in `e2e/out/`.

| Suite | Covers |
| --- | --- |
| `voyage.mjs` | Lenis, navigation, the cursor light, frame times, mobile layout. `BROWSER=webkit` for WebKit. |
| `eclipse.mjs` | The planet-to-horizon camera, the resting horizon, the ground layer, reduced motion. |
| `polish-planet.mjs` | The sky polish round: signal, CSS sky handover, contrast, dawn. |
| `lost.mjs` | The 404's lost orb: the empty wordmark, the drift, the dodge, the flight home, reduced motion, phones. |

Tools for sky work:

- `perf.mjs [desktop|mobile]`: load cost, main-thread time and GPU latency, idle and scrolling.
- `bench.mjs`: GPU latency per frame at fixed scroll spots; `SWEEP=1` scrolls instead of moving the pointer.
- `same.mjs`: pixel diff of two servers (`A`, `B`) under reduced motion. A sky refactor or optimisation should report `0px` everywhere.

Every script imports Playwright through `no-mail.mjs`, which cancels `mailto:` navigations: otherwise a click on Email opens the system's mail app. Keep it that way.
