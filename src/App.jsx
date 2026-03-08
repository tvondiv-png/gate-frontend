import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";


import "./styles/gate-theme.css";
import "./styles/animations.css";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import SelectPanel from "./pages/SelectPanel";
import ChangePassword from "./pages/ChangePassword";

import UserDashboard from "./pages/user/UserDashboard";
import RSOUser from "./pages/user/RSOUser";
import IndicationUser from "./pages/user/IndicationUser";
import UserNotifications from "./pages/user/UserNotifications";


import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import HierarchyAdmin from "./pages/admin/HierarchyAdmin";
import AbsencesAdmin from "./pages/admin/AbsencesAdmin";
import Discipline from "./pages/admin/Discipline";
import SystemLogs from "./pages/admin/SystemLogs";
import GalleryAdmin from "./pages/admin/GalleryAdmin";
import RegulationsAdmin from "./pages/admin/RegulationsAdmin";
import SignupRequests from "./pages/admin/SignupRequests";
import RSOAdmin from "./pages/admin/RSOAdmin";
import PatrolHoursAdmin from "./pages/admin/PatrolHoursAdmin";
import RSOHistoryAdmin from "./pages/admin/RSOHistoryAdmin";
import IndicationsAdmin from "./pages/admin/IndicationsAdmin";
import SeizuresAdmin from "./pages/admin/SeizuresAdmin";
import HomeSlidesAdmin from "./pages/admin/HomeSlidesAdmin";


import HierarchyPublic from "./pages/public/HierarchyPublic";
import RegulationsPublic from "./pages/public/RegulationsPublic";
import GalleryPublic from "./pages/public/GalleryPublic";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <Router>
      <Routes>

        {/* PÚBLICO */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/hierarquia" element={<HierarchyPublic />} />
          <Route path="/regulamentos" element={<RegulationsPublic />} />
          <Route path="/galeria" element={<GalleryPublic />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/alterar-senha" element={<ChangePassword />} />
        </Route>

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/select-panel" element={<SelectPanel />} />

        {/* USUÁRIO */}
        <Route path="/usuario" element={<UserDashboard />} />
        <Route path="/usuario/rso" element={<RSOUser />} />
        <Route path="/usuario/indicacao" element={<IndicationUser />} />
        <Route path="/usuario/notificacoes" element={<UserNotifications />} />


        {/* ADMIN */}
        <Route
  path="/admin"
  element={
    <ProtectedRoute roles={["admin", "superadmin"]}>
      <AdminLayout />
    </ProtectedRoute>
  }
>

          <Route index element={<AdminDashboard />} />
          <Route path="usuarios" element={<UserManagement />} />
          <Route path="hierarquia" element={<HierarchyAdmin />} />
          <Route path="ausencias" element={<AbsencesAdmin />} />
          <Route path="justica" element={<Discipline />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="galeria" element={<GalleryAdmin />} />
          <Route path="regulamentos" element={<RegulationsAdmin />} />
          <Route path="solicitacoes" element={<SignupRequests />} />
          <Route path="rso" element={<RSOAdmin />} />
          <Route path="horas" element={<PatrolHoursAdmin />} />
          <Route path="rso-historico" element={<RSOHistoryAdmin />} />
          <Route path="indicacoes" element={<IndicationsAdmin />} />
          <Route path="apreensoes" element={<SeizuresAdmin />} />
          <Route path="slideshow" element={<HomeSlidesAdmin />} />
          

        </Route>

      </Routes>
    </Router>
  );
}
