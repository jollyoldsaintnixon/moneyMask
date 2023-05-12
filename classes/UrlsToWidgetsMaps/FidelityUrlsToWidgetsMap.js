import PanelIraWidget from "../fidelity/Portfolio/PanelIraWidget";
import PanelTotalWidget from "../fidelity/Portfolio/PanelTotalWidget";
import PositionsRowWidget from "../fidelity/Portfolio/PositionsRowWidget";
import PortfolioSidebarWidget from "../fidelity/Portfolio/PortfolioSidebarWidget";
import TradePopOutWidget from "../fidelity/Trade/TradePopOutWidget";
import BalanceSheetWidget from "../fidelity/Portfolio/BalanceSheetWidget";

export const classToUrlMap = {
    PortfolioSidebarWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions|portfolio#balances)"),
    PanelTotalWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PanelIraWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PositionsRowWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/positions"),
    TradePopOutWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions)"),
    BalanceSheetWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/portfolio#balances"),
}

export const classConstructorMap = {
    PortfolioSidebarWidget: PortfolioSidebarWidget,
    PanelTotalWidget: PanelTotalWidget,
    PanelIraWidget: PanelIraWidget,
    PositionsRowWidget: PositionsRowWidget,
    TradePopOutWidget: TradePopOutWidget,
    BalanceSheetWidget: BalanceSheetWidget,
};