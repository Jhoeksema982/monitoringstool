import { Link } from "react-router-dom";
import logo from "/src/assets/images/logo.svg";

export default function Navbar() {
  return (
    <nav className="text-white px-6 py-4 flex items-center justify-between bg-white/0">
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-[139px] h-[75px] rounded" />
      </Link>
      <div className="space-x-4 text-lg font-semibold">
        <Link to="/" className="hover:text-yellow-200 transition">
          Vragenlijst
        </Link>
        <Link to="/admin" className="hover:text-yellow-200 transition">
          Admin
        </Link>
      </div>
    </nav>
  );
}
