import React from "react";
import Header from "./components/header/Header";
import { Outlet } from "react-router-dom";

function Layout() {
    return (
        <div className="bg-[url('https://as2.ftcdn.net/jpg/04/38/55/69/220_F_438556946_UKupZvZrCzbfIxawj8P57hoDSl7ypza9.jpg')] bg-cover bg-center min-h-screen">
      <Header/>
      <Outlet/>
    </div>
    )
}
export default Layout;