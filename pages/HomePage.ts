import { BasePage } from './BasePage';

export class HomePage extends BasePage {

    async open() {
        await this.navigate('/');
    }

    async openContactUs() {
        await this.page.getByRole('link', { name: 'Contact us' }).click();
    }

}