import { BasePage } from './BasePage';

export class HomePageNew extends BasePage {

    async open() {
        await this.navigate('/');
    }

}