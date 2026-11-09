from playwright.sync_api import sync_playwright

# Create first script
with sync_playwright() as p:
    # Open Chrome browser
    browser = p.chromium.launch(headless=False)
    
    # Create new page
    page = browser.new_page()
    
    # Navigate to Amazon
    page.goto("https://www.amazon.com")

    # Find the search box and type a product name
    search_box = page.locator('#twotabsearchtextbox')
    search_box.wait_for(state="visible")
    search_box.fill("smart watch")
    search_box.press("Enter")

    # Print page title
    print(page.title())

    # Close browser
    browser.close()