import { Page } from '@playwright/test';

export class BasePage {

  constructor(protected page: Page) {}

  async navigate(path: string = '/') {
    await this.page.goto(path);
  }

  async click(locator: string) {
    await this.page.locator(locator).click();
  }

  async fill(locator: string, text: string) {
    await this.page.locator(locator).fill(text);
  }

  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`
    });
  }
}
