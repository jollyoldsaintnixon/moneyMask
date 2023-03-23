console.log('hello')

document.addEventListener('DOMContentLoaded', function() {
    console.log('world')
    // Grab the root at top level
    const root = document.querySelector('#root');

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
            chrome.storage.sync.set({ 'selectedValue': e.target.value }, function() {
            console.log('Value saved:', e.target.value);
            });
        });
    
        // Retrieve and set the saved value when the popup is opened
        chrome.storage.sync.get('selectedValue', function(data) {
            console.log('looking for default value')
            if (data.selectedValue) {
                selectElement.value = data.selectedValue;   
                console.log('default value: ', data.selectedValue);
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
});
