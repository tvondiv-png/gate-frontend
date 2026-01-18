import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function MainLayout() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 80 }}>
        <Outlet />
      </main>
    </>
  );
}
