"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  ExternalLink,
  Download,
  Filter,
  ArrowUpDown,
} from "lucide-react";

export default function Page() {
  const [url, setUrl] = useState(
    "https://csgoskins.gg/tournaments/2025-blast-austin/charm?order=highest_price"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"price" | "title">("price");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  async function scrape() {
    setLoading(true);
    setError(null);
    setItems([]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || `Request failed (${res.status})`);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items.filter(
      (it) => !q || (it.title || "").toLowerCase().includes(q)
    );
    const sorted = [...base].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "price") {
        const ap = a.price ?? -Infinity;
        const bp = b.price ?? -Infinity;
        return (ap - bp) * dir;
      }
      return (a.title || "").localeCompare(b.title || "") * dir;
    });
    return sorted;
  }, [items, query, sortKey, sortDir]);

  function exportCSV() {
    const headers = [
      "Title",
      "URL",
      "Price",
      "PriceText",
      "Rarity",
      "Popularity",
      "Rating",
      "Image",
    ];
    const rows = filtered.map((it) => [
      wrapCSV(it.title),
      wrapCSV(it.href),
      it.price ?? "",
      wrapCSV(it.priceText || ""),
      wrapCSV(it.rarity || ""),
      wrapCSV(it.popularity || ""),
      wrapCSV(it.rating || ""),
      wrapCSV(it.image || ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "charms.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function wrapCSV(s: string) {
    const needs = /[\",\\n]/.test(s);
    return needs ? `"${s.replace(/\"/g, '""')}"` : s;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Universal CS2 Charm Scraper
            </h1>
            <p className="text-sm text-neutral-600">
              Paste any <span className="font-mono">csgoskins.gg</span> URL
              (tournament charms page) and list every charm found.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportCSV}
              variant="secondary"
              disabled={!filtered.length}
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </header>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Source URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                // value={url}
                onChange={(e) =>
                  setUrl(
                    "https://csgoskins.gg/tournaments/2025-blast-austin/charm?query=" +
                      e.target.value +
                      "&price_min=&price_max=&association=&rarity_misc=&player=&map=&order=popularity"
                  )
                }
                placeholder="Player name, e.g. s1mple"
              />
              <Button onClick={scrape} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                {loading ? "Scraping..." : "Fetch charms"}
              </Button>
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Results <Badge variant="secondary">{filtered.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <Input
                className="w-full"
                placeholder="Filter by title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  onClick={() =>
                    setSortKey(sortKey === "price" ? "title" : "price")
                  }
                >
                  <Filter className="w-4 h-4 mr-2" /> Sort by{" "}
                  {sortKey === "price" ? "Title" : "Price"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />{" "}
                  {sortDir.toUpperCase()}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((it) => (
                <div
                  key={it.href}
                  className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col"
                >
                  <div className="aspect-video bg-neutral-100 rounded-xl overflow-hidden mb-3">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.title || "Charm"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-neutral-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-medium line-clamp-2" title={it.title}>
                      {it.title || "Untitled charm"}
                    </div>
                    <div className="text-sm text-neutral-600 flex flex-wrap gap-2 mt-1">
                      {it.price != null && (
                        <Badge variant="outline">${it.price.toFixed(2)}</Badge>
                      )}
                      {it.price == null && it.priceText && (
                        <Badge variant="outline">{it.priceText}</Badge>
                      )}
                      {it.rarity && (
                        <Badge variant="secondary">{it.rarity}</Badge>
                      )}
                      {it.popularity && (
                        <Badge variant="secondary">{it.popularity}</Badge>
                      )}
                      {it.rating && (
                        <Badge variant="secondary">{it.rating}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <a
                      href={it.href}
                      target="_blank"
                      className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    >
                      View item <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-auto border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Price text</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Popularity</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => (
                    <TableRow key={it.href}>
                      <TableCell className="min-w-[240px]">
                        {it.title}
                      </TableCell>
                      <TableCell>
                        {it.price != null ? `$${it.price.toFixed(2)}` : ""}
                      </TableCell>
                      <TableCell>{it.priceText || ""}</TableCell>
                      <TableCell>{it.rarity || ""}</TableCell>
                      <TableCell>{it.popularity || ""}</TableCell>
                      <TableCell>{it.rating || ""}</TableCell>
                      <TableCell className="min-w-[260px]">
                        <a
                          className="text-blue-600 hover:underline"
                          href={it.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {it.href}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-neutral-500 pt-4">
          <p>
            Note: This demo uses a best-effort parser against public HTML. If
            the site structure changes, selectors may need updates. Only{" "}
            <span className="font-mono">csgoskins.gg</span> is allowed by the
            API for safety.
          </p>
        </footer>
      </div>
    </div>
  );
}
