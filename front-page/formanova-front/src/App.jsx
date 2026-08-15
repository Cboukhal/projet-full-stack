import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Profil from "./pages/Profil";
import Calendrier from "./pages/Calendrier";
import CourseDetail from "./pages/CourseDetail";
import Inscriptions from "./pages/referente/Inscriptions";
import Filieres from "./pages/referente/Filieres";
import Cursus from "./pages/referente/Cursus";
import Cours from "./pages/referente/Cours";
import Promotions from "./pages/referente/Promotions";
import FiliereForm from "./pages/referente/FiliereForm";
import CursusForm from "./pages/referente/CursusForm";
import CoursForm from "./pages/referente/CoursForm";
import PromotionDetail from "./pages/referente/PromotionDetail";
import PlanifierCours from "./pages/referente/PlanifierCours";
import PlanifierPromotion from "./pages/referente/PlanifierPromotion";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/profil"
            element={
              <ProtectedRoute>
                <Profil />
              </ProtectedRoute>
            }
          />

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
          path="/espace-referente/inscriptions" 
          element={
            <ProtectedRoute allowedRoles={["referente"]}>
              <Inscriptions />
            </ProtectedRoute>
          } />

          <Route 
          path="*" 
          element={<Navigate to="/login" replace />
          } />

          <Route 
          path="/espace-referente/filieres/nouveau" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <FiliereForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/filieres/:filiereId" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <FiliereForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/cursus/nouveau" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <CursusForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/cursus/:cursusId" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <CursusForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/cursus/:cursusId/planifier-promotion" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <PlanifierPromotion />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/cours/nouveau" 
          element={<ProtectedRoute allowedRoles={["referente"]}>
            <CoursForm />
            </ProtectedRoute>} />

          <Route 
          path="/espace-referente/cours/:coursId" 
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
    </AuthProvider>
  );
}