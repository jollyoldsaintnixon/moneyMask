console.log("on fidelity")

// Function to look for and log specific elements
function lookForElements() {
    const elements = document.querySelectorAll('.acct-balance'); // Replace '.example' with your target element's selector
    elements.forEach(element => {
      console.log('Element text content:', element.textContent);
    });
  }
  
  // Call the function initially
  lookForElements();
  
  // Set up a MutationObserver to look for elements when the page content changes
  const observer = new MutationObserver(lookForElements);
  observer.observe(document.body, { childList: true, subtree: true });

  "acct-selector__all-accounts-balance" // total for all accounts
  "acct-selector__acct-balance" // specific account, it's a div and the actual balance is the second span