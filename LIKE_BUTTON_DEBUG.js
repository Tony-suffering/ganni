// Debug script to test like button functionality
// Run this in the browser console to diagnose like button issues

console.log('🔍 Like Button Debug Script Starting...');

// Check if required elements exist
const likeButtons = document.querySelectorAll('[data-testid="like-button"], button[aria-label*="いいね"], button:has(svg[data-lucide="heart"])');
console.log(`Found ${likeButtons.length} potential like buttons:`, likeButtons);

// Check if event listeners are attached
likeButtons.forEach((button, index) => {
  console.log(`Button ${index + 1}:`, {
    element: button,
    onClick: button.onclick,
    hasEventListeners: getEventListeners ? Object.keys(getEventListeners(button)).length > 0 : 'getEventListeners not available',
    disabled: button.disabled,
    style: button.style.cssText,
    computedStyle: {
      pointerEvents: window.getComputedStyle(button).pointerEvents,
      display: window.getComputedStyle(button).display,
      visibility: window.getComputedStyle(button).visibility
    }
  });
});

// Test click simulation
if (likeButtons.length > 0) {
  console.log('Testing click simulation on first like button...');
  const firstButton = likeButtons[0];
  
  // Create and dispatch click event
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  console.log('Dispatching click event...');
  firstButton.dispatchEvent(clickEvent);
  
  setTimeout(() => {
    console.log('Click event dispatched. Check for any changes or errors above.');
  }, 100);
}

// Check for React DevTools and component state
if (window.React) {
  console.log('React detected:', window.React.version);
}

// Check for any JavaScript errors in console
console.log('Check the browser console for any JavaScript errors that might be preventing the like button from working.');

// Check network requests
console.log('Monitor the Network tab to see if API requests are being made when clicking the like button.');

// Check authentication state
console.log('Checking Supabase auth state...');
if (window.supabase) {
  window.supabase.auth.getUser().then(({ data, error }) => {
    if (error) {
      console.error('Auth error:', error);
    } else {
      console.log('Current user:', data.user ? 'Logged in' : 'Not logged in');
    }
  });
} else {
  console.log('Supabase not found on window object');
}