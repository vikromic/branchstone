import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { privacyCopy } from "../content/copy/legal.js";
import { LegalDocument } from "../features/legal/index.js";

export function PrivacyPage() {
  const { locale } = useSite();
  return (
    <SiteShell page="privacy">
      <LegalDocument page="privacy" content={privacyCopy[locale]} />
    </SiteShell>
  );
}
