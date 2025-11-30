"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-clerk-auth";
import { isUserOnline } from "@/lib/helper";
import AvatarWithBadge from "./avatar-with-badge";
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
  const [mounted, setMounted] = useState(false);

  const isOnline = isUserOnline(user?._id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!mounted) {
    return (
      <aside className="top-0 fixed inset-y-0 w-14 md:w-16 left-0 z-[9999] h-svh bg-primary shadow-sm">
        <div className="w-full h-full px-1.5 md:px-2 pt-3 pb-4 md:pb-6 flex flex-col items-center justify-between">
          <Link href="/chat">
            <Logo showText={false} />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="top-0 fixed inset-y-0 w-14 md:w-16 left-0 z-[9999] h-svh bg-primary shadow-sm">
      <div className="w-full h-full px-1.5 md:px-2 pt-3 pb-4 md:pb-6 flex flex-col items-center justify-between">
        <Link href="/chat">
          <Logo showText={false} />
        </Link>

        <div className="flex flex-col items-center gap-3 md:gap-4">
          <Button
            variant="outline"
            size="icon"
            className="border-0 rounded-full bg-white/10 hover:bg-white/20 h-9 w-9 md:h-10 md:w-10"
            onClick={handleThemeToggle}
          >
            <Sun className="h-[1rem] w-[1rem] md:h-[1.2rem] md:w-[1.2rem] scale-100 rotate-0 transition-all duration-500 dark:scale-0 dark:rotate-180 text-white" />
            <Moon className="absolute h-[1rem] w-[1rem] md:h-[1.2rem] md:w-[1.2rem] scale-0 -rotate-180 transition-all duration-500 dark:scale-100 dark:rotate-0 text-white" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="outline-none">
                <AvatarWithBadge
                  name={user?.name || "Unknown"}
                  src={user?.avatar || undefined}
                  isOnline={isOnline}
                  size="w-9 h-9 md:w-10 md:h-10"
                  className="!bg-white ring-2 ring-white/20 hover:ring-white/40 transition-all cursor-pointer"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 rounded-lg z-[99999]"
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
                    className="cursor-pointer"
                  >
                    Edit Profile
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
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
