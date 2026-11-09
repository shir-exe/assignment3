from playwright.sync_api import sync_playwright

# Lab - Screenshots Demo

with sync_playwright() as p:
    # Open browser
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})
    
    # 1. Navigate to page
    page.goto("https://web-and-automation.netlify.app/generalPageForTesting.html")
    print("✓ Navigated to page")
    
    # 2. Take screenshot of entire page
    page.screenshot(path="screenshot_full_page.png", full_page=True)
    print("✓ Screenshot of full page saved: screenshot_full_page.png")
    
    # 3. Take screenshot of navbar only
    # Try different selectors for navbar
    try:
        navbar = page.locator("nav").first
        navbar.screenshot(path="screenshot_navbar.png")
        print("✓ Screenshot of navbar saved: screenshot_navbar.png")
    except:
        # Alternative: header or custom selector
        header = page.locator("header").first
        header.screenshot(path="screenshot_navbar.png")
        print("✓ Screenshot of header/navbar saved: screenshot_navbar.png")
    
    # 4. Click "Load More Articles" and take screenshot
    try:
        load_more_btn = page.locator("text=Load More Articles").first
        load_more_btn.click()
        page.wait_for_load_state("networkidle")
        page.screenshot(path="screenshot_after_load.png", full_page=True)
        print("✓ Screenshot after Load More Articles saved: screenshot_after_load.png")
    except Exception as e:
        print(f"⚠ 'Load More Articles' button not found: {e}")
        print("  Taking screenshot of current state instead...")
        page.screenshot(path="screenshot_current_state.png", full_page=True)
    
    print("\n✅ All screenshots captured successfully!")
    
    browser.close()