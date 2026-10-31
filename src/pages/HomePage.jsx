import { SiteShell } from "../app/shell/SiteShell.jsx";
import { HomeStage } from "../features/home/index.js";
import "../styles/home.css";

export function HomePage() {
  return (
    <SiteShell page="home" immersive footer={false}>
      <HomeStage />
    </SiteShell>
  );
}
