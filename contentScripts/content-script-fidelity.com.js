import {
    classToUrlMap,
    classConstructorMap,
} from "../classes/UrlsToWidgetsMaps/FidelityUrlsToWidgetsMap.js";
import ContentScript from "../classes/ContentScript.js";
(new ContentScript(classToUrlMap, classConstructorMap)).init();
