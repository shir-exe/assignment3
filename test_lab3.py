from playwright.sync_api import sync_playwright, expect

# Lab 3 - English Dynamic Page

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # 1. Navigate and verify title
    page.goto("https://web-and-automation.netlify.app/playwrightLab2EN.html")
    expect(page.locator("#mainHeading")).to_have_text("Interactive Test Dashboard")
    print("✓ Page title verified")
    
    # 2. Start progress and wait for completion
    page.locator("#startProgressBtn").click()
    expect(page.locator("#progressBar")).to_have_text("100%", timeout=5000)
    print("✓ Progress bar completed")
    
    # 3. Verify progress bar contains 100%
    expect(page.locator("#progressBar")).to_contain_text("100%")
    print("✓ Progress bar contains 100%")
    
    # 4. Load data and wait for indicator
    page.locator("#loadDataBtn").click()
    expect(page.locator("#loadingIndicator")).to_be_visible()
    print("✓ Loading indicator appeared")
    
    # 5. Wait for data and verify it contains "John Smith"
    expect(page.locator("#dataDisplay")).to_be_visible()
    expect(page.locator("#dataDisplay")).to_contain_text("John Smith")
    print("✓ User data loaded with John Smith")
    
    # 6. Add cards 4 times and verify count
    for _ in range(4):
        page.locator("#addCardBtn").click()
    expect(page.locator(".card")).to_have_count(4)
    print("✓ 4 cards added")
    
    # 7. Show success message
    page.locator("#showSuccessBtn").click()
    expect(page.locator("#notification")).to_be_visible()
    print("✓ Success message displayed")
    
    # 8. Verify message contains "successfully"
    expect(page.locator("#notification")).to_contain_text("successfully")
    print("✓ Message contains 'successfully'")
    
    # 9. Take screenshot of full page
    page.screenshot(path="lab3_result.png", full_page=True)
    print("✓ Screenshot saved: lab3_result.png")
    
    # 10. Wait for message to disappear
    expect(page.locator("#notification")).to_be_hidden(timeout=5000)
    print("✓ Message disappeared")
    
    print("\n✅ All Lab 3 tests passed successfully!")
    browser.close()