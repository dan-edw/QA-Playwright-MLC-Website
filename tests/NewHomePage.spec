/*import { test, expect } from '@playwright/test';
import { HomePageNew } from '../pages/HomePageNew';

test('[CUTECH-2925] Verify New Website Loads', async ({ page }) => {
  const homePageNew = new HomePageNew(page);
  await homePageNew.open();
  await page.getByRole('heading', { name: 'Lorem Ipsum', exact: true }).click();
});*/

import { test, expect } from '@playwright/test';

test('[CUTECH-2829] Verify New Website Loads', async ({ page }) => {
  await page.goto('https://mlc-foundation--eds-enterprise-uat--ifl-digitaltechnology.aem.page/');
  await page.getByRole('heading', { name: 'Lorem Ipsum', exact: true }).click();
});
