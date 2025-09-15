import { test, expect } from "@playwright/test";

test.describe("Realisation Cards Functionality", () => {
  test("Should display realisation cards and handle inspiration click", async ({
    page,
  }) => {
    // Go to homepage
    await page.goto("http://localhost:3003/");

    // Wait for realisation cards to load
    await page.waitForSelector('[data-testid="realisation-card"]', {
      timeout: 15000,
    });

    // Verify we have at least one realisation card
    const realisationCards = page.locator('[data-testid="realisation-card"]');
    const count = await realisationCards.count();
    expect(count).toBeGreaterThan(0);

    console.log(`Found ${count} realisation cards`);

    // Take screenshot for documentation
    await page.screenshot({
      path: "test-results/realisation-cards-loaded.png",
    });

    // Click on the inspiration button of the first card
    const firstCard = realisationCards.first();
    const inspirationButton = firstCard.locator(
      '[title="S\'inspirer de cette réalisation"]'
    );

    // Wait for the button to be visible and clickable
    await inspirationButton.waitFor({ state: "visible", timeout: 10000 });
    await inspirationButton.click();

    // Check that we navigated to devis with inspiration parameters (catalogue disabled for MVP)
    await page.waitForURL(/\/devis.*inspiredBy=/, { timeout: 10000 });

    const currentUrl = page.url();
    console.log("Navigation URL:", currentUrl);

    expect(currentUrl).toContain("/devis");
    expect(currentUrl).toContain("inspiredBy=");

    // Verify the devis page loads
    await page.waitForLoadState("networkidle");

    console.log("✅ Inspiration flow completed successfully");
  });
});
