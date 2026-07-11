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
      return (
        <div data-testid="result">
          {userName === undefined ? "undefined" : userName}
        </div>
      );
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

  it("selects derived data from a nested hasMany relation", () => {
    const cache = createTestCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [
        { id: "p1", title: "First post" },
        { id: "p2", title: "Second post" },
      ],
    } as any);
    const useModel = createUseModel(cache);

    function TestComponent() {
      const titles = useModel("User", "u1", (user) =>
        user.posts.map((p) => p.title).join(","),
      );
      return <div data-testid="result">{titles}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe(
      "First post,Second post",
    );
  });

  it("selects derived data through a nested belongsTo relation", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });
    const useModel = createUseModel(cache);

    function TestComponent() {
      const authorName = useModel("Post", "p1", (post) => post.author?.name);
      return <div data-testid="result">{authorName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");
  });

  it("re-renders when a linked hasMany child is added", () => {
    const cache = createTestCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);
    const useModel = createUseModel(cache);

    function TestComponent() {
      const titleCount = useModel("User", "u1", (user) => user.posts.length);
      return <div data-testid="result">{titleCount}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("1");

    act(() => {
      cache.set("Post", { id: "p2", userId: "u1", title: "Second post" });
    });

    expect(screen.getByTestId("result").textContent).toBe("2");
  });

  it("re-renders when a related entity's selected field changes via a belongsTo relation", () => {
    const cache = createTestCache();
    cache.set("User", { id: "u1", name: "Ada", email: "ada@example.com" });
    cache.set("Post", { id: "p1", userId: "u1", title: "First post" });
    const useModel = createUseModel(cache);

    function TestComponent() {
      const authorName = useModel("Post", "p1", (post) => post.author?.name);
      return <div data-testid="result">{authorName}</div>;
    }

    render(<TestComponent />);
    expect(screen.getByTestId("result").textContent).toBe("Ada");

    act(() => {
      cache.set("User", { id: "u1", name: "Ada Lovelace" } as any);
    });

    expect(screen.getByTestId("result").textContent).toBe("Ada Lovelace");
  });

  it("does not re-render when selecting a nested relation and an unrelated model changes", () => {
    const cache = createTestCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);
    cache.set("User", { id: "u2", name: "Bo", email: "bo@example.com" });
    const useModel = createUseModel(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const titles = useModel("User", "u1", (user) =>
        user.posts.map((p) => p.title).join(","),
      );
      renderSpy();
      return <div data-testid="result">{titles}</div>;
    }

    render(<TestComponent />);
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      // Unrelated to u1: a different user's own field changes, and it has
      // no posts linked, so u1's selected post titles are unaffected.
      cache.set("User", { id: "u2", name: "Bo Jones" } as any);
    });

    expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
  });

  it("does not re-render when an unselected nested relation field changes", () => {
    const cache = createTestCache();
    cache.set("User", {
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      posts: [{ id: "p1", title: "First post" }],
    } as any);
    const useModel = createUseModel(cache);
    const renderSpy = vi.fn();

    function TestComponent() {
      const postCount = useModel("User", "u1", (user) => user.posts.length);
      renderSpy();
      return <div data-testid="result">{postCount}</div>;
    }

    render(<TestComponent />);
    const rendersAfterMount = renderSpy.mock.calls.length;

    act(() => {
      // Changes a field on the linked post that isn't part of the
      // selection (only .length is selected, not each post's title).
      cache.set("Post", { id: "p1", title: "Updated title" } as any);
    });

    expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
  });
});
