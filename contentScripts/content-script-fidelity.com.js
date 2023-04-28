import FIDELITY_WIDGET_MAP from "../classes/UrlsToWidgetsMaps/FidelityUrlsToWidgetsMap.js";
import ContentScript from "../classes/ContentScript.js";
(new ContentScript(FIDELITY_WIDGET_MAP)).init();
