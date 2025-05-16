// YouTube playlist utilities for Tabi OS Music Player

/**
 * Extracts the playlist ID from a YouTube playlist URL.
 * @param url The YouTube playlist URL
 * @returns The playlist ID or null if not found
 */
export function getYoutubePlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Fetches all video IDs and titles from a YouTube playlist using the YouTube Data API v3.
 * Requires a public API key with playlistItems read access.
 * @param playlistId The YouTube playlist ID
 * @param apiKey The YouTube Data API key
 * @param maxResults Maximum number of videos to fetch (default 200)
 * @returns Array of { id, title }
 */
export async function fetchYoutubePlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxResults = 200
): Promise<{ id: string; title: string }[]> {
  let videos: { id: string; title: string }[] = [];
  let nextPageToken = "";
  let fetched = 0;
  try {
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch playlist from YouTube API");
      const data = await res.json();
      if (data.items) {
        videos = videos.concat(
          data.items.map((item: unknown) => {
            const snippet = (item as { snippet: { resourceId: { videoId: string }, title: string } }).snippet;
            return {
              id: snippet.resourceId.videoId,
              title: snippet.title,
            };
          })
        );
        fetched += data.items.length;
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken && fetched < maxResults);
  } catch {
    // Optionally log or handle error
    return [];
  }
  return videos;
} 