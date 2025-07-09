import { combineComponents } from "@lib/utils/components";

//react context
import SessionContextProvider from "@contexts/UseSession";
import UsePopupContextProvider from "@contexts/UsePopup";
import RealtimeDataContextProvider from "@contexts/UseRealtimeData";

const providers = [SessionContextProvider, UsePopupContextProvider, RealtimeDataContextProvider];

export default combineComponents(...providers);
