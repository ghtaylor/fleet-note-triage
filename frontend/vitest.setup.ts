import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation((message) => {
    throw new Error(`Unexpected console error: ${String(message)}`);
  });
});

afterEach(() => {
  cleanup();
  consoleError.mockRestore();
});
