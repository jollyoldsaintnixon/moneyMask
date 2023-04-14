import fs from "fs";
import path from "path";
import WidgetBase from "../classes/WidgetBase";

// import all the maps
const mapFolderPath = path.join(__dirname, "../classes/UrlsToWidgetsMaps/");
const mapFiles = fs.readdirSync(mapFolderPath);
// const mapFiles = fs.readdirSync("../classes/UrlsToWidgetsMap/");
// const mapFiles = fs.readdirSync('/home/jollyoldsaintnixon/work/brokerageMaskChromeExtension/classes/UrlsToWidgetsMaps');

const modules = mapFiles.map(file => {
    const mapFilePath = path.join(mapFolderPath, file);
    // const mapFilePath = path.join(__dirname, "../classes/UrlsToWidgetsMap/", file);
    return {
        name: file,
        module: require(mapFilePath).default,
    }
})


// describe('WidgetMap', () => {
describe.each(modules)('$name', ({ module }) => {
    test('each file in the UrlsToWidgetsMap directory should export an object that has a key that is a regex string and a value that is an array of uninstantiated widget classes', () => {
        // is object
        expect(typeof module).toBe('object');

        Object.entries(module).forEach(([key, value]) => {
            // check key is valid regex
            expect(() => new RegExp(key)).not.toThrow();
            // check that value is array of uninstantiated widget classes that inherit from WidgetBase
            expect(Array.isArray(value)).toBe(true);
            value.forEach(widgetClass => {
                expect(widgetClass.prototype instanceof WidgetBase).toBeTruthy();
            })
        })
    });
});