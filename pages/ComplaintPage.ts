import { Page, Locator } from '@playwright/test';
import { urls } from '../config/urls';

export class ComplaintPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: 'Complaints Resolution'
    });

    this.emailLink = page.getByRole('link', {
      name: 'complaints@mlc.com.au'
    });
  }

  async open() {
    await this.page.goto(urls.complaint);
  }
}
