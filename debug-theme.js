// Debug script to test theme toggle functionality
// Run this in the browser console on the site

(async () => {
  console.log('=== THEME TOGGLE DEBUG ===\n');

  // 1. Check if toggle button exists
  const toggleButton = document.querySelector('[data-theme-toggle]') ||
                      document.querySelector('.header__theme-toggle');
  console.log('1. Toggle button found:', !!toggleButton);
  if (toggleButton) {
    console.log('   - Classes:', toggleButton.className);
    console.log('   - Has click listener:', toggleButton.onclick !== null);
  }

  // 2. Check current theme
  const bodyTheme = document.body.getAttribute('data-theme');
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  console.log('\n2. Current theme:');
  console.log('   - Body data-theme:', bodyTheme);
  console.log('   - HTML data-theme:', htmlTheme);

  // 3. Check localStorage
  const storedTheme = localStorage.getItem('branchstone-theme');
  console.log('\n3. Stored theme:');
  console.log('   - Raw value:', storedTheme);
  console.log('   - Parsed value:', storedTheme ? JSON.parse(storedTheme) : 'none');

  // 4. Check CSS variables
  const styles = getComputedStyle(document.body);
  console.log('\n4. Current CSS variables:');
  console.log('   - --bg-primary:', styles.getPropertyValue('--bg-primary'));
  console.log('   - --text-primary:', styles.getPropertyValue('--text-primary'));

  // 5. Check if theme icons are visible
  const sunIcon = document.querySelector('.header__theme-icon--sun');
  const moonIcon = document.querySelector('.header__theme-icon--moon');
  if (sunIcon && moonIcon) {
    const sunDisplay = window.getComputedStyle(sunIcon).display;
    const moonDisplay = window.getComputedStyle(moonIcon).display;
    console.log('\n5. Theme icons:');
    console.log('   - Sun icon display:', sunDisplay);
    console.log('   - Moon icon display:', moonDisplay);
  }

  // 6. Test toggle function
  console.log('\n6. Testing toggle...');
  const currentTheme = bodyTheme;
  if (toggleButton) {
    toggleButton.click();

    // Wait for changes to apply
    setTimeout(() => {
      const newBodyTheme = document.body.getAttribute('data-theme');
      const newStoredTheme = localStorage.getItem('branchstone-theme');
      console.log('   - New body theme:', newBodyTheme);
      console.log('   - New stored theme:', newStoredTheme ? JSON.parse(newStoredTheme) : 'none');
      console.log('   - Theme changed:', currentTheme !== newBodyTheme);

      // Restore original theme
      toggleButton.click();
    }, 100);
  }

  console.log('\n=== DEBUG COMPLETE ===');
})();
