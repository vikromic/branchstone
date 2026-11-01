import { SiteShell } from "../app/shell/SiteShell.jsx";
import { useSite } from "../app/SiteContext.jsx";
import { termsCopy } from "../content/copy/legal.js";
import { LegalDocument } from "../features/legal/index.js";

export function TermsPage() {
  const { locale } = useSite();
  return (
    <SiteShell page="terms">
      <LegalDocument page="terms" content={termsCopy[locale]} />
    </SiteShell>
  );
}
