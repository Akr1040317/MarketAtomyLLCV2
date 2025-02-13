import React, { useState } from "react";
import { FaBars, FaAngleLeft, FaHome, FaUser, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Mode0 from "./Mode0"; // <-- 1. Import the Mode0 component

export default function Dashboard() {
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setDesktopSidebarOpen(!desktopSidebarOpen);
  };

  const handleSignOut = () => {
    console.log("Signing out...");
    navigate("/");
  };

  return (
    <>
      <div className="dashboard-container">
        {/* SIDEBAR */}
        <div className={`sidebar ${desktopSidebarOpen ? "" : "collapsed"}`}>
          <div className="sidebar-header">
            <img src="/IconResized.png" alt="Logo" className="gathr-logo" />
            <span>Business Health Check Assessment</span>
          </div>

          {/* Sidebar Links */}
          <a
            href="#"
            className={activeView === "dashboard" ? "bg-[#303030]" : ""}
            onClick={() => setActiveView("dashboard")}
          >
            <FaHome className="icon" />
            <span>Home</span>
          </a>
          <a
            href="#"
            className={activeView === "profile" ? "bg-[#303030]" : ""}
            onClick={() => setActiveView("profile")}
          >
            <FaUser className="icon" />
            <span>Profile</span>
          </a>
          <a
            href="#"
            className={activeView === "about" ? "bg-[#303030]" : ""}
            onClick={() => setActiveView("about")}
          >
            <FaInfoCircle className="icon" />
            <span>About</span>
          </a>

          {/* Feedback & Bug Buttons */}
          <button onClick={() => console.log("Feedback Clicked")} style={{ marginTop: "20px" }}>
            <FaInfoCircle className="icon" />
            <span>Send Feedback</span>
          </button>
          <button onClick={() => console.log("Report Bug Clicked")} style={{ marginTop: "10px" }}>
            <FaInfoCircle className="icon" />
            <span>Report a Bug</span>
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{ marginTop: "20px", backgroundColor: "#dc2626" }}
          >
            Sign Out
          </button>
        </div>
        {/* END SIDEBAR */}

        {/* NAVBAR */}
        <div className={`navbar ${desktopSidebarOpen ? "expanded" : "collapsed"}`}>
          <div className="navbar-collapse-btn">
            <button className="collapse-btn" onClick={toggleSidebar}>
              {desktopSidebarOpen ? <FaAngleLeft /> : <FaBars />}
            </button>
            <h1 style={{ margin: 0 }}>Hive Dashboard</h1>
          </div>
          <div className="user-menu">
            <span>John</span>
          </div>
        </div>
        {/* END NAVBAR */}

        {/* MAIN CONTENT */}
        <div className={`main-content ${desktopSidebarOpen ? "" : "collapsed"}`} style={{ marginTop: "60px" }}>
          <div className="dashboard-card">
            {/* Conditionally render Mode0 when activeView is 'dashboard' */}
            {activeView === "dashboard" && (
              <Mode0 
                username="John"       // Pass any props you want
                points="100"          // if needed for Mode0
                userRole="admin"      // or remove if not needed
              />
            )}

            {activeView === "profile" && (
              <div>
                <h3>Your Profile</h3>
                <p>Profile details go here.</p>
              </div>
            )}

            {activeView === "about" && (
              <div>
                <h3>About This App</h3>
                <p>Some info about your Business Health Check Assessment tool.</p>
              </div>
            )}
          </div>
        </div>
        {/* END MAIN CONTENT */}
      </div>
    </>
  );
}
