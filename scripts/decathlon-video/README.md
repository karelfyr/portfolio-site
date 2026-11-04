# Decathlon clip – Safari's video

Safari plays a recording of the Decathlon clip instead of the live one (it holds script-driven
motion to 60 fps and can't keep GPU animations of the scene right while the page scrolls). Every
other browser runs the clip live. Whenever the animation changes, record both cuts again:

```bash
npm run dev   # in another terminal – the recorder loads the clip from it
node scripts/decathlon-video/record.mjs desktop /tmp/dk-desktop
node scripts/decathlon-video/record.mjs phone /tmp/dk-phone
swift scripts/decathlon-video/encode.swift /tmp/dk-desktop /tmp/dk-desktop.mp4 120 0.9   # master
swift scripts/decathlon-video/encode.swift /tmp/dk-phone /tmp/dk-phone.mp4 120 0.9
zsh scripts/decathlon-video/web.sh /tmp/dk-desktop.mp4 desktop   # the files the site serves
zsh scripts/decathlon-video/web.sh /tmp/dk-phone.mp4 phone
```

- The recorder opens `/works/decathlon?render` in headless Chrome and draws every frame of one loop
  at 120 fps (desktop 2560 × 1800, phone 1290 × 2064). `LIMIT=12` records only the first frames, for
  a quick check.
- `encode.swift` makes a high-quality master with the Mac's hardware HEVC encoder. `web.sh` turns it
  into what the site serves, in `public/videos/`: `decathlon-<cut>-hevc.mp4` (x265, 120 fps, for
  Apple devices, ~11 MB) and `decathlon-<cut>-avc.mp4` (x264, 60 fps, for every other browser –
  Android phones often can't decode HEVC – ~6 MB), plus the tiny first frame the page shows blurred
  while the video downloads (`src/sections/decathlon/assets/loading-<cut>.jpg`). CRF 24 / 23 keep
  the pale chip edges clean during the dive; at 28 / 27 they turn blocky.
- The page downloads the whole file before playing, so it never stalls mid-loop.
- Each recording is one exact loop, so the video loops seamlessly.
