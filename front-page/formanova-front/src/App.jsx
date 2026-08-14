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
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}