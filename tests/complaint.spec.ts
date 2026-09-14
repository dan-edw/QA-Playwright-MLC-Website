import { test, expect } from '@playwright/test';
import { ComplaintPage } from '../../pages/ComplaintPage';

test.describe('Complaint Page', () => {

  test('[CUTECH-2826] Verify Complaint Page Loads', async ({ page }) => {
  await page.goto('https://mlc-foundation--eds-enterprise-uat--ifl-digitaltechnology.aem.page/index/complaints-resolution#');
  await page.getByRole('heading', { name: 'Complaints Resolution' }).click();
});

  test('[CUTECH-2827] Verify Complaint Resolution Page Email Link', async ({ page }) => {
  await page.goto('https://mlc-foundation--eds-enterprise-uat--ifl-digitaltechnology.aem.page/index/complaints-resolution#');
  await page.getByRole('link', { name: 'complaints@mlc.com.au' }).click();
});