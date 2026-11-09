from playwright.sync_api import sync_playwright, expect

# Lab 1 Part B - Product Feedback Form

with sync_playwright() as p:
    # Open browser
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # 1. Navigate to page
    page.goto("https://web-and-automation.netlify.app/playwrightLab1EN.html")
    
    # 2. Verify title
    expect(page.locator("#mainTitle")).to_have_text("Product Feedback Form")
    print("✓ Page title verified")
    
    # 3. Fill first name
    page.locator("#firstName").fill("John")
    print("✓ Filled first name")
    
    # 4. Fill last name
    page.locator("#lastName").fill("Smith")
    print("✓ Filled last name")
    
    # 5. Fill email
    page.locator("#emailAddress").fill("john.smith@company.com")
    print("✓ Filled email")
    
    # 6. Select country - United States
    page.locator("#country").select_option("usa")
    print("✓ Selected country")
    
    # 7. Select satisfaction radio button - Very Satisfied
    page.locator("input[value='very-satisfied']").check()
    print("✓ Selected satisfaction level")
    
    # 8. Check feature checkboxes - Test Automation and CI/CD Integration
    page.locator("#feature1").check()  # Test Automation
    page.locator("#feature3").check()  # CI/CD Integration
    print("✓ Checked feature checkboxes")
    
    # 9. Fill feedback
    page.locator("#feedback").fill("Great product, very useful")
    print("✓ Filled feedback")
    
    # 10. Submit and verify success message
    page.locator("#submitBtn").click()
    print("✓ Clicked submit")
    
    # Verify result
    result = page.locator("#result")
    expect(result).to_be_visible()
    expect(result).to_contain_text("John Smith")
    expect(result).to_contain_text("john.smith@company.com")
    print("✓ Success message verified")
    
    print("\n✅ All tests passed successfully!")
    
    browser.close()