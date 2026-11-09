from playwright.sync_api import sync_playwright

# Create first script
with sync_playwright() as p:
    # Open Chrome browser
    browser = p.chromium.launch(headless=False)
    
    # Create new page
    page = browser.new_page()
    
    # Navigate to website
    page.goto("https://www.google.com")
    
    # Print page title
    print(page.title())
    
    # Close browser
    browser.close()