import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ContactUsPage } from '../pages/ContactUsPage';


test('[CUTECH-2833] Verify Contact Us Enquiry Form Navigation', async ({ page }) => {

    const homePage = new HomePage(page);
    const contactUsPage = new ContactUsPage(page);

    await homePage.open();

    await homePage.openContactUs();

    await contactUsPage.closeChatInvitation();

    const enquiryPage = await contactUsPage.openEnquiryForm();

    await expect(
        enquiryPage.getByRole('heading', { name: 'Contact us' })
    ).toBeVisible();

});
