import { test, expect } from '@playwright/test'
test('service errors retain answers and allow retry without a fake report',async({page})=>{
 await page.goto('/#questions')
 await page.getByLabel("I don't know the dates / no recent period").check()
 await page.getByRole('textbox',{name:/Anything you would/}).fill('Please help with my recent symptoms.')
 let requests=0
 await page.route('**/api/gp-summary',async route=>{
  requests++
  if(requests===1)await route.fulfill({status:503,contentType:'application/json',body:'{"detail":"Unavailable"}'})
  else await route.continue()
 })
 await page.getByRole('button',{name:/Create summary for/}).click()
 await expect(page.getByRole('alert')).toContainText('unavailable')
 await expect(page.getByRole('textbox',{name:/Anything you would/})).toHaveValue('Please help with my recent symptoms.')
 await page.getByRole('button',{name:/Create summary for/}).click()
 await expect(page.locator('h1')).toHaveText('Summary')
 await expect(page.locator('main')).toContainText('Please help with my recent symptoms.')
})
test('date validation prevents requests; no generated report is shown on direct navigation',async({page})=>{
 await page.goto('/#summary')
 await expect(page.getByRole('link',{name:'Answer the questions'})).toBeVisible()
 await page.getByRole('link',{name:'Answer the questions'}).click()
 await expect(page.getByRole('button',{name:/Create summary for/})).toBeEnabled()
 let submitted=false;page.on('request',r=>{if(r.url().endsWith('/api/gp-summary'))submitted=true})
 await page.getByRole('button',{name:/Create summary for/}).click()
 expect(submitted).toBe(false)
 await expect(page.locator('h1')).toHaveText('Your GP summary')
})
test('pending report prevents duplicate submissions',async({page})=>{
 await page.goto('/#questions')
 await page.getByLabel("I don't know the dates / no recent period").check()
 let release;const gate=new Promise(resolve=>release=resolve)
 await page.route('**/api/gp-summary',async route=>{await gate;await route.continue()})
 await page.getByRole('button',{name:/Create summary for/}).click()
 await expect(page.getByRole('button',{name:'Preparing your report…'})).toBeDisabled()
 release()
 await expect(page.locator('h1')).toHaveText('Summary')
})
