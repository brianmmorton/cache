import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { createUseModel } from "../src/useModel";
import { createTestCache } from "./fixtures/createTestCache";

describe("useModel", () => {
  it("returns the denormalized entity when no selector is given", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModel = createUseModel(cache);

    function TestComponent() {
      const user = useModel("User", "u1");
      return <div data-testid="result">{user?.name}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");
  });

  it("applies the selector to pick specific data", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModel = createUseModel(cache);

    function TestComponent() {
      const userName = useModel("User", "u1", (user) => user.name);
      return <div data-testid="result">{userName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");
  });

  it("returns undefined when the entity does not exist", () => {
    const cache = createTestCache();
    const useModel = createUseModel(cache);

    function TestComponent() {
      const userName = useModel("User", "missing", (user) => user.name);
      return <div data-testid="result">{userName === undefined ? "undefined" : userName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("undefined");
  });

  it("re-renders when the selected field changes", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModel = createUseModel(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const userName = useModel("User", "u1", (user) => user.name);
      renderSpy();
      return <div data-testid="result">{userName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      cache.set("User", { id: "u1", name: "Ada Lovelace" } as any);
    });

    expect(screen.getByTestId("result").textContent).toBe("Ada Lovelace");
    expect(renderSpy.mock.calls.length).toBeGreaterThan(rendersAfterMount);
  });

  it("does not re-render when an unselected field changes", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    const useModel = createUseModel(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const userName = useModel("User", "u1", (user) => user.name);
      renderSpy();
      return <div data-testid="result">{userName}</div>;
    }

    render(<TestComponent />);
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      cache.set("User", { id: "u1", email: "ada-new@example.com" } as any);
    });

    expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
  });

  it("re-renders when switching to a different entity id", () => {
    const cache = createTestCache();
    cache.set("User", [
      { id: "u1", name: "Ada", email: "ada@example.com" },
      { id: "u2", name: "Bo", email: "bo@example.com" },
    ]);
    const useModel = createUseModel(cache);

    function TestComponent({ id }: { id: string }) {
      const userName = useModel("User", id, (user) => user.name);
      return <div data-testid="result">{userName}</div>;
    }

    const { rerender } = render(<TestComponent id="u1" />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");

    rerender(<TestComponent id="u2" />);
    expect(screen.getByTestId("result").textContent).toBe("Bo");
  });
});
