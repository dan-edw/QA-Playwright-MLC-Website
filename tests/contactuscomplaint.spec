import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ContactUsPage } from '../pages/ContactUsPage';


test('[CUTECH-2827] Verify Contact Us Complaint Navigation', async ({ page }) => {

    const homePage = new HomePage(page);
    const contactUsPage = new ContactUsPage(page);

    await homePage.open();

    await homePage.openContactUs();

    await contactUsPage.closeChatInvitation();

    await contactUsPage.openComplaintSection();

    await expect(
        page.getByRole('heading', { name: 'Complaint resolutions' })
    ).toBeVisible();

});
