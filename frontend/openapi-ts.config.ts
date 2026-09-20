import { defineConfig } from "@hey-api/openapi-ts";

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  throw new Error("BACKEND_URL is required");
}

export default defineConfig({
  input: new URL("/openapi.json", backendUrl).toString(),
  output: "src/api",
  plugins: ["@hey-api/typescript", { name: "zod", dates: { offset: true } }],
});
