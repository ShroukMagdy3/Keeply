import React from 'react'
import SideBar from '../../components/sidebar/sideBar';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-950">
      <SideBar />
      <div className="min-h-screen lg:ml-40">
        <Outlet />
      </div>
    </div>
  );
}