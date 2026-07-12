import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { createUseModelAll } from "../src/useModelAll";
import { createTestCache } from "./fixtures/createTestCache";

describe("useModelAll", () => {
  it("returns all denormalized entities when no selector is given", () => {
    const cache = createTestCache();
    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);
    const useModelAll = createUseModelAll(cache);

    function TestComponent() {
      const users = useModelAll("User");
      return (
        <div data-testid="result">{users.map((u) => u.name).join(",")}</div>
      );
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada,Bo");
  });

  it("returns an empty array when no entities are stored", () => {
    const cache = createTestCache();
    const useModelAll = createUseModelAll(cache);

    function TestComponent() {
      const users = useModelAll("User");
      return <div data-testid="result">{users.length}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("0");
  });

  it("applies a selector to derive data from the full list", () => {
    const cache = createTestCache();
    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);
    const useModelAll = createUseModelAll(cache);

    function TestComponent() {
      const count = useModelAll("User", (users) => users.length);
      return <div data-testid="result">{count}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("2");
  });

  it("re-renders when a new entity is added", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModelAll = createUseModelAll(cache);

    function TestComponent() {
      const names = useModelAll("User", (users) =>
        users.map((u) => u.name).join(","),
      );
      return <div data-testid="result">{names}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");

    act(() => {
      cache.set("User", { id: "u2", name: "Bo", email: "bo@example.com" });
    });

    expect(screen.getByTestId("result").textContent).toBe("Ada,Bo");
  });

  it("does not re-render when an unrelated model's data changes", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModelAll = createUseModelAll(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const names = useModelAll("User", (users) =>
        users.map((u) => u.name).join(","),
      );
      renderSpy();
      return <div data-testid="result">{names}</div>;
    }

    render(<TestComponent />);
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      cache.set("Post", { id: "p1", userId: "u1", title: "First post" });
    });

    expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
  });

  it("does not loop when the selector always returns a new array of derived primitives", () => {
    const cache = createTestCache();
    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);
    const useModelAll = createUseModelAll(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      // Always allocates a new array, even when the underlying ids haven't changed.
      const ids = useModelAll("User", (users) => users.map((u) => u.id));
      renderSpy();
      return <div data-testid="result">{ids.join(",")}</div>;
    }

    expect(() => render(<TestComponent />)).not.toThrow();
    expect(screen.getByTestId("result").textContent).toBe("u1,u2");
    expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("re-renders when a selector deriving a new array of primitives actually changes", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModelAll = createUseModelAll(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const ids = useModelAll("User", (users) => users.map((u) => u.id));
      renderSpy();
      return <div data-testid="result">{ids.join(",")}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("u1");
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      cache.set("User", { id: "u2", name: "Bo", email: "bo@example.com" });
    });

    expect(screen.getByTestId("result").textContent).toBe("u1,u2");
    expect(renderSpy.mock.calls.length).toBeGreaterThan(rendersAfterMount);
  });

  it("does not re-render when a selector returning a new plain object is unchanged", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModelAll = createUseModelAll(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const summary = useModelAll("User", (users) => ({ count: users.length }));
      renderSpy();
      return <div data-testid="result">{summary.count}</div>;
    }

    render(<TestComponent />);
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      cache.set("User", { id: "u1", email: "ada-new@example.com" } as any);
    });

    expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
  });
});
