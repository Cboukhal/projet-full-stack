/**
 * Point d'entrée déclaratif de la navigation.
 * Les routes publiques gèrent l'authentification et les routes métier délèguent
 * le contrôle des rôles à `ProtectedRoute`.
 */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { getRoleHome } from "./authRoutes";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import ReinitialiserMotDePasse from "./pages/ReinitialiserMotDePasse";
import Accueil from "./pages/Accueil";
import Profil from "./pages/Profil";
import Calendrier from "./pages/Calendrier";
import CourseDetail from "./pages/CourseDetail";
import Inscriptions from "./pages/referente/Inscriptions";
import Filieres from "./pages/referente/Filieres";
import Cursus from "./pages/referente/Cursus";
import Cours from "./pages/referente/Cours";
import Promotions from "./pages/referente/Promotions";
import Salles from "./pages/referente/Salles";
import SalleForm from "./pages/referente/SalleForm";
import FiliereForm from "./pages/referente/FiliereForm";
import CursusForm from "./pages/referente/CursusForm";
import CoursForm from "./pages/referente/CoursForm";
import PromotionDetail from "./pages/referente/PromotionDetail";
import PlanifierCours from "./pages/referente/PlanifierCours";
import PlanifierPromotion from "./pages/referente/PlanifierPromotion";

/** Redirige l'entrée de session selon l'état de chargement, le rôle et la connexion. */
function SessionEntry({ showLogin = false }) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return showLogin ? <Login /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          {/* Entrées publiques et redirection initiale selon la session. */}
          <Route path="/" element={<SessionEntry />} />
          <Route path="/login" element={<SessionEntry showLogin />} />
          {/* Ces deux pages restent accessibles sans session : le lien reçu
              par e-mail sert lui-même de preuve temporaire. */}
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ReinitialiserMotDePasse />} />

          {/* Espace commun à tous les utilisateurs authentifiés. */}
          <Route
            path="/accueil"
            element={
              <ProtectedRoute>
                <Accueil />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profil />
              </ProtectedRoute>
            }
          />

          {/* Parcours de consultation réservé aux élèves. */}
          <Route
            path="/calendrier"
            element={
              <ProtectedRoute allowedRoles={["eleve"]}>
                <Calendrier />
              </ProtectedRoute>
            }
          />

          <Route
            path="/calendrier/:courseId"
            element={
              <ProtectedRoute allowedRoles={["eleve"]}>
                <CourseDetail />
              </ProtectedRoute>
            }
          />

          {/* L'espace référente possède une page de liste par domaine métier. */}
          <Route 
          path="/espace-referente" 
          element={
          <Navigate to="/espace-referente/filieres" replace />
          }
          />

          <Route
            path="/espace-referente/filieres"
            element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Filieres />
              </ProtectedRoute>
          } />

          <Route
            path="/espace-referente/cursus"
            element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Cursus />
              </ProtectedRoute>
          } />

          <Route 
          path="/espace-referente/cours" 
          element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Cours />
              </ProtectedRoute>
          } />

          <Route
           path="/espace-referente/promotions"
            element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Promotions />
              </ProtectedRoute>
          } />

          <Route
           path="/espace-referente/salles"
            element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Salles />
              </ProtectedRoute>
          } />

          <Route 
          path="/espace-referente/inscriptions" 
          element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Inscriptions />
            </ProtectedRoute>
          } />

          {/* Le joker réutilise la logique d'entrée pour éviter une page sans issue. */}
          <Route 
          path="*" 
          element={<SessionEntry />} />

          {/* Formulaires et vues détaillées de l'espace référente. */}
          <Route
          path="/espace-referente/filieres/:filiereId"
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <FiliereForm />
            </ProtectedRoute>} />

          <Route
          path="/espace-referente/cursus/:cursusId"
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <CursusForm />
            </ProtectedRoute>} />

          <Route
          path="/espace-referente/salles/:salleId"
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <SalleForm />
            </ProtectedRoute>} />

          <Route
          path="/espace-referente/cursus/:cursusId/planifier-promotion"
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <PlanifierPromotion />
            </ProtectedRoute>} />

          <Route
          path="/espace-referente/cours/:coursNom"
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <CoursForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/promotions/:promoId" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <PromotionDetail />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/promotions/:promoId/planifier-cours" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <PlanifierCours />
          </ProtectedRoute>} />
          
        </Routes>
      </BrowserRouter>
  );
}
