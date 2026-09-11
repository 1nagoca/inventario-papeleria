import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import "./Layout.css";

export function Layout() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
