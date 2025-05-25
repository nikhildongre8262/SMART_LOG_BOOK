// Utility functions to get video thumbnails for YouTube and Vimeo

// Utility functions to get video thumbnails for YouTube and Vimeo

function getYoutubeThumbnail(url) {
  // Handles both youtube.com and youtu.be links
  let videoId = '';
  // Accept both youtube.com/watch?v= and youtu.be/ links
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/;
  const match = url.match(youtubeRegex);
  if (match && match[1]) {
    videoId = match[1];
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return '';
}

async function getVimeoThumbnail(url) {
  // Extract Vimeo ID
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const match = url.match(vimeoRegex);
  if (match && match[1]) {
    const videoId = match[1];
    // Vimeo API fetch
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const res = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`);
      const data = await res.json();
      return data[0].thumbnail_large;
    } catch (err) {
      return '';
    }
  }
  return '';
}

module.exports = { getYoutubeThumbnail, getVimeoThumbnail };
