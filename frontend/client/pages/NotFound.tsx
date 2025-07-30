import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100" aria-label="Página não encontrada">
      <section className="text-center" role="alert" aria-live="assertive">
        <h1 className="text-5xl font-extrabold mb-4 text-blue-700" tabIndex={0} aria-label="Erro 404">404</h1>
        <p className="text-xl text-gray-600 mb-6" tabIndex={0} aria-label="Página não encontrada">Oops! Página não encontrada.</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-6 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          Voltar para Home
        </button>
      </section>
    </main>
  );
};

export default NotFound;
