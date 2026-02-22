import ErrorBoundary from "@modules/common/components/ErrorBoundary";
import SettingsPageClient from "@modules/settings/components/page-client/SettingsPageClient";

const SettingsPage = () => {
  return (
    <ErrorBoundary>
      <SettingsPageClient />
    </ErrorBoundary>
  );
};

export default SettingsPage;
