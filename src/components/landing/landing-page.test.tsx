import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/landing/landing-page";
import { getLandingCtas } from "@/lib/auth/post-login-path";
import { Providers } from "@/lib/providers";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

class TestObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", TestObserver);
  vi.stubGlobal("ResizeObserver", TestObserver);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderLanding(signedIn: boolean, hasClasses: boolean) {
  return render(
    <Providers>
      <LandingPage ctas={getLandingCtas(signedIn, hasClasses)} />
    </Providers>
  );
}

describe("logged-out landing", () => {
  it("renders the page structure and public CTAs", () => {
    renderLanding(false, false);

    expect(
      screen.getByRole("heading", { level: 1, name: "The class, in one conversation." })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "See the Hub" })).toHaveAttribute("href", "/ai-hub");
    for (const link of screen.getAllByRole("link", { name: "Sign in" })) {
      expect(link).toHaveAttribute("href", "/login");
    }
    expect(screen.getByRole("link", { name: "Start teaching" })).toHaveAttribute("href", "/login");

    expect(screen.getByRole("navigation", { name: "Page" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Upload the scheme" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ask the Hub" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Grade the scripts" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Hub chat" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Class panel" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Chat-native eval" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Resources" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Student interests" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Grounded in the curriculum you already teach." })).toBeVisible();
    expect(screen.getByText("Who is PersonaLearn for?")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Ready when the class is." })).toBeVisible();
    expect(screen.getByRole("contentinfo")).toBeVisible();
    expect(document.querySelector("[data-hero-frame]")).toBeTruthy();
  });

  it("sends a signed-in teacher with a class toward the AI Hub", () => {
    renderLanding(true, true);

    const hubLinks = screen.getAllByRole("link", { name: "Open AI Hub" });
    expect(hubLinks.length).toBeGreaterThan(0);
    for (const link of hubLinks) {
      expect(link).toHaveAttribute("href", "/ai-hub");
    }
    expect(screen.queryByRole("link", { name: "See the Hub" })).toBeNull();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
  });
});
