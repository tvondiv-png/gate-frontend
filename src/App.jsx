import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

/* =========================================================
   PROTEÇÕES
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
   LAYOUTS
========================================================= */

import MainLayout from "./layouts/MainLayout";

import AdminLayout from "./layouts/AdminLayout";

import ComandoLayout from "./layouts/ComandoLayout";

import RocamLayout from "./layouts/RocamLayout";

/* =========================================================
   PÁGINAS GERAIS
========================================================= */

import Home from "./pages/Home";

import Login from "./pages/Login";

import SelectPanel from "./pages/SelectPanel";

import ChangePassword from "./pages/ChangePassword";

import Signup from "./pages/Signup";

/* =========================================================
   USER
========================================================= */

import UserDashboard from "./pages/user/UserDashboard";

import RSOUser from "./pages/user/RSOUser";

import IndicationUser from "./pages/user/IndicationUser";

import UserNotifications from "./pages/user/UserNotifications";

import UserProfileRequests from "./pages/user/UserProfileRequests";

import UserPenalCode from "./pages/user/UserPenalCode";

/* =========================================================
   ADMIN
========================================================= */

import AdminDashboard from "./pages/admin/AdminDashboard";

import ConsultaPolicial from "./pages/admin/ConsultaPolicial";

import AdvertenciaAdmin from "./pages/admin/AdvertenciaAdmin";

import UserManagement from "./pages/admin/UserManagement";

import HierarchyAdmin from "./pages/admin/HierarchyAdmin";

import AbsencesAdmin from "./pages/admin/AbsencesAdmin";

import SjdAdmin from "./pages/admin/SjdAdmin";

import SystemLogs from "./pages/admin/SystemLogs";

import GalleryAdmin from "./pages/admin/GalleryAdmin";

import RegulationsAdmin from "./pages/admin/RegulationsAdmin";

import SignupRequests from "./pages/admin/SignupRequests";

import RSOAdmin from "./pages/admin/RSOAdmin";

import AvaliacaoEstagiosAdmin from "./pages/admin/AvaliacaoEstagiosAdmin";

import PatrolHoursAdmin from "./pages/admin/PatrolHoursAdmin";

import RSOHistoryAdmin from "./pages/admin/RSOHistoryAdmin";

import IndicationsAdmin from "./pages/admin/IndicationsAdmin";

import SeizuresAdmin from "./pages/admin/SeizuresAdmin";

import HomeSlidesAdmin from "./pages/admin/HomeSlidesAdmin";

import ApresentacoesEstagiariosAdmin from "./pages/admin/ApresentacoesEstagiariosAdmin";

import AdminActions from "./pages/admin/AdminActions";

import ProfileUpdateRequestsAdmin from "./pages/admin/ProfileUpdateRequestsAdmin";

import PenalCodeAdmin from "./pages/admin/PenalCodeAdmin";

import BalancoOperacionalAdmin from "./pages/admin/BalancoOperacionalAdmin";

/* =========================================================
   COMANDO
========================================================= */

import ComandoDashboard from "./pages/comando/ComandoDashboard";

import ComandoConsultas from "./pages/comando/ComandoConsultas";

import ComandoDisciplina from "./pages/comando/ComandoDisciplina";

import ComandoEfetivo from "./pages/comando/ComandoEfetivo";

import ComandoProdutividade from "./pages/comando/ComandoProdutividade";

import ComandoComunicados from "./pages/comando/ComandoComunicados";

import ComandoDesempenho from "./pages/comando/ComandoDesempenho";

import ComandoPatrulha from "./pages/comando/ComandoPatrulha";

import ComandoAltoComando from "./pages/comando/ComandoAltoComando";

/* =========================================================
   ROCAM
========================================================= */

import RocamDashboard from "./pages/rocam/RocamDashboard";

import RocamHierarquia from "./pages/rocam/RocamHierarquia";

import RocamNovoEstagiario from "./pages/rocam/RocamNovoEstagiario";

import RocamEstagiarios from "./pages/rocam/RocamEstagiarios";

import RocamFichaEstagiario from "./pages/rocam/RocamFichaEstagiario";

import RocamAvaliarEstagiario from "./pages/rocam/RocamAvaliarEstagiario";

import RocamAvaliacoes from "./pages/rocam/RocamAvaliacoes";

import RocamMetas from "./pages/rocam/RocamMetas";

import RocamBracais from "./pages/rocam/RocamBracais";

import RocamComando from "./pages/rocam/RocamComando";

import RocamMensagens from "./pages/rocam/RocamMensagens";

import RocamAvisos from "./pages/rocam/RocamAvisos";

/* =========================================================
   PUBLIC
========================================================= */

import HierarchyPublic from "./pages/public/HierarchyPublic";

import RegulationsPublic from "./pages/public/RegulationsPublic";

