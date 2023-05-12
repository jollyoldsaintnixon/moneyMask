import PanelIraWidget from "../fidelity/PanelIraWidget";
import PanelTotalWidget from "../fidelity/PanelTotalWidget";
import PositionsRowWidget from "../fidelity/PositionsRowWidget";
import SummarySidebarWidget from "../fidelity/SummarySidebarWidget";
import TradePopOutWidget from "../fidelity/Trade/TradePopOutWidget";

export const classToUrlMap = {
    SummarySidebarWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions)"),
    PanelTotalWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PanelIraWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/summary"),
    PositionsRowWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/positions"),
    TradePopOutWidget: new RegExp("http[s]?:\/\/.+fidelity\.com\/.*portfolio\/(summary|positions)"),
}

export const classConstructorMap = {
    SummarySidebarWidget: SummarySidebarWidget,
    PanelTotalWidget: PanelTotalWidget,
    PanelIraWidget: PanelIraWidget,
    PositionsRowWidget: PositionsRowWidget,
    TradePopOutWidget: TradePopOutWidget,
};