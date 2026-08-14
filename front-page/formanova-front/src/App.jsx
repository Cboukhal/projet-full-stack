import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Profil from "./pages/Profil";
import Calendrier from "./pages/Calendrier";
import CourseDetail from "./pages/CourseDetail";

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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}