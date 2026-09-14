import { Page, Locator } from '@playwright/test';
import { urls } from '../config/urls';

export class ComplaintPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /complaint/i,
    });

    this.emailLink = page.getByRole('link', {
      name: /email/i,
    });
  }

  async open() {
    await this.page.goto(urls.complaint);
  }
}