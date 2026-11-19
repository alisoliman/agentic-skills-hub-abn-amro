const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

class Element {
  constructor(tag, text = "") {
    this.tag = tag;
    this.textContent = text;
    this.attributes = {};
    this.dataset = {};
    this.children = [];
    this.events = {};
    this.hidden = false;
    this.classList = { add() {}, toggle() {} };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.events[name] = callback; }
  remove() { this.removed = true; }
  querySelector(selector) { return this.parts[selector]; }
}

function setup(pathname) {
  const hero = new Element("header");
  hero.parts = { ".signal-panel": new Element("aside"), ".hero-actions": new Element("div") };
  const main = new Element("main");
  const elements = { ".hero": hero, "#catalog": main, "#hub-title": new Element("h1"), "#hub-tagline": new Element("p") };
  const context = vm.createContext({
    URL,
    window: { location: { pathname } },
    document: {
      createElement: (tag) => new Element(tag),
      createTextNode: (text) => new Element("#text", text),
      querySelector: (selector) => elements[selector] || null,
    },
    fetch: () => new Promise(() => {}),
  });
  for (const file of ["markdown.js", "app.js"]) {
    vm.runInContext(readFileSync(path.join(__dirname, "../site", file), "utf8"), context);
  }
  return { context, main, elements };
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

const local = {
  name: "sample", title: "Sample", kind: "local", license: "MIT", source: "Upstream",
  upstreamUrl: "https://example.com/source", description: "What", whenToUse: "When",
  installCommand: "install sample", content: "---\r\nname: sample\r\n---\r\n# Instructions\r\n\r\n[Guide](guide.md)\r\n",
};

test("detail page renders local instructions and switches to the exact raw file", () => {
  const { context, main } = setup("/skills/sample");
  context.skill = local;
  vm.runInContext("state.config = { title: 'Hub', repo: 'o/r' }; state.build = { sha: 'abcdef1' }; state.skills = [skill]; renderDetail()", context);
  const nodes = descendants(main);
  assert.ok(nodes.some((n) => n.textContent === "What"));
  assert.ok(nodes.some((n) => n.textContent === "When"));
  assert.ok(nodes.some((n) => n.attributes.href === "https://github.com/o/r/blob/abcdef1/skills/sample/SKILL.md"));
  assert.ok(nodes.some((n) => n.attributes.href === "https://example.com/source"));
  assert.ok(nodes.some((n) => n.attributes.href === "https://github.com/o/r/blob/abcdef1/skills/sample/guide.md"));
  const rendered = nodes.find((n) => n.className === "markdown-body");
  const raw = nodes.find((n) => n.className === "raw-file");
  const rawButton = nodes.find((n) => n.textContent === "Raw");
  assert.equal(raw.children[0].textContent, local.content);
  assert.equal(raw.hidden, false); // mock does not reflect the HTML hidden attribute
  assert.ok("hidden" in raw.attributes);
  rawButton.events.click();
  assert.equal(raw.hidden, false);
  assert.equal(rendered.hidden, true);
  assert.equal(rawButton.attributes["aria-pressed"], "true");
  nodes.find((n) => n.textContent === "Rendered").events.click();
  assert.equal(raw.hidden, true);
  assert.equal(rendered.hidden, false);
});

test("external and unknown routes do not show local instructions", () => {
  const external = { ...local, kind: "external", url: "https://example.com/skill" };
  const { context, main, elements } = setup("/skills/sample/");
  context.skill = external;
  vm.runInContext("state.config = { title: 'Hub', repo: 'o/r' }; state.skills = [skill]; renderDetail()", context);
  assert.ok(descendants(main).some((n) => n.attributes.href === external.url));
  assert.ok(!descendants(main).some((n) => n.className === "raw-file"));
  context.window.location.pathname = "/skills/unknown";
  vm.runInContext("renderDetail()", context);
  assert.equal(elements["#hub-title"].textContent, "Skill not found");
});

test("markdown creates safe nodes for links, tables and code", () => {
  const { context } = setup("/");
  context.root = new Element("div");
  vm.runInContext("renderMarkdown(root, '# Heading\\n\\n[x](javascript:alert)\\n\\n| A | B |\\n| --- | --- |\\n| C | D |\\n\\n```js\\n<script>\\n```', 'https://example.com/base/')", context);
  const nodes = descendants(context.root);
  assert.ok(nodes.some((n) => n.tag === "h3" && n.children[0].textContent === "Heading"));
  assert.ok(nodes.some((n) => n.tag === "table"));
  assert.ok(nodes.some((n) => n.tag === "code" && n.textContent === "<script>"));
  assert.ok(!nodes.some((n) => (n.attributes.href || "").startsWith("javascript:")));
});
