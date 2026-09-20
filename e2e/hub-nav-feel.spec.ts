import { test, expect } from "@playwright/test";

const e2eEmail = process.env.E2E_TEST_EMAIL;
const e2ePassword = process.env.E2E_TEST_PASSWORD;

test.describe("hub route / nav feel", () => {
  test.describe("authenticated", () => {
    test.skip(
      !e2eEmail || !e2ePassword,
      "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run Hub nav-feel E2E"
    );

    test("login → Hub (active) → nested workspace (Hub still active) → Hub", async ({
      page,
    }) => {
      await page.goto("/login");
      await page.getByRole("textbox", { name: "Email" }).fill(e2eEmail!);
      await page.getByLabel("Password").fill(e2ePassword!);
      await page.getByRole("button", { name: "Sign in with email" }).click();

      await page.waitForURL(/\/(ai-hub|onboarding)/);
      test.skip(
        page.url().includes("/onboarding"),
        "Test account has no class; onboarding is covered by onboarding.spec.ts"
      );

      await expect(page).toHaveURL(/\/ai-hub/);
      await expect(
        page.locator('a[href="/ai-hub"][aria-current="page"]').first()
      ).toBeVisible();

      const panel = page.getByRole("complementary", { name: "Class panel" });
      await expect(panel).toBeVisible();
      await panel.getByRole("tab", { name: "Resources" }).click();

      const resourceList = panel.getByRole("region", { name: "Class resources" });
      const resourceRow = resourceList
        .getByRole("button", { name: /^Open / })
        .first();
      const hasResource = await resourceRow.count();
      test.skip(
        hasResource === 0,
        "Test class has no resources to open a nested workspace"
      );

      await resourceRow.click();
      await expect(page).toHaveURL(/\/ai-hub/);
      await expect(
        page.getByRole("region", { name: "Resource reader" })
      ).toBeVisible();
      await expect(
        page.locator('a[href="/ai-hub"][aria-current="page"]').first()
      ).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(/\/ai-hub/);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(
        page.locator('a[href="/ai-hub"][aria-current="page"]').first()
      ).toBeVisible();

      await page.goto("/classes");
      await expect(page).toHaveURL(/\/ai-hub/);
      await expect(page).not.toHaveURL(/\/login/);

      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/ai-hub/);
      await page.goBack();
      await expect(page).not.toHaveURL(/\/dashboard/);
    });
  });
});
