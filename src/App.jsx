import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

/* =========================================================
   PROTEÇÕES  (leves, carregadas junto do app)
========================================================= */

import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedComandoRoute from "./components/ProtectedComandoRoute";
import ProtectedRocamRoute from "./components/ProtectedRocamRoute";

/* =========================================================
   ESTILOS GLOBAIS
========================================================= */

import "./styles/gate-theme.css";
import "./styles/animations.css";

/* =========================================================
   LAYOUTS  (wrappers de rota, carregados sob demanda)
========================================================= */

const MainLayout = lazy(() => import("./layouts/MainLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const ComandoLayout = lazy(() => import("./layouts/ComandoLayout"));
const RocamLayout = lazy(() => import("./layouts/RocamLayout"));

/* =========================================================
   PÁGINAS GERAIS
========================================================= */

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const SelectPanel = lazy(() => import("./pages/SelectPanel"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const Signup = lazy(() => import("./pages/Signup"));

/* =========================================================
   USER
========================================================= */

const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const RSOUser = lazy(() => import("./pages/user/RSOUser"));
const IndicationUser = lazy(() => import("./pages/user/IndicationUser"));
const UserNotifications = lazy(() => import("./pages/user/UserNotifications"));
const UserProfileRequests = lazy(() => import("./pages/user/UserProfileRequests"));
const UserPenalCode = lazy(() => import("./pages/user/UserPenalCode"));

/* =========================================================
   ADMIN
========================================================= */

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ConsultaPolicial = lazy(() => import("./pages/admin/ConsultaPolicial"));
const AdvertenciaAdmin = lazy(() => import("./pages/admin/AdvertenciaAdmin"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const HierarchyAdmin = lazy(() => import("./pages/admin/HierarchyAdmin"));
const AbsencesAdmin = lazy(() => import("./pages/admin/AbsencesAdmin"));
const SjdAdmin = lazy(() => import("./pages/admin/SjdAdmin"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
const GalleryAdmin = lazy(() => import("./pages/admin/GalleryAdmin"));
const RegulationsAdmin = lazy(() => import("./pages/admin/RegulationsAdmin"));
const SignupRequests = lazy(() => import("./pages/admin/SignupRequests"));
const RSOAdmin = lazy(() => import("./pages/admin/RSOAdmin"));
const AvaliacaoEstagiosAdmin = lazy(() => import("./pages/admin/AvaliacaoEstagiosAdmin"));
const PatrolHoursAdmin = lazy(() => import("./pages/admin/PatrolHoursAdmin"));
const RSOHistoryAdmin = lazy(() => import("./pages/admin/RSOHistoryAdmin"));
const IndicationsAdmin = lazy(() => import("./pages/admin/IndicationsAdmin"));
const SeizuresAdmin = lazy(() => import("./pages/admin/SeizuresAdmin"));
const HomeSlidesAdmin = lazy(() => import("./pages/admin/HomeSlidesAdmin"));
const ApresentacoesEstagiariosAdmin = lazy(() => import("./pages/admin/ApresentacoesEstagiariosAdmin"));
const AdminActions = lazy(() => import("./pages/admin/AdminActions"));
const ProfileUpdateRequestsAdmin = lazy(() => import("./pages/admin/ProfileUpdateRequestsAdmin"));
const PenalCodeAdmin = lazy(() => import("./pages/admin/PenalCodeAdmin"));
const BalancoOperacionalAdmin = lazy(() => import("./pages/admin/BalancoOperacionalAdmin"));
const HistoriaAdmin = lazy(() => import("./pages/admin/HistoriaAdmin"));

/* =========================================================
   COMANDO
========================================================= */

const ComandoDashboard = lazy(() => import("./pages/comando/ComandoDashboard"));
const ComandoConsultas = lazy(() => import("./pages/comando/ComandoConsultas"));
const ComandoDisciplina = lazy(() => import("./pages/comando/ComandoDisciplina"));
const ComandoEfetivo = lazy(() => import("./pages/comando/ComandoEfetivo"));
const ComandoProdutividade = lazy(() => import("./pages/comando/ComandoProdutividade"));
const ComandoMetas = lazy(() => import("./pages/comando/ComandoMetas"));
const ComandoGraficos = lazy(() => import("./pages/comando/ComandoGraficos"));
const ComandoComunicados = lazy(() => import("./pages/comando/ComandoComunicados"));
const ComandoDesempenho = lazy(() => import("./pages/comando/ComandoDesempenho"));
const ComandoPatrulha = lazy(() => import("./pages/comando/ComandoPatrulha"));
const ComandoAltoComando = lazy(() => import("./pages/comando/ComandoAltoComando"));

/* =========================================================
   ROCAM
========================================================= */

const RocamDashboard = lazy(() => import("./pages/rocam/RocamDashboard"));
const RocamHierarquia = lazy(() => import("./pages/rocam/RocamHierarquia"));
const RocamNovoEstagiario = lazy(() => import("./pages/rocam/RocamNovoEstagiario"));
const RocamEstagiarios = lazy(() => import("./pages/rocam/RocamEstagiarios"));
const RocamFichaEstagiario = lazy(() => import("./pages/rocam/RocamFichaEstagiario"));
const RocamAvaliarEstagiario = lazy(() => import("./pages/rocam/RocamAvaliarEstagiario"));
const RocamAvaliacoes = lazy(() => import("./pages/rocam/RocamAvaliacoes"));
const RocamMetas = lazy(() => import("./pages/rocam/RocamMetas"));
const RocamBracais = lazy(() => import("./pages/rocam/RocamBracais"));
const RocamComando = lazy(() => import("./pages/rocam/RocamComando"));
const RocamMensagens = lazy(() => import("./pages/rocam/RocamMensagens"));
const RocamAvisos = lazy(() => import("./pages/rocam/RocamAvisos"));

/* =========================================================
   PUBLIC
========================================================= */

const HierarchyPublic = lazy(() => import("./pages/public/HierarchyPublic"));
const RegulationsPublic = lazy(() => import("./pages/public/RegulationsPublic"));
const GalleryPublic = lazy(() => import("./pages/public/GalleryPublic"));
const HistoriaPublic = lazy(() => import("./pages/public/HistoriaPublic"));

/* =========================================================
   FALLBACK DE CARREGAMENTO
========================================================= */

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "#888",
        fontSize: 14
      }}
    >
      Carregando...
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* ===================================================
              PÚBLICO
          =================================================== */}

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/hierarquia" element={<HierarchyPublic />} />
            <Route path="/regulamentos" element={<RegulationsPublic />} />
            <Route path="/historia" element={<HistoriaPublic />} />
            <Route path="/galeria" element={<GalleryPublic />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/alterar-senha" element={<ChangePassword />} />
          </Route>

          {/* ===================================================
              AUTH
          =================================================== */}

          <Route path="/login" element={<Login />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/select-panel" element={<SelectPanel />} />

          {/* ===================================================
              USUÁRIO
          =================================================== */}

          <Route
            path="/usuario"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/rso"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <RSOUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/indicacao"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <IndicationUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/notificacoes"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <UserNotifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/requisicoes-cadastrais"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <UserProfileRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuario/codigo-penal"
            element={
              <ProtectedRoute roles={["user", "admin", "superadmin"]}>
                <UserPenalCode />
              </ProtectedRoute>
            }
          />

          {/* ===================================================
              ADMIN
          =================================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />

            <Route
              path="usuarios"
              element={
                <ProtectedRoute roles={["superadmin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route path="hierarquia" element={<HierarchyAdmin />} />
            <Route path="advertencias" element={<AdvertenciaAdmin />} />
            <Route path="consulta" element={<ConsultaPolicial />} />
            <Route path="ausencias" element={<AbsencesAdmin />} />
            <Route path="justica" element={<SjdAdmin />} />
            <Route path="sjd" element={<SjdAdmin />} />
            <Route path="logs" element={<SystemLogs />} />
            <Route path="galeria" element={<GalleryAdmin />} />
            <Route path="regulamentos" element={<RegulationsAdmin />} />
            <Route path="solicitacoes" element={<SignupRequests />} />
            <Route path="rso" element={<RSOAdmin />} />
            <Route path="rso-historico" element={<RSOHistoryAdmin />} />
            <Route path="horas" element={<PatrolHoursAdmin />} />
            <Route path="acoes" element={<AdminActions />} />
            <Route path="apreensoes" element={<SeizuresAdmin />} />
            <Route path="balanco-operacional" element={<BalancoOperacionalAdmin />} />
            <Route path="avaliacoes-estagio" element={<AvaliacaoEstagiosAdmin />} />
            <Route path="indicacoes" element={<IndicationsAdmin />} />
            <Route path="apresentacoes-estagiarios" element={<ApresentacoesEstagiariosAdmin />} />
            <Route path="requisicoes-cadastrais" element={<ProfileUpdateRequestsAdmin />} />
            <Route path="slideshow" element={<HomeSlidesAdmin />} />
            <Route path="codigo-penal" element={<PenalCodeAdmin />} />
            <Route path="historia" element={<HistoriaAdmin />} />
          </Route>

          {/* ===================================================
              COMANDO
          =================================================== */}

          <Route
            path="/comando"
            element={
              <ProtectedComandoRoute>
                <ComandoLayout />
              </ProtectedComandoRoute>
            }
          >
            <Route index element={<ComandoDashboard />} />
            <Route path="consultas" element={<ComandoConsultas />} />
            <Route path="disciplina" element={<ComandoDisciplina />} />
            <Route path="efetivo" element={<ComandoEfetivo />} />
            <Route path="produtividade" element={<ComandoProdutividade />} />
            <Route path="metas" element={<ComandoMetas />} />
            <Route path="graficos" element={<ComandoGraficos />} />
            <Route path="comunicados" element={<ComandoComunicados />} />
            <Route path="desempenho" element={<ComandoDesempenho />} />
            <Route path="patrulha" element={<ComandoPatrulha />} />
            <Route path="alto-comando" element={<ComandoAltoComando />} />
          </Route>

          {/* ===================================================
              ROCAM
          =================================================== */}

          <Route
            path="/rocam"
            element={
              <ProtectedRocamRoute>
                <RocamLayout />
              </ProtectedRocamRoute>
            }
          >
            <Route index element={<RocamDashboard />} />
            <Route path="hierarquia" element={<RocamHierarquia />} />
            <Route path="avaliar-estagiarios" element={<RocamAvaliarEstagiario />} />
            <Route path="comando" element={<RocamComando />} />
            <Route path="novo-estagiario" element={<RocamNovoEstagiario />} />
            <Route path="estagiarios" element={<RocamEstagiarios />} />
            <Route path="estagiarios/:userId" element={<RocamFichaEstagiario />} />
            <Route path="bracais" element={<RocamBracais />} />
            <Route path="metas" element={<RocamMetas />} />
            <Route path="avaliacoes" element={<RocamAvaliacoes />} />
            <Route path="mensagens" element={<RocamMensagens />} />
            <Route path="avisos" element={<RocamAvisos />} />
          </Route>

        </Routes>
      </Suspense>
    </Router>
  );
}
