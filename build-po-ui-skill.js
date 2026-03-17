import fs from "fs-extra";
import https from "https";
import fetch from "node-fetch";

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const GITHUB_RAW = "https://raw.githubusercontent.com/po-ui/po-angular/master/projects/ui/src/lib/components";
const GITHUB_API = "https://api.github.com/repos/po-ui/po-angular/contents/projects/ui/src/lib/components";

async function getComponents() {

  const json = await fetch(GITHUB_API, {
    headers: { "Accept": "application/vnd.github+json" },
    agent: httpsAgent
  }).then(r => r.json());

  return json
    .filter(entry => entry.type === "dir" && entry.name.startsWith("po-"))
    .map(entry => entry.name);
}

function extractJsDocs(source) {
  const blocks = [];

  // Extrai eventos declarados com comentário simples (//) + @Output, que não têm JSDoc
  const singleLineOutputRegex = /\/\/\s*(.+)\n\s*@Output\(\s*['"]([^'"]+)['"]\s*\)/g;
  let slMatch;
  while ((slMatch = singleLineOutputRegex.exec(source)) !== null) {
    const desc = slMatch[1].trim();
    const alias = slMatch[2];
    if (desc.length > 5) {
      blocks.push({ text: `**\`${alias}\`**\n\n${desc}`, index: slMatch.index });
    }
  }

  // Captura apenas o bloco JSDoc, sem consumir o código que vem depois
  const docRegex = /\/\*\*([\s\S]*?)\*\//g;
  let match;
  while ((match = docRegex.exec(source)) !== null) {
    const cleaned = match[1]
      .split("\n")
      .map(line => line.replace(/^\s*\*\s?/, ""))
      .join("\n")
      .trim();

    // Pega o trecho de código APÓS este comentário até o próximo JSDoc (ou 300 chars)
    const afterStart = match.index + match[0].length;
    const nextComment = source.indexOf("/**", afterStart);
    const afterEnd = nextComment === -1
      ? afterStart + 300
      : Math.min(afterStart + 300, nextComment);
    const afterComment = source.substring(afterStart, afterEnd);

    const hasOutput = /@Output\s*\(/.test(afterComment);
    const hasInput = /@Input/.test(afterComment) || /\binput[^(]*\([\s\S]*?alias/.test(afterComment);

    if (cleaned.length > 50 || hasOutput || hasInput) {
      // Coleta todos os candidatos com sua posição no afterComment e escolhe o mais próximo
      const candidates = [];

      // 1. @Input('p-name') ou @Input("p-name")
      const m1 = afterComment.match(/@Input\(\s*['"]([^'"]+)['"]\s*\)/);
      if (m1) candidates.push({ name: m1[1], index: m1.index });

      // 2. @Input({ alias: 'p-name', ... })
      const m2 = afterComment.match(/@Input\(\s*\{[^}]*alias\s*:\s*['"]([^'"]+)['"]/);
      if (m2) candidates.push({ name: m2[1], index: m2.index });

      // 3. input<T>(default, { alias: 'p-name' }) — API de signals do Angular (inclui generics com > aninhados)
      const m3 = afterComment.match(/\binput[^(]*\([\s\S]*?\{\s*alias\s*:\s*['"]([^'"]+)['"]/);
      if (m3) candidates.push({ name: m3[1], index: m3.index });

      // 4. @Input() set propName ou @Input() propName
      const m4 = afterComment.match(/@Input\(\s*\)\s+(?:set\s+)?(\w+)/);
      if (m4) candidates.push({ name: m4[1], index: m4.index });

      // 5. @Output('p-name') ou @Output("p-name")
      const m5 = afterComment.match(/@Output\(\s*['"]([^'"]+)['"]\s*\)/);
      if (m5) candidates.push({ name: m5[1], index: m5.index });

      // 6. @Output({ alias: 'p-name', ... })
      const m6 = afterComment.match(/@Output\(\s*\{[^}]*alias\s*:\s*['"]([^'"]+)['"]/);
      if (m6) candidates.push({ name: m6[1], index: m6.index });

      // 7. output({ alias: 'p-name' }) — API de signals do Angular
      const m7 = afterComment.match(/\boutput(?:<[^>]*>)?\([\s\S]*?\{\s*alias\s*:\s*['"]([^'"]+)['"]/);
      if (m7) candidates.push({ name: m7[1], index: m7.index });

      // Ganha o match que aparece mais cedo no código (menor índice)
      candidates.sort((a, b) => a.index - b.index);
      const propName = candidates.length ? candidates[0].name : null;

      const header = propName ? `**\`${propName}\`**\n\n` : "";
      blocks.push({ text: header + cleaned, index: match.index });
    }
  }

  // Ordena todos os blocos (JSDoc + comentários simples) pela posição no fonte
  blocks.sort((a, b) => a.index - b.index);
  return blocks.map(b => b.text).join("\n\n---\n\n");
}

async function fetchFileContent(url) {
  const res = await fetch(url, { agent: httpsAgent });
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