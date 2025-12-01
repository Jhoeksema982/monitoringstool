import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Survey from "./pages/Survey";
import Admin from "./pages/Admin";
import Navbar from "./components/Navbar";
import backgroundImage from "./assets/images/background2.jpeg";

const backgroundStyle = {
  backgroundImage: `linear-gradient(120deg, rgba(2, 102, 102, 0.9), rgba(2, 102, 102, 1.7)), url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  backgroundRepeat: "no-repeat",
};

function AppContent() {
  const location = useLocation();
  const isSurveyRoute = location.pathname === "/";

  const wrapperClass = isSurveyRoute
    ? "min-h-screen text-white"
    : "min-h-screen bg-teal-800 text-white";

  const contentClass = isSurveyRoute
    ? "min-h-[calc(100vh-96px)] flex flex-col items-center py-10 px-4"
    : "";

  return (
    <div className={wrapperClass} style={isSurveyRoute ? backgroundStyle : undefined}>
      <Navbar />
      <div className={contentClass}>
        <Routes>
          <Route path="/" element={<Survey />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
