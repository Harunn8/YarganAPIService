import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DevicesPage from './pages/DevicesPage';
import RulesPage from './pages/RulesPage';
import SatopsPage from './pages/SatopsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<DevicesPage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="satops" element={<SatopsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
