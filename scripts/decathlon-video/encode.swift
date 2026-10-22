// Encodes recorded frames (f00000.png …) into an HEVC MP4 with the Mac's hardware encoder.
//
//   swift scripts/decathlon-video/encode.swift <framesDir> <out.mp4> <fps> <quality 0…1, or bits/s>
//
// A quality (e.g. 0.6) keeps every frame equally clean – fast camera moves get the bits they need,
// still stretches cost almost nothing; a bitrate (e.g. 6000000) fixes the average instead.
import AVFoundation
import CoreGraphics
import Foundation
import ImageIO

let args = CommandLine.arguments
guard args.count == 5, let fps = Int32(args[3]), let rate = Double(args[4]) else {
  print("usage: encode.swift <framesDir> <out.mp4> <fps> <quality 0…1, or bits/s>")
  exit(1)
}
let target: [String: Any] = rate <= 1 ? [AVVideoQualityKey: rate] : [AVVideoAverageBitRateKey: Int(rate)]
let dir = URL(fileURLWithPath: args[1])
let out = URL(fileURLWithPath: args[2])
let files = try FileManager.default.contentsOfDirectory(atPath: dir.path).filter { $0.hasSuffix(".png") }.sorted()
guard let first = files.first,
  let src0 = CGImageSourceCreateWithURL(dir.appendingPathComponent(first) as CFURL, nil),
  let img0 = CGImageSourceCreateImageAtIndex(src0, 0, nil)
else { print("no frames"); exit(1) }
let width = img0.width
let height = img0.height

try? FileManager.default.removeItem(at: out)
let writer = try AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true  // playable while it downloads
let input = AVAssetWriterInput(
  mediaType: .video,
  outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.hevc,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: target.merging([
      AVVideoExpectedSourceFrameRateKey: fps,
      AVVideoMaxKeyFrameIntervalKey: Int(fps) * 2,
    ]) { a, _ in a },
  ])
input.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: input,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
  ])
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

for (i, name) in files.enumerated() {
  guard let src = CGImageSourceCreateWithURL(dir.appendingPathComponent(name) as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { continue }
  while !input.isReadyForMoreMediaData { usleep(1000) }
  var buffer: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
  guard let pb = buffer else { continue }
  CVPixelBufferLockBaseAddress(pb, [])
  let ctx = CGContext(
    data: CVPixelBufferGetBaseAddress(pb), width: width, height: height, bitsPerComponent: 8,
    bytesPerRow: CVPixelBufferGetBytesPerRow(pb), space: CGColorSpace(name: CGColorSpace.sRGB)!,
    bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  ctx.draw(img, in: CGRect(x: 0, y: 0, width: width, height: height))
  CVPixelBufferUnlockBaseAddress(pb, [])
  adaptor.append(pb, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: fps))
  if i % 240 == 0 { print("  \(i)/\(files.count)") }
}
input.markAsFinished()
let done = DispatchSemaphore(value: 0)
writer.finishWriting { done.signal() }
done.wait()
if writer.status == .completed {
  let size = (try FileManager.default.attributesOfItem(atPath: out.path)[.size] as? Int) ?? 0
  print("wrote \(out.lastPathComponent): \(width)×\(height), \(files.count) frames @ \(fps) fps, \(size / 1_000_000) MB")
} else {
  print("failed: \(writer.error?.localizedDescription ?? "?")")
  exit(1)
}
