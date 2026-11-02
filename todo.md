# TODO

- [x] plan design based on readme.md
- [x] concretise design tasks here under '## Design'
- [x] plan implementation based on first design draft
- [x] concretise impl tasks here under '## Implementation'

## Design

Two alternatives, split on distractor production weight -- the one axis the readme
flags as a real tradeoff (TV flashiness vs. build/runtime risk). Everything else is
shared, decided once.

Shared core:
- [ ] vowel/consonant (or similar) target-detection stream, scrolling upward,
      parameterised scroll speed
- [ ] two-key response (target / non-target), e.g. left/right arrows
- [ ] progress readout: keep the text version, add a visual bar -- has to look
      serious even though no real data is collected
- [ ] static-site browser delivery (e.g. GitHub Pages), no install needed on the
      TV crew's machine
- [ ] TV-friendly results screen: side-by-side comparison of a distracted vs. an
      undistracted participant's stats

Alternative A -- Lean (text distractor):
- [ ] scrolling text-feed distractor, same mechanism as the main experiment's
      static/scroll-text-flash pattern
- [ ] pros: fast to build, nothing to load/buffer, closer to the real research
      instrument
- [ ] cons: weaker visual hook for a TV audience

Alternative B -- Showcase (image/video distractor):
- [ ] rotating image/short-video distractor, social-media style, with motion
- [ ] pros: stronger visual pitch for editors
- [ ] cons: heavier build (asset pipeline, autoplay/sound permissions, buffering
      risk on venue wifi), more that can break live on set

Decision (resolved): build both to demo stage, then capture a video of each running
and send that to the TV editors so they can pick and come back with change
requests, rather than deciding internally first.

## Implementation

Tech stack: vanilla HTML/CSS/JS with p5.js for the stream/canvas rendering and
distractor animation -- matches the project's own WP5 webapp tool choice (CLAUDE.md),
needs no build step, and deploys as a static site by just serving the folder.

Content constraint: nothing in either alternative (text-feed items, images, video
clips) may carry copyright or licensing exposure -- this airs on TV. Use only
self-authored/public-domain/openly-licensed (e.g. CC0) material, same spirit as the
self-generated trivia items the main experiment's feed.py already uses for its text
distractor. No scraped social-media content, stock footage without a clear licence,
or recognisable logos/branding in the Showcase alternative's assets.

Structure:
- [ ] `/shared/` -- core stream engine (target/non-target generation, upward
      scroll, parameterised speed), key capture, scoring, progress readout
      (text + bar), results screen
- [ ] `/lean/` -- Alternative A: text-feed distractor module (reuses the main
      experiment's static/scroll-text-flash pattern), its own index.html wiring
      in the shared core
- [ ] `/showcase/` -- Alternative B: image/video distractor module + `/assets/`,
      its own index.html wiring in the shared core
- [ ] results/comparison storage: two runs (distracted vs. undistracted) held
      long enough in-session to render the side-by-side comparison screen

Task breakdown:
- [ ] core stream engine: target/non-target stream generation, scroll animation,
      scroll-speed parameter, two-key capture, scoring
- [ ] progress readout wired to stream progress (text + bar)
- [ ] Alternative A distractor module (text feed)
- [ ] Alternative B distractor module (image/video rotation, autoplay handling)
- [ ] results screen: single-run stats, then side-by-side comparison mode
- [ ] hosting setup: repo + static-site hosting (e.g. GitHub Pages), confirm it
      loads cleanly on an unfamiliar machine/network before relying on it on set
- [ ] screen-record a demo run of each alternative, package for the TV editors
