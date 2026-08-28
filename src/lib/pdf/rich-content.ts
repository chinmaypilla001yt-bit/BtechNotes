/* ------------------------------------------------------------------ *
 * Converts note HTML (TipTap output) into a pdfmake content tree.
 * Handles headings, lists, checklists, tables, images, blockquotes,
 * code blocks (with a language label + light syntax colouring) and
 * LaTeX maths (rendered with KaTeX and rasterised so the PDF shows the
 * real equation instead of raw LaTeX).
 * ------------------------------------------------------------------ */

type Any = Record<string, unknown>;

export interface RenderContext {
  includeCode: boolean;
  includeMath: boolean;
  includeImages: boolean;
  /** usable content width in pt */
  maxWidth: number;
  accent: string;
}

/* ----------------------------- images ----------------------------- */

const imageCache = new Map<string, { dataUrl: string; width: number; height: number } | null>();

async function loadImage(src: string) {
  if (imageCache.has(src)) return imageCache.get(src) ?? null;
  try {
    let dataUrl: string;
    if (src.startsWith("data:")) {
      dataUrl = src;
    } else {
      const res = await fetch(src, { mode: "cors" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(blob);
      });
    }
    const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("decode failed"));
      img.src = dataUrl;
    });
    const value = { dataUrl, ...dims };
    imageCache.set(src, value);
    return value;
  } catch {
    imageCache.set(src, null);
    return null;
  }
}

/* ------------------------------ maths ------------------------------ */

const mathCache = new Map<string, { dataUrl: string; width: number; height: number } | null>();

async function renderMath(latex: string, display: boolean) {
  const key = `${display ? "d" : "i"}:${latex}`;
  if (mathCache.has(key)) return mathCache.get(key) ?? null;
  try {
    const [{ default: katex }, { default: html2canvas }] = await Promise.all([
      import("katex"),
      import("html2canvas"),
    ]);
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;left:-10000px;top:0;background:#ffffff;color:#000000;padding:4px;font-size:20px;";
    host.innerHTML = katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      output: "html",
    });
    document.body.appendChild(host);
    // give webfonts a tick to settle
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = await html2canvas(host, { backgroundColor: "#ffffff", scale: 3, logging: false });
    document.body.removeChild(host);
    const value = {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width / 3,
      height: canvas.height / 3,
    };
    mathCache.set(key, value);
    return value;
  } catch {
    mathCache.set(key, null);
    return null;
  }
}

/* --------------------------- code blocks --------------------------- */

const KEYWORDS: Record<string, string[]> = {
  cpp: "alignas auto bool break case catch char class const constexpr continue default delete do double else enum explicit export extern false float for friend goto if inline int long namespace new nullptr operator private protected public return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void while include define using".split(
    " ",
  ),
  python: "and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield print".split(
    " ",
  ),
  java: "abstract boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static super switch synchronized this throw throws try void while true false null String System".split(
    " ",
  ),
  sql: "SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT AS AND OR NOT NULL PRIMARY KEY FOREIGN REFERENCES INDEX DISTINCT COUNT SUM AVG MIN MAX".split(
    " ",
  ),
  javascript: "async await break case catch class const continue default delete do else export extends false finally for from function if import in instanceof let new null return super switch this throw true try typeof var void while yield".split(
    " ",
  ),
};

const LANG_LABEL: Record<string, string> = {
  cpp: "C++",
  c: "C",
  python: "Python",
  py: "Python",
  java: "Java",
  sql: "SQL",
  javascript: "JavaScript",
  js: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
};

