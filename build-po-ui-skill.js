import fetch from "node-fetch";
import fs from "fs-extra";

const GITHUB_RAW = "https://raw.githubusercontent.com/po-ui/po-angular/master/projects/ui/src/lib/components";
const GITHUB_API = "https://api.github.com/repos/po-ui/po-angular/contents/projects/ui/src/lib/components";

async function getComponents() {

  const json = await fetch(GITHUB_API, {
    headers: { "Accept": "application/vnd.github+json" }
  }).then(r => r.json());

  return json
    .filter(entry => entry.type === "dir" && entry.name.startsWith("po-"))
    .map(entry => entry.name);
}

function extractJsDocs(source) {
  const blocks = [];
  const regex = /\/\*\*([\s\S]*?)\*\//g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const cleaned = match[1]
      .split("\n")
      .map(line => line.replace(/^\s*\*\s?/, ""))
      .join("\n")
      .trim();
    if (cleaned.length > 50) {
      blocks.push(cleaned);
    }
  }
  return blocks.join("\n\n---\n\n");
}

async function fetchFileContent(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

async function downloadComponent(component) {

  const baseUrl = `${GITHUB_RAW}/${component}`;
  const candidates = [
    `${baseUrl}/${component}-base.component.ts`,
    `${baseUrl}/${component}.component.ts`,
    `${baseUrl}/${component}.service.ts`,
  ];

  let docs = "";
  for (const url of candidates) {
    const src = await fetchFileContent(url);
    if (src) {
      docs += extractJsDocs(src) + "\n\n";
    }
  }

  if (!docs.trim()) {
    console.log("sem docs:", component);
    return;
  }

  const md = `# ${component}\n\n${docs.trim()}\n`;
  const path = `docs/po-ui/${component}.md`;
  await fs.outputFile(path, md);
  console.log("gerado:", component);
}

async function generateIndex(components) {

  let content = "# PO-UI Components\n\n";

  for (const c of components) {

    content += `- ${c}\n`;

  }

  await fs.outputFile(
    "ai/po-ui-components-index.md",
    content
  );

}

async function main() {

  const components = await getComponents();

  console.log("componentes encontrados:", components.length);

  for (const c of components) {

    await downloadComponent(c);

  }

  await generateIndex(components);

}

main();