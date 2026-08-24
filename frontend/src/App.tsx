import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import { ExportProvider } from './context/ExportContext';
import { Layout } from './components/Layout';
import { DashboardOverview } from './pages/DashboardOverview';
import { GenderPage } from './pages/GenderPage';
import { EngagementPage } from './pages/EngagementPage';
import { VolunteeringPage } from './pages/VolunteeringPage';
import { EsgCoursesPage } from './pages/EsgCoursesPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminUploads } from './pages/AdminUploads';

function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <ExportProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardOverview />} />
              <Route path="/dashboard/gender" element={<GenderPage />} />
              <Route path="/dashboard/engagement" element={<EngagementPage />} />
              <Route path="/dashboard/volunteering" element={<VolunteeringPage />} />
              <Route path="/dashboard/esg-courses" element={<EsgCoursesPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
            </Route>
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/uploads" element={<AdminUploads />} />
          </Routes>
        </ExportProvider>
      </FilterProvider>
    </BrowserRouter>
  );
}

export default App;
