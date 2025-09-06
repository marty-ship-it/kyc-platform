import { test, expect } from '@playwright/test'

test.describe('AML/CTF Compliance Demo Flow', () => {
  test('complete compliance workflow for property deal', async ({ page }) => {
    // Start server and navigate to login
    await page.goto('http://localhost:3001')

    // Login as Agent (Luca)
    await expect(page.locator('h1')).toContainText('AML/CTF Compliance Portal')
    
    await page.fill('input[type="email"]', 'luca@coastalrealty.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Welcome back, Luca Romano')
    
    // Navigate to deals
    await page.click('text=Deals')
    await expect(page.locator('h1')).toContainText('Property Deals')

    // Click on the demo deal
    await page.click('text=12 Seaview Rd, Bondi NSW')
    await expect(page.locator('h1')).toContainText('12 Seaview Rd, Bondi NSW')

    // Test KYC workflow
    await page.click('text=KYC')
    await expect(page.getByText('KYC Verification - James Chen')).toBeVisible()
    
    // Run KYC check
    await page.click('text=Run KYC Check')
    await expect(page.getByText('DVS Verification Successful')).toBeVisible({ timeout: 5000 })

    // Test Screening workflow
    await page.click('text=Screening')
    await expect(page.getByText('PEP, Sanctions & Adverse Media Screening')).toBeVisible()
    
    // Run screening
    await page.click('text=Run Screening')
    await expect(page.getByText('Adverse Media Alert')).toBeVisible({ timeout: 10000 })

    // Test Risk Assessment
    await page.click('text=Risk')
    await expect(page.getByText('Risk Assessment')).toBeVisible()
    await expect(page.getByText('Transaction Amount')).toBeVisible()

    // Test Transactions
    await page.click('text=Transactions')
    await expect(page.getByText('Transaction Monitoring')).toBeVisible()
    
    // Import bank feed
    await page.click('text=Ingest Bank Feed')
    await expect(page.getByText('Threshold Transaction Alert')).toBeVisible({ timeout: 5000 })

    // Test Reports
    await page.click('text=Reports')
    await expect(page.getByText('AUSTRAC Reporting')).toBeVisible()
    await expect(page.getByText('TTR Required')).toBeVisible()
    
    // Generate AUSTRAC pack
    await page.click('text=Generate AUSTRAC Pack')
    
    // Wait a moment for PDF generation
    await page.waitForTimeout(3000)

    // Test Evidence Vault
    await page.click('text=Evidence')
    await expect(page.getByText('Evidence Vault')).toBeVisible()
    await expect(page.getByText('KYC Results')).toBeVisible()

    // Navigate to Training
    await page.click('text=Training')
    await expect(page.locator('h1')).toContainText('Training Management')
    await expect(page.getByText('Luca Romano')).toBeVisible()

    // Navigate to Policies
    await page.click('text=Policies')
    await expect(page.locator('h1')).toContainText('Policy Management')
    await expect(page.getByText('AML/CTF Program')).toBeVisible()

    // Test logout
    await page.click('text=Sign out')
    await expect(page.locator('h1')).toContainText('AML/CTF Compliance Portal')
  })

  test('role-based access control', async ({ page }) => {
    // Test login as Compliance Officer (Priya)
    await page.goto('http://localhost:3001')
    
    await page.fill('input[type="email"]', 'priya@coastalrealty.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Verify compliance officer role is displayed
    await expect(page.getByText('Priya Sharma')).toBeVisible()
    await expect(page.getByText('compliance')).toBeVisible()

    // Verify admin menu is available for compliance role
    await expect(page.getByText('Admin')).toBeVisible()

    // Logout and test Director access
    await page.click('text=Sign out')
    
    await page.fill('input[type="email"]', 'sarah@coastalrealty.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Verify director role and access
    await expect(page.getByText('Sarah Mitchell')).toBeVisible()
    await expect(page.getByText('director')).toBeVisible()
    await expect(page.getByText('Admin')).toBeVisible()
  })

  test('navigation and responsive design', async ({ page }) => {
    await page.goto('http://localhost:3001')
    
    await page.fill('input[type="email"]', 'luca@coastalrealty.com')
    await page.fill('input[type="password"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Test main navigation
    const navLinks = ['Dashboard', 'Deals', 'Training', 'Policies']
    for (const link of navLinks) {
      await page.click(`text=${link}`)
      await expect(page.locator('h1')).toContainText(link === 'Dashboard' ? 'Welcome back' : link)
    }

    // Test mobile navigation (simulate mobile viewport)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3001')
    
    // Should still be able to navigate after login
    await expect(page.getByText('AML/CTF Portal')).toBeVisible()
  })
})