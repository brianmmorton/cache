import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createCacheHooks } from "../src/createCacheHooks";
import { createTestCache } from "./fixtures/createTestCache";

describe("createCacheHooks", () => {
  it("returns useModel and useModelAll bound to the given cache", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const { useModel, useModelAll } = createCacheHooks(cache);

    function TestComponent() {
      const name = useModel("User", "u1", (user) => user.name);
      const allNames = useModelAll("User", (users) => users.map((u) => u.name).join(","));
      return (
        <div>
          <div data-testid="name">{name}</div>
          <div data-testid="all">{allNames}</div>
        </div>
      );
    }

    render(<TestComponent />);
    expect(screen.getByTestId("name").textContent).toBe("Ada");
    expect(screen.getByTestId("all").textContent).toBe("Ada");
  });
});
