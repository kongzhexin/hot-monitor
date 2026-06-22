import Parser from "rss-parser";

const parser = new Parser({ timeout: 10000 });

const SOURCES = [
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml" },
  { name: "Anthropic News", url: "https://www.anthropic.com/news/rss.xml" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "InfoQ AI", url: "https://www.infoq.com/ai-ml-data-eng/feed/" },
];

function normalize(source, item) {
  return {
    id: item.guid || item.id || item.link,
    title: item.title || "",
    summary: item.contentSnippet || item.content || item.summary || "",
    link: item.link || "",
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    source,
  };
}

export async function fetchCandidates() {
  const all = [];

  await Promise.all(
    SOURCES.map(async (src) => {
      try {
        const feed = await parser.parseURL(src.url);
        const items = (feed.items || [])
          .slice(0, 12)
          .map((item) => normalize(src.name, item));
        all.push(...items);
      } catch {
        // Isolate source failures.
      }
    }),
  );

  return all;
}
