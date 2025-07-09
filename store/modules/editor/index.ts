import editor from "./reducers";

export const {
  editorDataCreationRequested,
  setEditorDataStates,
  updateEditorCurrentState,
  updateEditorImageState,
  setEditorLoadingState,
  resetEditorDataStates,
  editorContentCreated,
} = editor.actions;

export default editor.reducer;
