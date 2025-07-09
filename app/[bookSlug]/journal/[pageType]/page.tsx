import EditorClient from "@modules/editor/components/page-client/EditorClient";
import JournalClient from "@modules/journal/components/page-client/JournalClient";
import { pageTypes } from "@resources/types/page";
const JournalEditor = ({
  params: { bookSlug, pageType },
}: {
  params: { bookSlug: string; pageType: string };
}) => {
  if (pageType === pageTypes.journalEditor) {
    return <EditorClient bookSlug={bookSlug} />;
  } else if (pageType === pageTypes.journalViewer) {
    return <JournalClient bookSlug={bookSlug} />;
  }
};

export default JournalEditor;