import GalleryPublic from "./pages/public/GalleryPublic";

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <Router>

      <Routes>

        {/* ===================================================
            PÚBLICO
        =================================================== */}

        <Route
          element={
            <MainLayout />
          }
        >

          <Route
            path="/"
            element={
              <Home />
            }
          />

          <Route
            path="/hierarquia"
            element={
              <HierarchyPublic />
            }
          />

          <Route
            path="/regulamentos"
            element={
              <RegulationsPublic />
            }
          />

          <Route
            path="/galeria"
            element={
              <GalleryPublic />
            }
          />

          <Route
            path="/cadastro"
            element={
              <Signup />
            }
          />

          <Route
            path="/alterar-senha"
            element={
              <ChangePassword />
            }
          />

        </Route>

        {/* ===================================================
            AUTH
        =================================================== */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />

        <Route
          path="/entrar"
          element={
            <Login />
          }
        />

        <Route
          path="/select-panel"
          element={
            <SelectPanel />
          }
        />

        {/* ===================================================
            USUÁRIO
        =================================================== */}

        <Route
          path="/usuario"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/rso"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
              <RSOUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/indicacao"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
              <IndicationUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/notificacoes"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
              <UserNotifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/requisicoes-cadastrais"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
              <UserProfileRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuario/codigo-penal"
          element={
            <ProtectedRoute
              roles={[
                "user",
                "admin",
                "superadmin"
              ]}
            >
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
            <ProtectedRoute
              roles={[
                "admin",
                "superadmin"
              ]}
            >
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route
            index
            element={
              <AdminDashboard />
            }
          />

          <Route
            path="usuarios"
            element={
              <ProtectedRoute
                roles={[
                  "superadmin"
                ]}
              >
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="hierarquia"
            element={
              <HierarchyAdmin />
            }
          />

          <Route
            path="advertencias"
            element={
              <AdvertenciaAdmin />
            }
          />

          <Route
            path="consulta"
            element={
              <ConsultaPolicial />
            }
          />

          <Route
            path="ausencias"
            element={
              <AbsencesAdmin />
            }
          />

          <Route
            path="justica"
            element={
              <SjdAdmin />
            }
          />

          <Route
            path="sjd"
            element={
              <SjdAdmin />
            }
          />

          <Route
            path="logs"
            element={
              <SystemLogs />
            }
          />

          <Route
            path="galeria"
            element={
              <GalleryAdmin />
            }
          />

          <Route
            path="regulamentos"
            element={
              <RegulationsAdmin />
            }
          />

          <Route
            path="solicitacoes"
            element={
              <SignupRequests />
            }
          />

          <Route
            path="rso"
            element={
              <RSOAdmin />
            }
          />

          <Route
            path="rso-historico"
            element={
              <RSOHistoryAdmin />
            }
          />

          <Route
            path="horas"
            element={
              <PatrolHoursAdmin />
            }
          />

          <Route
            path="acoes"
            element={
              <AdminActions />
            }
          />

          <Route
            path="apreensoes"
            element={
              <SeizuresAdmin />
            }
          />

          <Route
            path="balanco-operacional"
            element={
              <BalancoOperacionalAdmin />
            }
          />

          <Route
            path="avaliacoes-estagio"
            element={
              <AvaliacaoEstagiosAdmin />
            }
          />

          <Route
            path="indicacoes"
            element={
              <IndicationsAdmin />
            }
          />

          <Route
            path="apresentacoes-estagiarios"
            element={
              <ApresentacoesEstagiariosAdmin />
            }
          />

          <Route
            path="requisicoes-cadastrais"
            element={
              <ProfileUpdateRequestsAdmin />
            }
          />

          <Route
            path="slideshow"
            element={
              <HomeSlidesAdmin />
            }
          />

          <Route
            path="codigo-penal"
            element={
              <PenalCodeAdmin />
            }
          />

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

          <Route
            index
            element={
              <ComandoDashboard />
            }
          />

          <Route
            path="consultas"
            element={
              <ComandoConsultas />
            }
          />

          <Route
            path="disciplina"
            element={
              <ComandoDisciplina />
            }
          />

          <Route
            path="efetivo"
            element={
              <ComandoEfetivo />
            }
          />

          <Route
            path="produtividade"
            element={
              <ComandoProdutividade />
            }
          />

          <Route
            path="comunicados"
            element={
              <ComandoComunicados />
            }
          />

          <Route
            path="desempenho"
            element={
              <ComandoDesempenho />
            }
          />

          <Route
            path="patrulha"
            element={
              <ComandoPatrulha />
            }
          />

          <Route
            path="alto-comando"
            element={
              <ComandoAltoComando />
            }
          />

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

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            index
            element={
              <RocamDashboard />
            }
          />

          {/* =================================================
              HIERARQUIA
          ================================================= */}

          <Route
            path="hierarquia"
            element={
              <RocamHierarquia />
            }
          />

          {/* =================================================
              BRAÇAL ROCAM
          ================================================= */}

          <Route
            path="avaliar-estagiarios"
            element={
              <RocamAvaliarEstagiario />
            }
          />

          {/* =================================================
              COMANDO ROCAM
          ================================================= */}

          <Route
            path="comando"
            element={
              <RocamComando />
            }
          />

          <Route
            path="novo-estagiario"
            element={
              <RocamNovoEstagiario />
            }
          />

          <Route
            path="estagiarios"
            element={
              <RocamEstagiarios />
            }
          />

          <Route
            path="estagiarios/:userId"
            element={
              <RocamFichaEstagiario />
            }
          />

          <Route
            path="bracais"
            element={
              <RocamBracais />
            }
          />

          <Route
            path="metas"
            element={
              <RocamMetas />
            }
          />

          <Route
            path="avaliacoes"
            element={
              <RocamAvaliacoes />
            }
          />

          {/* =================================================
              COMUNICAÇÃO ROCAM
          ================================================= */}

          <Route
            path="mensagens"
            element={
              <RocamMensagens />
            }
          />

          <Route
            path="avisos"
            element={
              <RocamAvisos />
            }
          />

        </Route>

      </Routes>

    </Router>
  );
}