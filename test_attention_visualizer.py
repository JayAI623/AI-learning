#!/usr/bin/env python3
"""
Test script for the Attention Mechanism Visualizer website.
Tests navigation, language toggle, and matrix display.
"""

from playwright.sync_api import sync_playwright
import time

def test_attention_visualizer():
    """Test the attention mechanism visualizer website."""
    
    results = {
        "page_loads": False,
        "matrices_displayed": False,
        "language_toggle_works": False,
        "navigation_works": False,
        "errors": [],
        "console_messages": []
    }
    
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console messages
        page.on("console", lambda msg: results["console_messages"].append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: results["errors"].append(f"Page error: {err}"))
        
        try:
            print("=" * 60)
            print("Testing Attention Mechanism Visualizer")
            print("=" * 60)
            
            # Step 1: Navigate to the page
            print("\n1. Navigating to http://localhost:8765...")
            page.goto('http://localhost:8765', wait_until='networkidle')
            time.sleep(1)  # Wait for any animations
            
            # Take screenshot of initial page
            page.screenshot(path='/tmp/attention_viz_step1_initial.png', full_page=True)
            print("   ✓ Screenshot saved: /tmp/attention_viz_step1_initial.png")
            results["page_loads"] = True
            
            # Step 2: Check that Step 1 (Input Embeddings) is displayed with a matrix
            print("\n2. Checking Step 1 (Input Embeddings) display...")
            
            # Check if the step panel is visible
            step1_panel = page.locator('.step-panel--active')
            if step1_panel.is_visible():
                print("   ✓ Step 1 panel is visible")
                
                # Check for matrix visualization
                viz_area = page.locator('#viz-step1')
                if viz_area.is_visible():
                    print("   ✓ Visualization area is present")
                    
                    # Check for matrix elements
                    matrix_elements = page.locator('.matrix').count()
                    if matrix_elements > 0:
                        print(f"   ✓ Found {matrix_elements} matrix element(s)")
                        results["matrices_displayed"] = True
                    else:
                        print("   ⚠ No matrix elements found")
                        results["errors"].append("No matrix elements found in Step 1")
                else:
                    print("   ⚠ Visualization area not visible")
            else:
                print("   ⚠ Step 1 panel not visible")
            
            # Step 3: Click on "② Q, K, V" nav button
            print("\n3. Clicking on '② Q, K, V' navigation button...")
            qkv_button = page.locator('.step-nav__btn:has-text("② Q, K, V")')
            if qkv_button.is_visible():
                qkv_button.click()
                time.sleep(1)  # Wait for transition
                page.screenshot(path='/tmp/attention_viz_step2_qkv.png', full_page=True)
                print("   ✓ Clicked Q, K, V button")
                print("   ✓ Screenshot saved: /tmp/attention_viz_step2_qkv.png")
                
                # Check if step 2 is now active
                step2_active = page.locator('.step-panel--active #viz-step2').is_visible()
                if step2_active:
                    print("   ✓ Step 2 is now active")
                    results["navigation_works"] = True
                else:
                    print("   ⚠ Step 2 not properly activated")
                    results["errors"].append("Navigation to Step 2 failed")
            else:
                print("   ⚠ Q, K, V button not found")
                results["errors"].append("Q, K, V button not found")
            
            # Step 4: Click language toggle button
            print("\n4. Clicking language toggle button...")
            lang_toggle = page.locator('#lang-toggle')
            if lang_toggle.is_visible():
                current_lang = lang_toggle.text_content()
                print(f"   Current language button text: '{current_lang}'")
                
                lang_toggle.click()
                time.sleep(1)  # Wait for language change
                
                new_lang = lang_toggle.text_content()
                print(f"   New language button text: '{new_lang}'")
                
                # Take screenshot of Chinese version
                page.screenshot(path='/tmp/attention_viz_chinese.png', full_page=True)
                print("   ✓ Screenshot saved: /tmp/attention_viz_chinese.png")
                
                # Check if language actually changed
                if current_lang != new_lang:
                    print(f"   ✓ Language toggle works (changed from '{current_lang}' to '{new_lang}')")
                    results["language_toggle_works"] = True
                else:
                    print("   ⚠ Language button text did not change")
                    results["errors"].append("Language toggle button text did not change")
                
                # Check if content changed
                title = page.locator('.hero__title').text_content()
                print(f"   Hero title: '{title}'")
            else:
                print("   ⚠ Language toggle button not found")
                results["errors"].append("Language toggle button not found")
            
            # Step 5: Click on "③ Scores" or "③ 分数"
            print("\n5. Clicking on '③ Scores' navigation button...")
            # Try both English and Chinese versions
            scores_button = page.locator('.step-nav__btn').filter(has_text="③")
            if scores_button.count() > 0:
                scores_button.first.click()
                time.sleep(1)  # Wait for transition
                page.screenshot(path='/tmp/attention_viz_step3_scores.png', full_page=True)
                print("   ✓ Clicked Scores button")
                print("   ✓ Screenshot saved: /tmp/attention_viz_step3_scores.png")
                
                # Check if step 3 is now active
                step3_active = page.locator('.step-panel--active #viz-step3').is_visible()
                if step3_active:
                    print("   ✓ Step 3 is now active")
                else:
                    print("   ⚠ Step 3 not properly activated")
            else:
                print("   ⚠ Scores button not found")
                results["errors"].append("Scores button not found")
            
            # Final check: Get page content for debugging
            print("\n6. Collecting page information...")
            
            # Check for any visible error messages on the page
            error_messages = page.locator('.error, .warning, [role="alert"]').all()
            if error_messages:
                print(f"   ⚠ Found {len(error_messages)} error/warning elements on page")
                for i, msg in enumerate(error_messages):
                    if msg.is_visible():
                        print(f"      Error {i+1}: {msg.text_content()}")
            else:
                print("   ✓ No error messages found on page")
            
        except Exception as e:
            print(f"\n❌ Error during testing: {e}")
            results["errors"].append(f"Exception: {str(e)}")
            page.screenshot(path='/tmp/attention_viz_error.png', full_page=True)
            print("   Error screenshot saved: /tmp/attention_viz_error.png")
        
        finally:
            browser.close()
    
    # Print summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Page loads correctly: {'✓ YES' if results['page_loads'] else '✗ NO'}")
    print(f"Matrices displayed properly: {'✓ YES' if results['matrices_displayed'] else '✗ NO'}")
    print(f"Language toggle works: {'✓ YES' if results['language_toggle_works'] else '✗ NO'}")
    print(f"Navigation between steps works: {'✓ YES' if results['navigation_works'] else '✗ NO'}")
    
    if results["errors"]:
        print(f"\n⚠ Errors found ({len(results['errors'])}):")
        for error in results["errors"]:
            print(f"   - {error}")
    else:
        print("\n✓ No errors detected")
    
    if results["console_messages"]:
        print(f"\nConsole messages ({len(results['console_messages'])}):")
        for msg in results["console_messages"][:10]:  # Show first 10
            print(f"   {msg}")
        if len(results["console_messages"]) > 10:
            print(f"   ... and {len(results['console_messages']) - 10} more")
    
    print("=" * 60)
    
    return results

if __name__ == "__main__":
    test_attention_visualizer()
