const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const markdownit = require("../site/vendor/markdown-it.min.js");

class Element {
  constructor() {
    this.attributes = {};
    this.hidden = false;
    this.textContent = "";
    this.innerHTML = "";
    this.listeners = {};
    this.classList = { toggle() {} };
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  querySelectorAll() { return []; }
}

function setup(skill) {
  const selectors = [
    "#detail-status", "#detail-content", "#detail-kind", "#detail-title", "#detail-description",
    "#detail-when", "#detail-source", "#detail-instructions", "#markdown-content", "#raw-content",
    "#view-formatted", "#view-raw",
  ];
  const elements = Object.fromEntries(selectors.map((name) => [name, new Element()]));
  elements["#detail-instructions"].hidden = true;
  const context = vm.createContext({
    window: { location: { pathname: "/" }, markdownit },
    document: { querySelector: (selector) => elements[selector], title: "" },
    fetch: () => new Promise(() => {}),
    URL,
    skill,
  });
  vm.runInContext(readFileSync(path.join(__dirname, "../site/app.js"), "utf8"), context);
  vm.runInContext("state.config = { title: 'Hub' }; state.skills = [skill]", context);
  return { context, elements };
}

const local = {
  name: "sample", title: "Sample", kind: "local", description: "Purpose", whenToUse: "Use it here",
  source: "Hub", url: "https://github.com/o/r/tree/main/skills/sample",
  markdown: "---\nname: sample\n---\n# Hello\n", markdownBody: "# Hello\n\n| A | B |\n| - | - |\n| 1 | 2 |\n<script>alert(1)</script>",
};

test("direct local route renders Markdown safely and switches to the complete raw file", () => {
  const { context, elements } = setup(local);
  assert.equal(vm.runInContext("detailPath(skill)", context), "/skills/sample");
  vm.runInContext("renderDetail('/skills/sample/')", context);
  assert.equal(elements["#detail-title"].textContent, "Sample");
  assert.equal(elements["#detail-when"].textContent, "Use it here");
  assert.match(elements["#markdown-content"].innerHTML, /<h1>Hello<\/h1>/);
  assert.match(elements["#markdown-content"].innerHTML, /<table>/);
  assert.doesNotMatch(elements["#markdown-content"].innerHTML, /<script>/);
  assert.equal(elements["#raw-content"].textContent, local.markdown);
  elements["#view-raw"].listeners.click();
  assert.equal(elements["#raw-content"].hidden, false);
  assert.equal(elements["#markdown-content"].hidden, true);
  assert.equal(elements["#view-raw"].attributes["aria-pressed"], "true");
  elements["#view-formatted"].listeners.click();
  assert.equal(elements["#raw-content"].hidden, true);
});

test("external detail links to its source without rendering or fetching instructions", () => {
  const { context, elements } = setup({ ...local, kind: "external", markdown: undefined, markdownBody: undefined });
  vm.runInContext("renderDetail('/skills/sample')", context);
  assert.equal(elements["#detail-source"].attributes.href, local.url);
  assert.equal(elements["#detail-instructions"].hidden, true);
  assert.equal(elements["#markdown-content"].innerHTML, "");
});

test("unknown routes show a not-found message", () => {
  const { context, elements } = setup(local);
  vm.runInContext("renderDetail('/skills/missing')", context);
  assert.match(elements["#detail-status"].textContent, /Skill not found/);
});
