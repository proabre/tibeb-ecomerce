export function hasValidProductImages(images) {
  return Array.isArray(images) && images.length >= 2 && images.length <= 5;
}

export function hasValidOptionalProductVideos(videos) {
  return videos === undefined || (Array.isArray(videos) && videos.length <= 3);
}
