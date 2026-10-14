import { Page, Locator } from '@playwright/test';
import { urls } from '../config/urls';

export class ComplaintPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailButton: Locator;
  readonly agreeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'COMPLAINT RESOLUTIONS',
      exact: true
    });

    this.emailButton = page.getByRole('button', {
      name: 'Send us an email',
      exact: true
    });

    this.agreeButton = page.getByRole('button', {
      name: 'Agree',
      exact: true
    });
  }

  async open() {
    await this.page.goto(urls.complaint);

    // Accept cookies when the banner is displayed.
    if (await this.agreeButton.isVisible()) {
      await this.agreeButton.click();
    }
  }
}