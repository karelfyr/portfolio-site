#!/bin/zsh
# Encodes a Decathlon master into the files the site serves (see README).
#   zsh scripts/decathlon-video/web.sh <master.mp4> <desktop|phone>
set -e
src=$1; cut=$2; out=public/videos/decathlon-$cut
ffmpeg -v error -y -i $src -an -c:v libx265 -preset slow -crf 24 -pix_fmt yuv420p -tag:v hvc1 \
  -x265-params log-level=error:keyint=240:min-keyint=240 -movflags +faststart $out-hevc.mp4
ffmpeg -v error -y -i $src -an -vf fps=60 -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -profile:v high \
  -g 120 -movflags +faststart $out-avc.mp4
ffmpeg -v error -y -i $out-hevc.mp4 -frames:v 1 -vf scale=64:-1:flags=area -q:v 4 \
  src/sections/decathlon/assets/loading-$cut.jpg
ls -la $out-hevc.mp4 $out-avc.mp4
