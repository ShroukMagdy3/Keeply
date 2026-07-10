import { Briefcase, Trash2, Home, User, Menu, LogIn, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Logout from "../logout/logout";

export default function SideBar() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    const syncAuth = () => setIsAuthed(Boolean(localStorage.getItem("accessToken")));
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  return (
    <>
      <button className="fixed left-4 top-4 z-50 rounded-xl border border-gray-800 bg-gray-900/95 p-2 text-amber-400 shadow-lg lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <Menu size={20} />
      </button>

      <div className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col justify-between border-r border-gray-800 bg-gray-950/95 px-4 py-6 text-white transition-transform lg:w-40 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-center font-signature text-3xl leading-none text-amber-400">
            Keeply<span className="text-amber-600">.</span>
          </h1>

          {isAuthed ? (
            <div className="mt-2 flex flex-col items-center gap-6">
              <NavItem to="/" icon={<Home size={18} />} label="Home" onClick={() => setOpen(false)} />
              <NavItem to="/workspace" icon={<Briefcase size={18} />} label="Workspace" onClick={() => setOpen(false)} />
              <NavItem to="/profile" icon={<User size={18} />} label="Profile" onClick={() => setOpen(false)} />
              <NavItem to="/cycleBin" icon={<Trash2 size={18} />} label="Cycle Bin" onClick={() => setOpen(false)} />
            </div>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-6">
              <NavItem to="/" icon={<Home size={18} />} label="Home" onClick={() => setOpen(false)} />
              <NavItem to="/signIn" icon={<LogIn size={18} />} label="Sign In" onClick={() => setOpen(false)} />
              <NavItem to="/register" icon={<UserPlus size={18} />} label="Sign Up" onClick={() => setOpen(false)} />
            </div>
          )}
        </div>

        {isAuthed && <Logout />}
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)}></div>}
    </>
  );
}

function NavItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex flex-col items-center text-sm transition duration-200 ${isActive ? "font-semibold text-amber-400" : "text-gray-400 hover:text-amber-400"}`}>
      {icon}
      <span className="mt-1">{label}</span>
    </NavLink>
  );
}
