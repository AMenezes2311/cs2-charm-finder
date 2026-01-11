export const runtime = "nodejs";

import * as cheerio from "cheerio";

function toSteamUrl(csgoskinsUrl: string): string | null {
  try {
    const u = new URL(csgoskinsUrl);
    const slug = u.pathname.split("/").pop() || "";
    if (!slug.startsWith("charm-")) return null;

    // Remove "charm-" prefix
    const raw = slug.replace(/^charm-/, "");

    // Turn into words
    const words = raw.split("-");

    // Capitalize first letters (basic; tweak if you want special cases like FalleN preserved)
    const title = words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // Build Steam Market name
    const steamName = `Souvenir Charm | ${title}`;

    // Encode for Steam URL
    const encoded = encodeURIComponent(steamName);

    return `https://steamcommunity.com/market/listings/730/${encoded}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'url'" }), {
        status: 400,
      });
    }

    // Generate steam url immediately
    const steam = toSteamUrl(url);

    // Allow only csgoskins.gg for safety
    try {
      const u = new URL(url);
      if (u.hostname !== "csgoskins.gg") {
        return new Response(
          JSON.stringify({ error: "Only csgoskins.gg is allowed." }),
          { status: 400 }
        );
      }
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL." }), {
        status: 400,
      });
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (CharmScraper/1.0)" },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: `Fetch failed with ${res.status}` }),
        { status: res.status }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const seen = new Set<string>();
    const results: any[] = [];

    function cleanText(t?: string) {
      return (t || "").replace(/\s+/g, " ").trim();
    }

    function parsePrice(s: string | undefined) {
      if (!s) return null;
      const m = s.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/);
      return m ? Number(m[1]) : null;
    }

    $("a[href*='/items/charm-']").each((_, el) => {
      const a = $(el);
      const href = a.attr("href") || "";
      if (!href || seen.has(href)) return;

      const card = a.closest("article, div, li, section").first();
      const title =
        cleanText(
          card.find("h3, h2, .title, [class*='title']").first().text()
        ) ||
        cleanText(a.attr("title")) ||
        cleanText(a.text());

      const img = card.find("img").first();
      const image = img.attr("src") || img.attr("data-src") || null;

      let priceText = "";
      const textBlob = cleanText(card.text());
      const priceMatch = textBlob.match(/\$\s*[0-9]+(?:\.[0-9]{1,2})?/);
      if (priceMatch) priceText = priceMatch[0];
      const price = parsePrice(priceText);

      if (title == priceText) return;

      const rarity = cleanText(
        card.find(".rarity, [class*='rarity']").first().text()
      );
      const popularity = cleanText(
        card.find(".popularity, [class*='popularity']").first().text()
      );
      const rating = cleanText(
        card.find(".rating, [class*='rating']").first().text()
      );

      const absolute = href.startsWith("http")
        ? href
        : `https://csgoskins.gg${href}`;

      results.push({
        title: title || null,
        href: absolute,
        image,
        price,
        priceText: priceText || null,
        rarity: rarity || null,
        popularity: popularity || null,
        rating: rating || null,
        steam: toSteamUrl(absolute), // <-- attach Steam URL to each item
      });
      seen.add(href);
    });

    if (results.length === 0) {
      $("a:contains('Charm')").each((_, el) => {
        const a = $(el);
        const href = a.attr("href") || "";
        if (!href || seen.has(href)) return;
        if (!/\/items\/charm-/i.test(href)) return;
        const title = cleanText(a.text());
        const absolute = href.startsWith("http")
          ? href
          : `https://csgoskins.gg${href}`;
        results.push({ title, href: absolute, steam: toSteamUrl(absolute) });
        seen.add(href);
      });
    }

    const deduped = Object.values(
      results.reduce((acc: any, item) => {
        acc[item.href] = acc[item.href] || item;
        if (acc[item.href].price == null && item.price != null)
          acc[item.href] = item;
        return acc;
      }, {})
    ) as any[];

    return new Response(
      JSON.stringify({
        count: deduped.length,
        steam, // <-- top-level steam url for the original request
        items: deduped,
      }),
      {
        headers: { "content-type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
