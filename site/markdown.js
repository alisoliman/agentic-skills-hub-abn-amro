"use strict";

// Build DOM nodes instead of interpreting HTML from skill files.
function markdownInline(parent, text, baseUrl) {
  const pattern = /(`[^`]+`|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parent.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[0].startsWith("`")) {
      parent.append(el("code", {}, match[0].slice(1, -1)));
    } else if (match[2]) {
      let url;
      try {
        url = new URL(match[3], baseUrl);
      } catch {
        url = null;
      }
      if (url && (url.protocol === "https:" || url.protocol === "http:")) {
        parent.append(el("a", { href: url.href, rel: "noreferrer" }, match[2]));
      } else {
        parent.append(document.createTextNode(match[2]));
      }
    } else {
      parent.append(el(match[4] ? "strong" : "em", {}, match[4] || match[5]));
    }
    cursor = match.index + match[0].length;
  }
  parent.append(document.createTextNode(text.slice(cursor)));
}

function renderMarkdown(container, markdown, baseUrl) {
  const lines = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end !== -1) {
      const pre = el("pre");
      pre.append(el("code", {}, lines.slice(0, end + 1).join("\n")));
      container.append(pre);
      i = end + 1;
    }
  }
  const addText = (tag, text, parent = container) => {
    const node = el(tag);
    markdownInline(node, text, baseUrl);
    parent.append(node);
    return node;
  };
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*```/.test(line)) {
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      const pre = el("pre");
      pre.append(el("code", {}, code.join("\n")));
      container.append(pre);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      addText(`h${Math.min(heading[1].length + 2, 6)}`, heading[2]);
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
      const table = el("table");
      const head = el("thead");
      const headerRow = el("tr");
      cells(line).forEach((cell) => addText("th", cell, headerRow));
      head.append(headerRow);
      table.append(head);
      const body = el("tbody");
      i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        const row = el("tr");
        cells(lines[i++]).forEach((cell) => addText("td", cell, row));
        body.append(row);
      }
      table.append(body);
      const wrapper = el("div", { class: "table-scroll" });
      wrapper.append(table);
      container.append(wrapper);
      continue;
    }
    const listMatch = line.match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const list = el(ordered ? "ol" : "ul");
      while (i < lines.length) {
        const item = lines[i].match(/^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        addText("li", item[3], list);
        i++;
      }
      container.append(list);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = el("blockquote");
      const parts = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) parts.push(lines[i++].replace(/^>\s?/, ""));
      addText("p", parts.join(" "), quote);
      container.append(quote);
      continue;
    }
    const paragraph = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(?:#{1,6}\s|```|>\s?|\s*(?:[-*+]|\d+\.)\s)/.test(lines[i])) {
      if (lines[i].includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) break;
      paragraph.push(lines[i++]);
    }
    addText("p", paragraph.join(" "));
  }
}
