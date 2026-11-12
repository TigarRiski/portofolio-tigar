import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import PublicPortfolio from './pages/PublicPortfolio';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPortfolio />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink px-4 text-center text-white">
              <p className="font-display text-4xl font-bold">404</p>
              <p className="text-sm text-white/55">Halaman tidak ditemukan.</p>
              <Link to="/" className="grad-bg rounded-full px-6 py-2.5 text-sm font-bold">Kembali ke Beranda</Link>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
