"use client";

import { Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useMounted } from "@/hooks/use-mounted";
import { isUserOnline } from "@/lib/utils/user-utils";
import Logo from "./logo";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ProfileSettingsDialog from "./user/profile-settings-dialog";

const AsideBar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const isOnline = isUserOnline(user?.id);

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <aside className="top-0 fixed inset-y-0 w-14 md:w-16 left-0 z-40 h-svh bg-primary shadow-sm">
        <div className="w-full h-full px-1.5 md:px-2 pt-3 pb-4 md:pb-6 flex flex-col items-center justify-between">
          <Link href="/chat">
            <Logo showText={false} />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="top-0 fixed inset-y-0 w-16 md:w-20 left-0 z-40 h-svh bg-primary shadow-lg">
      <div className="w-full h-full px-2 md:px-3 pt-5 pb-5 md:pb-7 flex flex-col items-center justify-between">
        <div className="flex flex-col items-center gap-4 md:gap-5">
          <Link href="/chat" className="transition-transform hover:scale-105">
            <Logo showText={false} />
          </Link>

          <Link href="/chat/notice">
            <Button
              variant="outline"
              size="icon"
              className="border-0 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 h-10 w-10 md:h-12 md:w-12 transition-all duration-300 shadow-md"
            >
              <Settings className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 md:gap-5">
          <Button
            variant="outline"
            size="icon"
            className="border-0 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 h-10 w-10 md:h-12 md:w-12 transition-all duration-300 shadow-md"
            onClick={handleThemeToggle}
          >
            <Sun className="h-4 w-4 md:h-5 md:w-5 scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:rotate-180 text-white" />
            <Moon className="absolute h-4 w-4 md:h-5 md:w-5 scale-0 -rotate-180 transition-all duration-500 dark:scale-100 dark:rotate-0 text-white" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="outline-none transition-transform hover:scale-105"
              >
                <AvatarWithBadge
                  name={user?.name || "Unknown"}
                  src={user?.avatar || undefined}
                  isOnline={isOnline}
                  size="w-10 h-10 md:w-12 md:h-12"
                  className="bg-white! ring-2 ring-white/20 hover:ring-white/50 transition-all duration-300 cursor-pointer shadow-md"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-xl shadow-xl"
              align="end"
              side="right"
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.email}
                  </span>
                  {user?.bio && (
                    <span className="text-xs text-muted-foreground font-normal mt-1 line-clamp-2">
                      {user.bio}
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ProfileSettingsDialog
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer rounded-lg"
                  >
                    Edit Profile
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer rounded-lg"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default AsideBar;
