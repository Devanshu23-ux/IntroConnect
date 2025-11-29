import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { useState } from "react";
import ProfileModal from "./ProfileModal";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests, getOutgoingFriendReqs } from "../lib/api";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const [openProfile, setOpenProfile] = useState(false);

  const { logoutMutation } = useLogout();

  // Notifications counts
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: Boolean(authUser),
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
    enabled: Boolean(authUser),
  });

  const incomingUnread = (friendRequests?.incomingReqs || []).filter(
    (r) => !r.recipientSeenPending
  ).length;
  const acceptedUnread = (friendRequests?.acceptedReqs || []).filter(
    (r) => !r.senderSeenAccepted
  ).length;

  // Total notifications aligned with unread state
  const notificationCount = incomingUnread + acceptedUnread;

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end w-full">
          {/* LOGO - ONLY IN THE CHAT PAGE */}
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  IntroConnect
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <Link to={"/notifications"}>
              <div className="indicator">
                {notificationCount > 0 && (
                  <span className="indicator-item badge badge-primary badge-sm">
                    {notificationCount}
                  </span>
                )}
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </div>
            </Link>
          </div>

          {/* TODO */}
          <ThemeSelector />

          <button className="avatar" onClick={() => setOpenProfile(true)} title="Edit profile">
            <div className="w-9 rounded-full ring-1 ring-base-300 hover:ring-primary transition">
              <img
                src={authUser?.profilePic}
                alt="User Avatar"
                rel="noreferrer"
                onError={(e) => {
                  const seed = encodeURIComponent(authUser?.fullName || "user");
                  e.currentTarget.src = `https://api.dicebear.com/7.x/fun-emoji/png?seed=${seed}&size=128`;
                }}
              />
            </div>
          </button>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
      {/* Profile edit modal */}
      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
    </nav>
  );
};
export default Navbar;
