This Chrome extension allows you to hide the true value of your security assets on certain brokerage accounts.

*Currently only works on Fidelity accounts.*

## Setup
1. Clone the repo locally.
2. Open Chrome and navigate to chrome://extensions/.
3. In the top left corner, click the "Load unpacked" button. Your local file navigation system should pop up.
4. Navigate to the cloned repo and select it.

If you would like to pin the extension for easier use, follow these steps:
1. Click on the puzzle piece icon near the top right corner of the Chrome browser.
2. Search the list for "MoneyMask" and click the pin icon on the right.

## Use
There are two factors the user can control:
1. Whether or not the mask is "up" (the mask state).
2. The number that will "cover" your security values (the mask value).

You can find and change these factors by clicking on the extension icon. When the mask is "up" (and therefore the real values are being masked), the extension's icon will have a green background. Otherwise, it will be gray.

To see the masking in action, navigate to and sign into your [Fidelity brokerage account](https://digital.fidelity.com/ftgw/digital/portfolio/summary). Try taking the mask on and off and switching the mask value.

## Flow of logic
There are three core parts of the extension: the pop up, the background script, and the content script.

#### The Pop Up
The pop up is the simplest of the three core parts. It is accessed by clicking on the extension icon. The pop up is the user interface, where the mask can be put up or down and where the mask value can be selected. 

#### The Background Script
The background script runs constantly in the background. It serves as an intermediary between the pop up and the content scripts by passing along user input. 

The background script also monitors for URL changes. If the user navigates to a domain that the content script can run on (for now only fidelity.com), the background script will update the extension's icon and help the content script instantiate. 

The icon loaded by the background script depends on two boolean values- the state of the mask and whether or not a content script can run on the current domain:

| | **Mask is up** | **Mask is down** |
|:-----:|:-----:|:-----:|
| **URL match** | Green mask | Gray mask |
| **No URL match** | Green square | Gray square |

#### The Content Script
This is by far the most involved of the three core parts. The content script activates whenever a tab is on a matching domain (and deactivates when the user navigates away). The content script is responsible for all the masking and unmasking. The content script itself can be broken down into three core parts: the base, the controller, and the widgets.

##### Content Script Base
The base of the content script instantiates whenever the user navigates to a matching domain. It is responsible for instantiating the controller, passing in the initial mask state and value.

The base also maintains a communication link with the background script and updates the controller when appropriate.

##### Content Script Controller

The controller is responsible for loading and deactivating the widgets whenever the URL history changes. It maintains a list of running widgets. When a URL change is detected, the controller takes three steps:
1. Deactivate any running widgets that are **not** listed to run on the new URL
2. Activate any inactive widgets that are listed to run on the new URL
3. Allow currently running widgets that are meant to run on both the old and new URLs to remain running.

The controller also passes on mask state and value changes to the running widgets.

##### Content Script Widgets

The widgets are the "functional" component of the extension- they will actually alter the DOM as appropriate. Widgets are instantiated and deactivated by the controller.

Widgets are responsible for a related "block" of the DOM. They listen for changes over their respective block and make alterations as appropriate. 

Widgets inherit from the WidgetBase class.

## Steps when creating a widget
0. Be sure to inherit from WidgetBase or an intermediary base class.
1. Determine the nodes that will be masked. Add all of their selector strings as intstance properties and write their "getters".
2. Determine the common ancestor. This is the node that "wraps" the widget. Add the corresponding selector string under the instance property `commonAncestorSelector`.
3. Overwrite the `activateWatchers()` instance method. This function should initiate any observers that proc when the desired nodes are found.
4. Overwrite a constructor method that calls `this.watchForCommonAncestor()` after the call to `super()`.
5. Overwrite the `putMaskUp()` and `resetNodes()` instance methods. These mask and unmask the nodes respectively. Create a masking and reset function for each type of node identified in step one.

## Repo Architecture
The extension is almost entirely written in Node. 

Webpack is used not only for its compaction/optimization but also because it allows for importing ES6 classes into the content script (Chrome extensions make this tricky).

All classes are kept in the top level "classes" directory. Subdirectories within further divide the classes logically:
```
./classes/
├── ContentScript.js  
├── fidelity  // classes pertaining to the Fidelity domain
│   ├── Portfolio // widgets pertaining to the portfolio part of the Fidelity domain 
│   │   ├── BalanceSheetWidget.js
│   │   ├── BalanceSidebarWidget.js
│   │   ├── PanelIraWidget.js
│   │   ├── PanelTotalWidget.js
│   │   ├── PortfolioSidebarWidget.js
│   │   └── PositionsRowWidget.js
│   └── Trade // widget pertaining to the trade part of the Fidelity domain
│       └── TradePopOutWidget.js
├── helpers.js  // general, domain-agnostic helper functions
├── UrlsToWidgetsMaps  // Objects that map URLs to widgets; used by controllers
│   └── FidelityUrlsToWidgetsMap.js
├── WidgetBase.js
└── WidgetController.js
```

## Testing
Testing is done with Jest. To test, run `npm run test`.

## Bugs & Caveats
* Sometimes "cuts out" after period of inactivity
* Still very much a work in progress- only works on certain parts of the Fidelity site.