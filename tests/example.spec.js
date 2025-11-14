// @ts-check
import { test, expect } from '@playwright/test';

// test('has title', async ({ page }) => {
//   await page.goto('https://demo.insuredmine.com/agent');

//   // Expect a title "to contain" a substring.
//   await expect(page).toHaveTitle(/Playwright/);
// });

// test('get started link', async ({ page }) => {
//   await page.goto('https://demo.insuredmine.com/agent');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });

import { chromium } from 'playwright';

test('test', async ({ page }) => {
  await page.goto('https://demo.insuredmine.com/agent/session/loginone');
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('dinesh.qq@insuredmine.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('c783d12fbd194faab37e84a13c54f6de');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForLoadState('networkidle'); 
  // await page.waitForTimeout(5000);
  await page.getByRole('link', { name: '' }).click();
  await page.waitForLoadState('networkidle'); 
  await page.getByRole('button', { name: ' Add Contact' }).click();
  await page.getByRole('searchbox', { name: 'Full Name' }).click();
  await page.getByRole('searchbox', { name: 'Full Name' }).fill('Mahak Agarwal - PW');
  await page.waitForLoadState('networkidle'); 
  await page.getByText('Create New "Mahak Agarwal -').click();
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().click();
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().fill('04/23/2001');
  await page.getByRole('textbox', { name: 'Email Address' }).click();
  await page.getByRole('textbox', { name: 'Email Address' }).fill('mahak@insuredmine.com');
  // await page.getByRole('button', { name: 'Save' }).click();
});