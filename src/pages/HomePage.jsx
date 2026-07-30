import { SiteShell } from "../app/SiteShell.jsx";
import { MaterialStage } from "../features/MaterialStage.jsx";
import "../styles/home.css";

export function HomePage() {
  return (
    <SiteShell page="home" immersive footer={false}>
      <MaterialStage />
    </SiteShell>
  );
}
