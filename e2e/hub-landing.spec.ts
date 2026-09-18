import { test, expect } from "@playwright/test";

const e2eEmail = process.env.E2E_TEST_EMAIL;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe("hub landing", () => {
  test("sends unauthenticated visitors from the Hub to login", async ({
    page,
  }) => {
    await page.goto("/ai-hub");

    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fai-hub/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test.describe("authenticated", () => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run the authenticated Hub landing E2E"
    );

    test("lands on the Hub with a working class panel", async ({ page }) => {
      await page.goto("/login");
      await page.getByRole("textbox", { name: "Email" }).fill(e2eEmail!);
      await page.getByLabel("Password").fill(e2ePassword!);
      await page.getByRole("button", { name: "Sign in with email" }).click();

      await page.waitForURL(/\/(ai-hub|onboarding)/);
      test.skip(
        page.url().includes("/onboarding"),
        "Test account has no class; onboarding is covered by onboarding.spec.ts"
      );

      const panel = page.getByRole("complementary", { name: "Class panel" });
      await expect(panel).toBeVisible();

      await panel.getByRole("tab", { name: "Students" }).click();
      await expect(panel.getByRole("tab", { name: "Students" })).toHaveAttribute(
        "aria-selected",
        "true"
      );

      await panel.getByRole("button", { name: "Collapse class panel" }).click();
      await expect(panel).toBeHidden();

      await page
        .getByRole("button", { name: "Expand class panel" })
        .click();
      await expect(
        page.getByRole("complementary", { name: "Class panel" })
      ).toBeVisible();
    });

    test("sends /classes bookmarks to the Hub", async ({ page }) => {
      await page.goto("/classes");
      await page.waitForURL(/\/ai-hub/);
      await expect(
        page.getByRole("complementary", { name: "Class panel" })
      ).toBeVisible();
    });
  });
});