function highlight(code: string, lang: string) {
  const words = KEYWORDS[lang] ?? KEYWORDS[lang === "py" ? "python" : ""] ?? [];
  const runs: Any[] = [];
  const tokenRe = /(\/\/[^\n]*|#[^\n]*|"[^"\n]*"|'[^'\n]*'|\b\d+(?:\.\d+)?\b|[A-Za-z_]\w*|[\s\S])/g;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(code))) {
    const token = match[0];
    let color = "#1f2933";
    if (/^(\/\/|#)/.test(token)) color = "#6b7a86";
    else if (/^["']/.test(token)) color = "#0f766e";
    else if (/^\d/.test(token)) color = "#9a3412";
    else if (words.includes(token)) color = "#1d4ed8";
    runs.push({ text: token, color });
  }
  return runs;
}

function codeBlock(code: string, lang: string, ctx: RenderContext): Any {
  const language = LANG_LABEL[lang] ?? (lang ? lang.toUpperCase() : "Code");
  const body = code.replace(/\t/g, "    ").replace(/\s+$/, "");
  return {
    unbreakable: body.split("\n").length <= 22,
    margin: [0, 6, 0, 10],
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: language,
            style: "codeLabel",
            fillColor: "#e6ebf1",
            margin: [8, 4, 8, 4],
          },
        ],
        [
          {
            text: highlight(body, lang),
            style: "code",
            fillColor: "#f4f6f9",
            margin: [10, 8, 10, 8],
            preserveLeadingSpaces: true,
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#d5dce4",
      vLineColor: () => "#d5dce4",
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    _keepWithPrevious: true,
    _ctx: undefined as unknown,
    ...(ctx ? {} : {}),
  };
}

/* ----------------------------- inline ------------------------------ */

interface Marks {
  bold?: boolean;
  italics?: boolean;
  decoration?: string;
  color?: string;
  background?: string;
  link?: string;
  code?: boolean;
  sup?: boolean;
  sub?: boolean;
}

const MATH_SPLIT = /(\$\$[^$]+\$\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$[^$\n]+\$)/g;

function stripDelims(raw: string): { latex: string; display: boolean } | null {
  if (raw.startsWith("$$") && raw.endsWith("$$")) return { latex: raw.slice(2, -2), display: true };
  if (raw.startsWith("\\[")) return { latex: raw.slice(2, -2), display: true };
  if (raw.startsWith("\\(")) return { latex: raw.slice(2, -2), display: false };
  if (raw.startsWith("$") && raw.endsWith("$")) return { latex: raw.slice(1, -1), display: false };
  return null;
}

async function inlineNodes(node: Node, ctx: RenderContext, marks: Marks = {}): Promise<Any[]> {
  const out: Any[] = [];
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (!text) continue;
      const pieces = text.split(MATH_SPLIT).filter((p) => p !== "");
      for (const piece of pieces) {
        const math = ctx.includeMath ? stripDelims(piece) : null;
        if (math) {
          const rendered = await renderMath(math.latex, false);
          if (rendered) {
            const height = Math.min(rendered.height * 0.55, 22);
            const width = (rendered.width / rendered.height) * height;
            out.push({ image: rendered.dataUrl, width, height });
            continue;
          }
          out.push({ text: math.latex, italics: true });
          continue;
        }
        out.push({ text: piece, ...marks });
      }
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const next: Marks = { ...marks };
    if (tag === "strong" || tag === "b") next.bold = true;
    if (tag === "em" || tag === "i") next.italics = true;
    if (tag === "u") next.decoration = "underline";
    if (tag === "s" || tag === "del") next.decoration = "lineThrough";
    if (tag === "mark") next.background = "#fff3a3";
    if (tag === "code") next.code = true;
    if (tag === "sup") next.sup = true;
    if (tag === "sub") next.sub = true;
    if (tag === "a") {
      next.link = el.getAttribute("href") ?? "";
      next.color = ctx.accent;
      next.decoration = "underline";
    }
    if (tag === "br") {
      out.push({ text: "\n" });
      continue;
    }
    if (tag === "img") {
      const rendered = ctx.includeImages ? await loadImage(el.getAttribute("src") ?? "") : null;
      if (rendered) out.push(imageNode(rendered, ctx));
      continue;
    }
    const nested = await inlineNodes(el, ctx, next);
    for (const run of nested) {
      if (next.code && typeof run["text"] === "string") {
        run["style"] = "inlineCode";
      }
      if (next.sup) run["fontSize"] = 7;
      if (next.sub) run["fontSize"] = 7;
      out.push(run);
    }
  }
  return out;
}

function imageNode(img: { dataUrl: string; width: number; height: number }, ctx: RenderContext) {
  const maxW = ctx.maxWidth;
  const maxH = 420;
  let width = img.width * 0.75; // px -> pt
  let height = img.height * 0.75;
  const scale = Math.min(maxW / width, maxH / height, 1);
  width *= scale;
  height *= scale;
  return {
    image: img.dataUrl,
    width,
    height,
    alignment: "center",
    margin: [0, 8, 0, 8],
  };
}

/* ------------------------------ blocks ------------------------------ */

async function listItems(el: HTMLElement, ctx: RenderContext): Promise<Any[]> {
  const items: Any[] = [];
  for (const li of Array.from(el.children)) {
    if (li.tagName.toLowerCase() !== "li") continue;
    const element = li as HTMLElement;
    const checkbox = element.querySelector('input[type="checkbox"]');
    const checked =
      element.getAttribute("data-checked") === "true" ||
      (checkbox as HTMLInputElement | null)?.checked;
    const nestedLists = Array.from(element.children).filter((c) =>
      ["ul", "ol"].includes(c.tagName.toLowerCase()),
    ) as HTMLElement[];
    nestedLists.forEach((n) => n.remove());
    const runs = await inlineNodes(element, ctx);
    const prefix =
      element.hasAttribute("data-checked") || checkbox ? (checked ? "[x] " : "[ ] ") : "";
    const stack: Any[] = [{ text: prefix ? [{ text: prefix }, ...runs] : runs }];
    for (const nested of nestedLists) {
      const sub = await listItems(nested, ctx);
      stack.push(
        nested.tagName.toLowerCase() === "ol"
          ? { ol: sub, margin: [0, 2, 0, 0] }
          : { ul: sub, margin: [0, 2, 0, 0] },
      );
    }
    items.push(stack.length === 1 ? stack[0] : { stack });
  }
  return items;
}

async function tableNode(el: HTMLElement, ctx: RenderContext): Promise<Any> {
  const rows = Array.from(el.querySelectorAll("tr"));
  if (!rows.length) return { text: "" };
  const body: Any[][] = [];
  let headerRows = 0;
  for (const [index, row] of rows.entries()) {
    const cells = Array.from(row.children) as HTMLElement[];
    const isHeader = cells.every((c) => c.tagName.toLowerCase() === "th");
    if (isHeader && index === headerRows) headerRows += 1;
    const built: Any[] = [];
    for (const cell of cells) {
      built.push({
        text: await inlineNodes(cell, ctx),
        bold: isHeader,
        fillColor: isHeader ? "#eef2f7" : undefined,
        colSpan: Number(cell.getAttribute("colspan") ?? 1),
        rowSpan: Number(cell.getAttribute("rowspan") ?? 1),
      });
      const span = Number(cell.getAttribute("colspan") ?? 1);
      for (let i = 1; i < span; i += 1) built.push({});
    }
    body.push(built);
  }
  const columns = Math.max(...body.map((r) => r.length));
  body.forEach((r) => {
    while (r.length < columns) r.push({});
  });
  return {
    margin: [0, 6, 0, 10],
    table: {
      headerRows: headerRows || 0,
      dontBreakRows: true,
      keepWithHeaderRows: 1,
      widths: Array.from({ length: columns }, () => "*"),
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#c9d2dc",
      vLineColor: () => "#c9d2dc",
      paddingTop: () => 5,
      paddingBottom: () => 5,
      paddingLeft: () => 7,
      paddingRight: () => 7,
    },
  };
}

async function blockNode(el: HTMLElement, ctx: RenderContext): Promise<Any[]> {
  const tag = el.tagName.toLowerCase();

  if (tag === "pre") {
    if (!ctx.includeCode) return [];
    const code = el.querySelector("code");
    const cls = code?.getAttribute("class") ?? el.getAttribute("class") ?? "";
    const lang = (cls.match(/language-([\w+#]+)/)?.[1] ?? "").toLowerCase();
    return [codeBlock(code?.textContent ?? el.textContent ?? "", lang, ctx)];
  }

  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag[1]);
    return [
      {
        text: await inlineNodes(el, ctx),
        style: level <= 2 ? "noteH2" : level === 3 ? "noteH3" : "noteH4",
        headlineLevel: `body-${level}`,
      },
    ];
  }

  if (tag === "ul" || tag === "ol") {
    const items = await listItems(el, ctx);
    if (!items.length) return [];
    return [
      tag === "ol"
        ? { ol: items, margin: [0, 2, 0, 8] }
        : { ul: items, margin: [0, 2, 0, 8] },
    ];
  }

  if (tag === "table") return [await tableNode(el, ctx)];

  if (tag === "blockquote") {
    const inner: Any[] = [];
    for (const child of Array.from(el.children)) inner.push(...(await blockNode(child as HTMLElement, ctx)));
    if (!inner.length) inner.push({ text: await inlineNodes(el, ctx) });
    return [
      {
        margin: [0, 6, 0, 10],
        table: { widths: ["*"], body: [[{ stack: inner, margin: [10, 6, 8, 6], italics: true }]] },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: (i: number) => (i === 0 ? 3 : 0),
          vLineColor: () => ctx.accent,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
    ];
  }

  if (tag === "hr") {
    return [
      {
        margin: [0, 8, 0, 8],
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: ctx.maxWidth, y2: 0, lineWidth: 0.7, lineColor: "#d7dde5" },
        ],
      },
    ];
  }

  if (tag === "figure" || tag === "div") {
    const out: Any[] = [];
    for (const child of Array.from(el.children)) out.push(...(await blockNode(child as HTMLElement, ctx)));
    if (!out.length) {
      const runs = await inlineNodes(el, ctx);
      if (runs.length) out.push({ text: runs, style: "para" });
    }
    return out;
  }

  if (tag === "figcaption") {
    return [{ text: await inlineNodes(el, ctx), style: "caption" }];
  }

  if (tag === "img") {
    const rendered = ctx.includeImages ? await loadImage(el.getAttribute("src") ?? "") : null;
    return rendered ? [imageNode(rendered, ctx)] : [];
  }

  // paragraph-ish
  const onlyImage =
    el.children.length === 1 && el.children[0]?.tagName.toLowerCase() === "img" && !el.textContent?.trim();
  if (onlyImage) {
    const rendered = ctx.includeImages
      ? await loadImage((el.children[0] as HTMLElement).getAttribute("src") ?? "")
      : null;
    return rendered ? [imageNode(rendered, ctx)] : [];
  }

  const text = (el.textContent ?? "").trim();
  const displayMath = ctx.includeMath ? stripDelims(text) : null;
  if (displayMath?.display) {
    const rendered = await renderMath(displayMath.latex, true);
    if (rendered) {
      const scale = Math.min(ctx.maxWidth / (rendered.width * 0.7), 1);
      return [
        {
          image: rendered.dataUrl,
          width: rendered.width * 0.7 * scale,
          height: rendered.height * 0.7 * scale,
          alignment: "center",
          margin: [0, 8, 0, 10],
        },
      ];
    }
  }

  const runs = await inlineNodes(el, ctx);
  if (!runs.length) return [];
  return [{ text: runs, style: "para" }];
}

export async function htmlToPdfContent(html: string, ctx: RenderContext): Promise<Any[]> {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  const out: Any[] = [];
  for (const child of Array.from(doc.body.children)) {
    out.push(...(await blockNode(child as HTMLElement, ctx)));
  }
  if (!out.length) {
    const text = doc.body.textContent?.trim();
    if (text) out.push({ text, style: "para" });
  }
  return out;
}
