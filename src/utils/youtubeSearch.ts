export async function searchYoutube(query: string) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) throw new Error("Missing YouTube API key");
    const url =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${
            encodeURIComponent(query)
        }&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];
    type YoutubeItem = {
        id: { videoId: string };
        snippet: {
            title: string;
            thumbnails: { default: { url: string } };
        };
    };
    return data.items.map((item: YoutubeItem) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url,
    }));
}
