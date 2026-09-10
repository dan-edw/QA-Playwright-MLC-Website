import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ContactUsPage } from '../pages/ContactUsPage';


test('[CUTECH-2826] Verify Contact Us Call Options Navigation', async ({ page }) => {

    const homePage = new HomePage(page);
    const contactUsPage = new ContactUsPage(page);

    await homePage.open();

    await homePage.openContactUs();

    await contactUsPage.closeChatInvitation();

    await contactUsPage.openCallOptions();

    await expect(
        page.getByRole('heading', { name: 'Hearing and interpreting' })
    ).toBeVisible();

});
