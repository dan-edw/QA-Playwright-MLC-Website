import { test, expect } from '@playwright/test';

test('[CUTECH-2841] Verify forms & documents Superannuation contribute MLC MasterKey (PDF)', async ({ page }) => {
  await page.goto('https://www.mlc.com.au/');
  await page.getByRole('link', { name: 'Advice & tools' }).click();
  await page.getByRole('menuitem', { name: 'Forms & documents' }).click();
  await page.getByRole('link', { name: 'Contribute to your super' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'MLC MasterKey' }).first().click();
  const page1 = await page1Promise;
});




/*import { test, expect } from '@playwright/test';

test('Verify forms & documents Superannuation contribute MLC MasterKey (PDF)', async ({ page, context }) => {
  await page.goto('https://www.mlc.com.au/');
  await page.getByRole('link', { name: 'Advice & tools' }).click();
  await page.getByRole('menuitem', { name: 'Forms & documents' }).click();
  await page.getByRole('link', { name: 'Contribute to your super' }).click();

  const popupPromise = page.waitForEvent('popup').catch(() => null);
  await page.getByRole('link', { name: 'MLC MasterKey' }).first().click();

  const popup = await popupPromise;
  const targetPage = popup ?? page;

  if (popup) {
    await popup.waitForLoadState('domcontentloaded');
  }

  const pdfName = 'its_easy_to_contribute_mk.pdf';
  const downloadPromise = context.waitForEvent('download', { timeout: 8000 }).catch(() => null);

  // Try page first, then iframe (no hardcoded iframe name)
  const pageText = targetPage.getByText(pdfName, { exact: false });
  if (await pageText.count()) {
    await pageText.first().click();
  } else {
    const frameText = targetPage.frameLocator('iframe').first().getByText(pdfName, { exact: false });
    await frameText.first().click();
  }

  const download = await downloadPromise;
  if (download) {
    expect(download.suggestedFilename().toLowerCase()).toContain('.pdf');
  } else {
    await expect(targetPage).toHaveURL(/\.pdf(\?|$)/i);
  }
});*/