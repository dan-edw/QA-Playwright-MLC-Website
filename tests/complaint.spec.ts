import { test, expect } from '@playwright/test';
import { ComplaintPage } from '../pages/ComplaintPage';

test.describe('Complaint Page', () => {

  test('[CUTECH-2826] Verify Complaint Page Loads', async ({ page }) => {
    const complaintPage = new ComplaintPage(page);

    await complaintPage.open();

    await expect(complaintPage.heading).toBeVisible();
  });

  test('[CUTECH-2827] Verify Complaint Resolution Page Email Link', async ({ page }) => {
    const complaintPage = new ComplaintPage(page);

    await complaintPage.open();

    await expect(complaintPage.emailLink).toBeVisible();

    await expect(complaintPage.emailLink).toHaveAttribute(
      'href',
      'mailto:complaints@mlc.com.au'
    );
  });

});
