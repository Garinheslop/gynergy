import { createSlice } from "@reduxjs/toolkit";
import { visionDiscoveryKeys, visionHighestSelfKeys, visionTypes } from "@resources/types/vision";
import { EditorData, journalTypes } from "@resources/types/journal";
import { ActionData } from "@resources/types/action";

const editorTypes = {
  ...journalTypes,
  ...visionTypes,
};
interface EditorState {
  current: EditorData | null;
  action: ActionData | null;
  images: Record<string, unknown>[];
  type: (typeof editorTypes)[keyof typeof editorTypes] | null;
  isFormComplete: boolean;
  isCompleted: boolean;
  created: boolean;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  fetching: boolean;
  error: string;
}
const initialState: EditorState = {
  current: null,
  action: null,
  images: [],
  type: null,
  isFormComplete: false,
  isCompleted: false,
  created: false,
  loading: false,
  creating: false,
  updating: false,
  fetching: false,
  error: "",
};

const slice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    editorDataCreationRequested: (state) => {
      state.creating = true;
    },
    setEditorDataStates: (state, action) => {
      state.current = action.payload.data;
      state.action = action.payload.action;
      state.type = action.payload.type;
      state.creating = false;
    },
    updateEditorCurrentState: (state, action) => {
      state.current = action.payload;
      if (state.current && state.type) {
        state.isFormComplete = checkForEmptyField(
          {
            ...state.current,
            isEulogy: state.action?.isEulogy,
            isJourneyTable: state.action?.isJourneyTable,
          } as EditorData & { isEulogy?: boolean; isJourneyTable?: boolean },
          state.type
        );
      }
    },
    updateEditorImageState: (state, action) => {
      state.images = action.payload;
    },
    setEditorLoadingState: (state, action) => {
      state.loading = action.payload;
    },
    editorContentCreated: (state, action) => {
      state.created = true;
      state.isCompleted = action?.payload?.isCompleted ? true : false;
    },
    resetEditorDataStates: (state) => {
      state.current = null;
      state.action = null;
      state.images = [];
      state.type = null;
      state.creating = false;
      state.created = false;
      state.isFormComplete = false;
      state.isCompleted = false;
    },
  },
});

// EditorFormData uses `any` intentionally for dynamic form field validation across
// multiple journal types (morning, evening, weekly, visions) with varying field shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorFormData = Record<string, any> & { isEulogy?: boolean; isJourneyTable?: boolean };

const checkForEmptyField = (
  editorData: EditorFormData,
  editorType: (typeof editorTypes)[keyof typeof editorTypes]
) => {
  if (!editorData) return false;
  if (editorType === editorTypes.morningJournal) {
    if (!editorData?.mantra?.trim()) return false;
    else if (
      !editorData?.affirmations?.length ||
      editorData?.affirmations?.filter((val: string) => val?.trim()).length < 5
    )
      return false;
    else if (
      !editorData?.excitements?.length ||
      editorData?.excitements?.filter((val: string) => val?.trim())?.length < 3
    )
      return false;
    else if (
      !editorData?.gratitudes?.length ||
      editorData?.gratitudes?.filter((val: string) => val?.trim())?.length < 3
    )
      return false;
    else if (!editorData?.moodScore) return false;
    else if (!editorData?.moodContribution?.trim()) return false;
    else if (editorData?.isDreamt === undefined) return false;
    else if (editorData?.isDreamt && !editorData?.capturedEssence?.trim()) return false;
    else return true;
  } else if (editorType === editorTypes.eveningJournal) {
    if (!editorData?.insight?.trim()) return false;
    else if (!editorData?.insightImpact?.trim()) return false;
    else if (!editorData?.success?.trim()) return false;
    else if (!editorData?.changes?.trim()) return false;
    else if (!editorData?.moodScore) return false;
    else if (
      !editorData?.dreammagic?.length ||
      editorData?.dreammagic?.filter((val: string) => val?.trim()).length < 5
    )
      return false;
    else return true;
  } else if (editorType === editorTypes.gratitudeAction) {
    if (editorData?.isCompleted === undefined) return false;
    else if (editorData?.isCompleted && !editorData?.reflection?.trim()) return false;
    else if (!editorData?.isCompleted && !editorData?.obstacles?.trim()) return false;
    else return true;
  } else if (editorType === editorTypes.weeklyReflection) {
    if (!editorData?.wins?.trim()) return false;
    else if (!editorData?.challenges?.trim()) return false;
    else if (!editorData?.lessons?.trim()) return false;
    else return true;
  } else if (editorType === editorTypes.weeklyChallenge) {
    if ((!editorData?.isEulogy || !editorData?.isJourneyTable) && editorData?.isCompleted === false)
      return true;
    else if (editorData?.isEulogy && !editorData?.eulogy?.trim()) return false;
    else if (editorData?.isJourneyTable && !editorData?.journey) return false;
    else if (!editorData?.reward?.trim()) return false;
    else if (!editorData?.motivation?.trim()) return false;
    else if (!editorData?.purpose?.trim()) return false;
    else if (!editorData?.success?.trim()) return false;
    else if (!editorData?.focus?.trim()) return false;
    else return true;
  } else if (editorType === editorTypes.highestSelf) {
    if (editorData?.symbols?.file) return true;
    else if (visionHighestSelfKeys.find((field) => editorData && editorData[field]?.trim()))
      return true;
    else return false;
  } else if (editorType === editorTypes.mantra) {
    return editorData?.mantra ? true : false;
  } else if (editorType === editorTypes.creed) {
    return editorData?.creed ? true : false;
  } else if (editorType === editorTypes.discovery) {
    return visionDiscoveryKeys.find((field) => editorData && editorData[field]?.trim())
      ? true
      : false;
  } else return false;
};

export default slice;
