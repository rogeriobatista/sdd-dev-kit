import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDefaultManifest,
  DEFAULT_PATHS,
  resolveSddPath,
  type SddManifest,
} from "@rogeriobatista/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../templates");

function manifestToYaml(manifest: SddManifest): string {
  return [
    `version: ${Number(manifest.version) || 1}`,
    `adapter: ${manifest.adapter}`,
    `paths:`,
    ...Object.entries(manifest.paths).map(([k, v]) => `  ${k}: ${v}`),
    `runners:`,
    ...Object.entries(manifest.runners).map(
      ([k, v]) => `  ${k}: ${JSON.stringify(v)}`,
    ),
    `triggers:`,
    `  watch: ${manifest.triggers.watch}`,
    `  command: ${JSON.stringify(manifest.triggers.command)}`,
    `loop:`,
    `  maxDiagnoseIterations: ${manifest.loop.maxDiagnoseIterations}`,
    ``,
  ].join("\n");
}

export interface ScaffoldOptions {
  projectRoot: string;
  manifest?: Partial<SddManifest>;
  includeSmokeFixtures?: boolean;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath: string, contents: string): Promise<void> {
  if (await exists(filePath)) return;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
}

const SCHEMA = `type Query {
  hello(name: String): String!
}
`;

const SERVER = `import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(path.join(__dirname, "schema.graphql"), "utf8");

const yoga = createYoga({
  schema: createSchema({
    typeDefs,
    resolvers: {
      Query: {
        hello: (_: unknown, args: { name?: string }) =>
          \`Hello, \${args.name ?? "world"}!\`,
      },
    },
  }),
});

const port = Number(process.env.PORT ?? 4000);
createServer(yoga).listen(port, () => {
  console.log(\`GraphQL ready on http://127.0.0.1:\${port}/graphql\`);
});
`;

const CUCUMBER_CONFIG = `export default {
  paths: ["tests/features/**/*.feature"],
  import: ["tests/steps/**/*.ts"],
  format: ["progress"],
};
`;

const SMOKE_FEATURE = `# language: pt
Funcionalidade: Smoke GraphQL

  @api
  Cenário: Hello world
    Dado que a API GraphQL está pronta
    Quando consulto hello
    Então a resposta contém Hello
`;

const SMOKE_STEPS = `import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { createSchema, createYoga } from "graphql-yoga";

Given("que a API GraphQL está pronta", async function () {
  this.yoga = createYoga({
    schema: createSchema({
      typeDefs: \`type Query { hello(name: String): String! }\`,
      resolvers: {
        Query: {
          hello: (_: unknown, args: { name?: string }) =>
            \`Hello, \${args.name ?? "world"}!\`,
        },
      },
    }),
  });
});

When("consulto hello", async function () {
  const res = await this.yoga.fetch("http://localhost/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: "{ hello }" }),
  });
  this.body = await res.json();
});

Then("a resposta contém Hello", async function () {
  assert.match(this.body.data.hello, /Hello/);
});
`;

const SMOKE_VITEST = `import { describe, it, expect } from "vitest";
import { createSchema, createYoga } from "graphql-yoga";

describe("GraphQL smoke", () => {
  it("resolves hello", async () => {
    const yoga = createYoga({
      schema: createSchema({
        typeDefs: \`type Query { hello(name: String): String! }\`,
        resolvers: {
          Query: {
            hello: (_: unknown, args: { name?: string }) =>
              \`Hello, \${args.name ?? "world"}!\`,
          },
        },
      }),
    });
    const res = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: "{ hello }" }),
    });
    const body = await res.json();
    expect(body.data.hello).toMatch(/Hello/);
  });
});
`;

export async function scaffoldProject(
  options: ScaffoldOptions,
): Promise<SddManifest> {
  const { projectRoot } = options;
  const base = createDefaultManifest();
  const manifest = {
    ...base,
    ...options.manifest,
    adapter: "node-graphql" as const,
    paths: { ...base.paths, ...(options.manifest?.paths ?? {}) },
    runners: {
      ...base.runners,
      cucumber: "npm run sdd:verify:cucumber",
      vitest: "npm run sdd:verify:vitest",
      all: "npm run sdd:verify:all",
      ...(options.manifest?.runners ?? {}),
    },
    triggers: { ...base.triggers, ...(options.manifest?.triggers ?? {}) },
    loop: { ...base.loop, ...(options.manifest?.loop ?? {}) },
  } satisfies SddManifest;

  for (const rel of [
    manifest.paths.specs,
    path.dirname(manifest.paths.premises),
    manifest.paths.canonical,
    manifest.paths.plan,
    manifest.paths.runs,
    manifest.paths.features,
    manifest.paths.steps,
    "tests/unit",
    manifest.paths.src,
  ]) {
    await mkdir(resolveSddPath(projectRoot, rel), { recursive: true });
  }

  await writeIfMissing(
    resolveSddPath(projectRoot, DEFAULT_PATHS.manifest),
    manifestToYaml(manifest),
  );
  await writeIfMissing(path.join(projectRoot, "cucumber.js"), CUCUMBER_CONFIG);
  await writeIfMissing(path.join(projectRoot, "src", "schema.graphql"), SCHEMA);
  await writeIfMissing(path.join(projectRoot, "src", "server.ts"), SERVER);

  if (options.includeSmokeFixtures !== false) {
    await writeIfMissing(
      path.join(
        resolveSddPath(projectRoot, manifest.paths.features),
        "smoke.feature",
      ),
      SMOKE_FEATURE,
    );
    await writeIfMissing(
      path.join(
        resolveSddPath(projectRoot, manifest.paths.steps),
        "smoke.steps.ts",
      ),
      SMOKE_STEPS,
    );
    await writeIfMissing(
      path.join(projectRoot, "tests", "unit", "smoke.test.ts"),
      SMOKE_VITEST,
    );
  }

  const readme = path.join(TEMPLATES_DIR, "README.scaffold.md");
  if (await exists(readme)) {
    const dest = path.join(projectRoot, ".sdd", "ADAPTER_NODE_GRAPHQL.md");
    if (!(await exists(dest))) {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(readme, dest);
    }
  }

  return manifest;
}

export const SCAFFOLD_PACKAGE_SCRIPTS = {
  setup: "npm install",
  start: "tsx src/server.ts",
  "sdd:verify:cucumber": "cucumber-js",
  "sdd:verify:vitest": "vitest run",
  "sdd:verify:all": "npm run sdd:verify:vitest && npm run sdd:verify:cucumber",
} as const;
