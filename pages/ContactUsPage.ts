import { BasePage } from './BasePage';

export class ContactUsPage extends BasePage {

    async closeChatInvitation() {
        await this.page.getByTitle('Close Chat Invitation').click();
    }

    async openCallOptions() {
        await this.page.getByRole('link', { name: 'Call options' }).click();
    }

    async openComplaintSection() {
        await this.page.getByRole('link', { name: 'How to make a complaint' }).click();
    }

    async openEnquiryForm() {
        const page1Promise = this.page.waitForEvent('popup');

        await this.page.getByRole('link', { name: 'Enquiry form' }).click();

        return await page1Promise;
    }

}
