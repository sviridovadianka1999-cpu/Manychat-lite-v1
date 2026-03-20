import { env } from "@/src/config/env";

function normalizeInstagramLink(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString();
  } catch {
    return "";
  }
}

type MediaItem = { id: string; permalink?: string; media_product_type?: string };

async function fetchAccountMedia(): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  let nextUrl = `https://graph.facebook.com/${env.META_GRAPH_VERSION}/me/media?fields=id,permalink,media_product_type&limit=100`;

  for (let i = 0; i < 5 && nextUrl; i++) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` }
    });

    if (!res.ok) {
      throw new Error(`media_list_failed:${res.status}`);
    }

    const data = await res.json();
    const batch = Array.isArray(data?.data) ? data.data : [];
    for (const item of batch) {
      items.push({
        id: String(item?.id ?? ""),
        permalink: typeof item?.permalink === "string" ? item.permalink : undefined,
        media_product_type: typeof item?.media_product_type === "string" ? item.media_product_type : undefined
      });
    }

    nextUrl = typeof data?.paging?.next === "string" ? data.paging.next : "";
  }

  return items;
}

export async function resolveInstagramMediaLinks(links: string[]) {
  const normalizedLinks = links
    .map((link) => normalizeInstagramLink(link))
    .filter((link) => link.length > 0);

  if (normalizedLinks.length === 0) {
    return { links: [], resolvedMediaIds: [], unresolvedLinks: [], error: undefined as string | undefined };
  }

  try {
    const media = await fetchAccountMedia();
    const permalinkToId = new Map<string, string>();

    for (const item of media) {
      const permalink = normalizeInstagramLink(item.permalink ?? "");
      if (permalink) permalinkToId.set(permalink, item.id);
    }

    const resolvedMediaIds: string[] = [];
    const unresolvedLinks: string[] = [];

    for (const link of normalizedLinks) {
      const mediaId = permalinkToId.get(link);
      if (mediaId) resolvedMediaIds.push(mediaId);
      else unresolvedLinks.push(link);
    }

    return {
      links: normalizedLinks,
      resolvedMediaIds: [...new Set(resolvedMediaIds)],
      unresolvedLinks,
      error: undefined as string | undefined
    };
  } catch (error) {
    return {
      links: normalizedLinks,
      resolvedMediaIds: [],
      unresolvedLinks: normalizedLinks,
      error: String(error)
    };
  }
}
