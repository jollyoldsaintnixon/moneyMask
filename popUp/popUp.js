// this page is used to generate the content of popUp.html

document.addEventListener('DOMContentLoaded', function() {
    console.log('world')
    // Grab the root at top level
    const root = document.querySelector('#root');

    initiateToggle();
    initiateBannerText();
    initiateSelectElement();

    // nested within docready function
    function initiateBannerText() {
        // Create a "banner" element
        const bannerElement = document.createElement('h3');
        bannerElement.textContent ="Select default brokerage value:";

        // add class for css capture
        bannerElement.classList.add('banner');

        // append to root
        root.appendChild(bannerElement);
    }
    
    // nested within docready function
    function initiateSelectElement() {
        // Create a "select" element
        const selectElement = document.createElement('select');
        appendOptions();
    
        // Save the user's selection
        selectElement.addEventListener('change', function(e) {
            chrome.storage.sync.set({ 'maskValue': e.target.value }, function() {
            console.log('Value saved:', e.target.value);
            });
        });
    
        // Retrieve and set the saved value when the popup is opened
        chrome.storage.sync.get('maskValue', function(data) {
            console.log('looking for default value')
            if (data.maskValue) {
                selectElement.value = data.maskValue;   
                console.log('default value: ', data.maskValue);
            }
        });

        // add class for css capture
        selectElement.classList.add('value-select');
    
        // Append the "select" element to another element
        root.appendChild(selectElement);
    
        return;
    
        // nested within initiateSelectElement()
        function appendOptions() {
            // Create options and append them to the "select" element
            const optionsData = [
                { value: '0', text: 'Blurred' },
                { value: '1', text: '$1' },
                { value: '100', text: '$100' },
                { value: '1000', text: '$1,000' },
                { value: '1000000', text: '$1,000,000' },
            ];
    
            optionsData.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                selectElement.appendChild(option);
            });
        }
    }

    /**
     * This function should generate a toggle button. The toggle will be used 
     * to turn the extension on and off.
     * * Nested within docready function
     */
    function initiateToggle()
    {
        // set up toggle element
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('toggle-button');
        root.appendChild(toggleButton);

        // Retrieve and set the saved value when the popup is opened
        chrome.storage.sync.get('isMaskOn', function(data) 
        {
            console.log('restoring default mask activation')
            if (data.isMaskOn) 
            {
                console.log('mask was active');
                toggleButton.classList.add('toggle-active');
                toggleButton.textContent = "Unmask";
            }
            else
            {
                console.log('mask was inactive');
                toggleButton.classList.remove('toggle-active');
                toggleButton.textContent = "Mask Up";
            }
        });

        // handle click logic
        toggleButton.addEventListener('click', function() 
        {
            toggleButton.classList.toggle('toggle-active');
            let isMaskOn;
            if (toggleButton.classList.contains('toggle-active')) // we just turned it on
            {
                toggleButton.textContent = "Unmask";
                isMaskOn = true;
            } 
            else // we just turned it off
            {
                toggleButton.textContent = "Mask Up";
                isMaskOn = false;
            }
            chrome.storage.sync.set({ 'isMaskOn': isMaskOn});
        });
    }
});
