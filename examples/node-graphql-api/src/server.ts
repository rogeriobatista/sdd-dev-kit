import { createSchema, createYoga } from "graphql-yoga";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(path.join(__dirname, "schema.graphql"), "utf8");

export function buildYoga() {
  return createYoga({
    schema: createSchema({
      typeDefs,
      resolvers: {
        Query: {
          hello: (_: unknown, args: { name?: string }) =>
            `Hello, ${args.name ?? "world"}!`,
        },
      },
    }),
  });
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entry) {
  const port = Number(process.env.PORT ?? 4000);
  createServer(buildYoga()).listen(port, () => {
    console.log(`GraphQL ready on http://127.0.0.1:${port}/graphql`);
  });
}
