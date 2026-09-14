import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddMedicine from "./pages/AddMedicine";
import ProtectedRoute from "./components/ProtectedRoute";
import Medicine from "./components/MedicinesPage";
import History from "./pages/History";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/add-medicine",
        element: (
          <ProtectedRoute>
            <AddMedicine />
          </ProtectedRoute>
        ),
      },
      {
        path: "/add-application",
        element: <Navigate to="/add-medicine" replace />,
      },
      {
        path: "/medicine",
        element: (
          <ProtectedRoute>
            <Medicine/>
          </ProtectedRoute>
        ),
      },
      {
        path: "/history",
        element: (
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        ),
      },
      {
        path: "/analyzer",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
