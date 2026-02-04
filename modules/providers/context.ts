
//react context
import UsePopupContextProvider from "@contexts/UsePopup";
import RealtimeDataContextProvider from "@contexts/UseRealtimeData";
import SessionContextProvider from "@contexts/UseSession";
import { combineComponents } from "@lib/utils/components";

const providers = [SessionContextProvider, UsePopupContextProvider, RealtimeDataContextProvider];

export default combineComponents(...providers);
