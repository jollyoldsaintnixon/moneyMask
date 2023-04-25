// This particular file is read by the top-level jest.config.js file
global.__TEST_ENV__ = true; // I need this in order to properly test the background script. Since jest converts ES6 imports to CommonJs requires, the full file is run before importing. And since I have I can't compile the background script with any import/require statements, I can't seperate the BackgroundScript class from the rest of the file. So I need to set a global variable to tell the background script to not run the code that I don't want to run in the test environment.
Object.assign(global, require('jest-chrome')) // sets global.chrome to jest-chrome
global.chrome = { // add some functions that are missing from the latest jest-chrome
    ...global.chrome,
    action: {
        setIcon: jest.fn(),
    },
};
jest.setTimeout(50000); // increase the default timeout for jest tests