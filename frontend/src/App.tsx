import { useState, useEffect } from "react";
import { GetAllTasks, GetStats } from "../wailsjs/go/main/App";
import { Task, Stats } from "./types";
import TasksPage from "./pages/TasksPage";
import LogsPage from "./pages/LogsPage";
import NotifiersPage from "./pages/NotifiersPage";
import DashboardPage from "./pages/DashboardPage";
import ScriptsPage from "./pages/ScriptsPage";
import DependenciesPage from "./pages/DependenciesPage";
import SettingsPage from "./pages/SettingsPage";
import EnvironmentPage from "./pages/EnvironmentPage";

type Page =
  | "dashboard"
  | "scripts"
  | "tasks"
  | "logs"
  | "notifiers"
  | "dependencies"
  | "environment"
  | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(224); // 默认 224px (w-56)
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await GetStats();
      setStats(data as Stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= 180 && newWidth <= 320) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage stats={stats} onNavigate={setCurrentPage} />;
      case "scripts":
        return <ScriptsPage onNavigate={setCurrentPage} />;
      case "tasks":
        return <TasksPage onStatsUpdate={loadStats} />;
      case "logs":
        return <LogsPage />;
      case "notifiers":
        return <NotifiersPage />;
      case "dependencies":
        return <DependenciesPage />;
      case "environment":
        return <EnvironmentPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage stats={stats} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50/30 select-none overflow-hidden">
      {/* Left Sidebar - 整体可拖拽，固定不滚动 */}
      <aside
        className="bg-white/95 backdrop-blur-xl border-r border-gray-200/60 flex flex-col relative h-full flex-shrink-0 shadow-sm"
        style={
          { width: `${sidebarWidth}px`, "--wails-draggable": "drag" } as any
        }
      >
        {/* App Header */}
        <div className="h-16 flex items-end mt-6 pb-5 px-5 border-b border-gray-200/60 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-900 to-gray-700 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <h1 className="text-base font-semibold text-gray-900 tracking-tight">
              Tempo
            </h1>
          </div>
        </div>

        {/* Navigation - 按钮不可拖拽 */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavItem
            active={currentPage === "dashboard"}
            onClick={() => setCurrentPage("dashboard")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            }
          >
            仪表盘
          </NavItem>

          <NavItem
            active={currentPage === "scripts"}
            onClick={() => setCurrentPage("scripts")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            }
          >
            脚本管理
          </NavItem>

          <NavItem
            active={currentPage === "tasks"}
            onClick={() => setCurrentPage("tasks")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            }
          >
            定时任务
          </NavItem>

          <NavItem
            active={currentPage === "logs"}
            onClick={() => setCurrentPage("logs")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            }
          >
            执行日志
          </NavItem>

          <NavItem
            active={currentPage === "notifiers"}
            onClick={() => setCurrentPage("notifiers")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            }
          >
            通知配置
          </NavItem>

          <NavItem
            active={currentPage === "dependencies"}
            onClick={() => setCurrentPage("dependencies")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            }
          >
            依赖管理
          </NavItem>

          <NavItem
            active={currentPage === "environment"}
            onClick={() => setCurrentPage("environment")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            }
          >
            环境变量
          </NavItem>

          <NavItem
            active={currentPage === "settings"}
            onClick={() => setCurrentPage("settings")}
            icon={
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            }
          >
            设置
          </NavItem>
        </nav>

        {/* Status Footer */}
        {stats && (
          <div className="px-4 py-3 border-t border-gray-200/60 bg-gray-50/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    stats.schedulerRunning
                      ? "bg-emerald-500 ring-2 ring-emerald-500/20 shadow-sm shadow-emerald-500/50"
                      : "bg-gray-400 ring-2 ring-gray-400/20"
                  }`}
                />
                <span
                  className={
                    stats.schedulerRunning
                      ? "text-emerald-700 font-medium"
                      : "text-gray-500"
                  }
                >
                  {stats.schedulerRunning ? "运行中" : "已停止"}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <span className="font-semibold text-gray-900">
                  {stats.activeTasks}
                </span>
                <span className="text-gray-400">/</span>
                <span>{stats.totalTasks}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400 transition-all duration-200 group"
          style={{ "--wails-draggable": "no-drag" } as any}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -right-0.5 w-2 opacity-0 group-hover:opacity-100 bg-blue-400/20 transition-opacity" />
        </div>
      </aside>

      {/* Main Content - 可滚动 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-50/50 to-gray-100/30">
        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {/* 顶部拖拽区域 */}
          <div
            className="h-10 w-full flex-shrink-0"
            style={{ "--wails-draggable": "drag" } as any}
          />
          <div
            className="max-w-7xl mx-auto px-8 pb-8"
            style={{ "--wails-draggable": "no-drag" } as any}
          >
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  );
}

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavItem({ active, onClick, icon, children }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{ "--wails-draggable": "no-drag" } as any}
      className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group ${
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 active:scale-[0.98]"
      }`}
    >
      <svg
        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
          active ? "" : "group-hover:scale-110"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={active ? 2.5 : 2}
      >
        {icon}
      </svg>
      <span className="truncate">{children}</span>
    </button>
  );
}

export default App;
