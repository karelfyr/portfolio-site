# Decathlon clip – Safari's video

Safari plays a recording of the Decathlon clip instead of the live one (it holds script-driven
motion to 60 fps and can't keep GPU animations of the scene right while the page scrolls). Every
other browser runs the clip live. Whenever the animation changes, record both cuts again:

```bash
npm run dev   # in another terminal – the recorder loads the clip from it
node scripts/decathlon-video/record.mjs desktop /tmp/dk-desktop
node scripts/decathlon-video/record.mjs phone /tmp/dk-phone
swift scripts/decathlon-video/encode.swift /tmp/dk-desktop public/videos/decathlon-desktop.mp4 120 0.7
swift scripts/decathlon-video/encode.swift /tmp/dk-phone public/videos/decathlon-phone.mp4 120 0.7
```

- The recorder opens `/works/decathlon?render` in headless Chrome and draws every frame of one loop
  at 120 fps (desktop 2560 × 1800, phone 1290 × 2064). `LIMIT=12` records only the first frames, for
  a quick check.
- The encoder uses the Mac's hardware HEVC encoder (MP4, playable while it downloads). Quality 0.7
  keeps even the fastest camera moves clean (about 23 MB per cut); 0.6 and below show blocking on
  the pale chip edges during the dive.
- Each recording is one exact loop, so the video loops seamlessly.
