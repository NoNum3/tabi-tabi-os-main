// Utility for Bookmarks Export/Import (Netscape Bookmarks HTML format)

export interface ExportBookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  favicon_url?: string;
  add_date?: number;
  tags?: string[];
  is_favorite?: boolean;
}

export interface ExportFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  add_date?: number;
  children: (ExportFolder | ExportBookmark)[];
}

// --- Export ---
export function generateNetscapeBookmarksHTML(folders: ExportFolder[]): string {
  function renderFolder(folder: ExportFolder): string {
    const addDate = folder.add_date || Math.floor(Date.now() / 1000);
    let html = `<DT><H3 ADD_DATE="${addDate}">${escapeHtml(folder.name)}</H3>\n<DL><p>\n`;
    for (const child of folder.children) {
      if ("url" in child) {
        html += renderBookmark(child as ExportBookmark);
      } else {
        html += renderFolder(child as ExportFolder);
      }
    }
    html += `</DL><p>\n`;
    return html;
  }
  function renderBookmark(b: ExportBookmark): string {
    const addDate = b.add_date || Math.floor(Date.now() / 1000);
    const icon = b.favicon_url ? ` ICON="${escapeHtml(b.favicon_url)}"` : "";
    return `<DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${addDate}"${icon}>${escapeHtml(b.title)}</A>\n`;
  }
  function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c));
  }
  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<!-- This is an automatically generated file. -->\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n${folders.map(renderFolder).join("")}\n</DL><p>\n`;
}

// --- Import ---
// Parse Netscape Bookmarks HTML into folder/bookmark objects (basic, robust for browser exports)
export async function parseNetscapeBookmarksHTML(html: string): Promise<ExportFolder[]> {
  // Use DOMParser in browser, fallback to regex for Node (for now, browser only)
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const rootDL = doc.querySelector("DL");
  if (!rootDL) return [];
  function parseDL(dl: Element, parentId: string | null = null): ExportFolder[] {
    const folders: ExportFolder[] = [];
    let currentFolder: ExportFolder | null = null;
    for (const el of Array.from(dl.children)) {
      if (el.tagName === "DT") {
        const h3 = el.querySelector("H3");
        if (h3) {
          // Folder
          currentFolder = {
            id: crypto.randomUUID(),
            name: h3.textContent || "Untitled Folder",
            add_date: +(h3.getAttribute("ADD_DATE") || Date.now()/1000),
            children: [],
            parent_id: parentId,
          };
          // Next sibling should be DL (children)
          const next = el.nextElementSibling;
          if (next && next.tagName === "DL") {
            currentFolder.children = parseDL(next, currentFolder.id);
          }
          folders.push(currentFolder);
        } else {
          // Bookmark
          const a = el.querySelector("A");
          if (a) {
            const bookmark: ExportBookmark = {
              id: crypto.randomUUID(),
              url: a.getAttribute("HREF") || "",
              title: a.textContent || "Untitled",
              favicon_url: a.getAttribute("ICON") || undefined,
              add_date: +(a.getAttribute("ADD_DATE") || Date.now()/1000),
            };
            if (folders.length > 0) {
              folders[folders.length-1].children.push(bookmark);
            } else {
              // Orphan bookmark, wrap in a folder
              folders.push({
                id: crypto.randomUUID(),
                name: "Imported Bookmarks",
                children: [bookmark],
              });
            }
          }
        }
      }
    }
    return folders;
  }
  return parseDL(rootDL);
} 