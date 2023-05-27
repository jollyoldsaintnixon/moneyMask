import PanelIraWidget from "../fidelity/Portfolio/Summary/PanelIraWidget";
import PanelGraphWidget from "../fidelity/Portfolio/Summary/PanelGraphWidget";
import PositionsRowWidget from "../fidelity/Portfolio/Positions/PositionsRowWidget";
import PortfolioSidebarWidget from "../fidelity/Portfolio/PortfolioSidebarWidget";
import TradePopOutWidget from "../fidelity/Trade/TradePopOutWidget";
import BalanceSheetWidget from "../fidelity/Portfolio/Balance/BalanceSheetWidget";
import BalanceSidebarWidget from "../fidelity/Portfolio/Balance/BalanceSidebarWidget";
import PlanningSummaryWidget from "../fidelity/Portfolio/Plan/PlanningSummaryWidget";

/**
 * There are two exported objects used in conjunction to load the correct widget(s) for a given URL.
 * 
 * classToUrlMap is an object whose keys are the names of widget classes and whose values are regexes that match the URL path for which the widget should be loaded.
 * 
 * classConstructorMap is an object whose keys are the names of widget classes and whose values are the corresponding widget class constructors.
 * 
 * The concept of the mapping is thus: Upon a URL change or page load, the WidgetController will run through the classToUrlMap and test the URL against each regex value. If there is a match, then the corresponding class constructor added to the controller's "activeWidgets" list. The controller runs through each regex value in classToUrlMap for a O(n) time complexity.
 * 
 * Next, the controller will instantiate each widget in the activeWidgets list by looking up the widget in the second object, classToConstructorMap. This object has the same keys as classToUrlMap, but the values are the actual class constructors. The lookup speed is O(1) per active widget (there is no need to iterate through the keys or values of classToConstructorMap).
 */

export const classToUrlMap = {
    PortfolioSidebarWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions|activity)"),
    PanelGraphWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PanelIraWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PositionsRowWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/positions"),
    TradePopOutWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions)"),
    BalanceSheetWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/portfolio#balances"),
    BalanceSidebarWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/portfolio#balances"),
    PlanningSummaryWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*plan-summary\/summary")
}

export const classConstructorMap = {
    PortfolioSidebarWidget: PortfolioSidebarWidget,
    PanelGraphWidget: PanelGraphWidget,
    PanelIraWidget: PanelIraWidget,
    PositionsRowWidget: PositionsRowWidget,
    TradePopOutWidget: TradePopOutWidget,
    BalanceSheetWidget: BalanceSheetWidget,
    BalanceSidebarWidget: BalanceSidebarWidget,
    PlanningSummaryWidget: PlanningSummaryWidget
};