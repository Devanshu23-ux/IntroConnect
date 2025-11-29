import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import { LANGUAGES, PRESET_AVATARS } from "../constants";
import { CameraIcon, LoaderIcon, MapPinIcon, ShuffleIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const ProfileModal = ({ open, onClose }) => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: "",
    bio: "",
    nativeLanguage: "",
    location: "",
    profilePic: "",
  });

  // Prepare a shuffled avatar pool so users see each preset before repeats
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const [avatarPool, setAvatarPool] = useState(() => shuffle(PRESET_AVATARS));

  useEffect(() => {
    if (authUser) {
      setFormState({
        fullName: authUser.fullName || "",
        bio: authUser.bio || "",
        nativeLanguage: authUser.nativeLanguage || "",
        location: authUser.location || "",
        profilePic: authUser.profilePic || "",
      });
    }
  }, [authUser, open]);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      onClose?.();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfile(formState);
  };

  const handleRandomAvatar = () => {
    let pool = avatarPool;
    if (pool.length === 0) {
      pool = shuffle(PRESET_AVATARS);
    }

    // Pick next avatar different from current preview if possible
    let next = pool[0];
    if (pool.length > 1 && next === formState.profilePic) {
      next = pool[1];
      pool = [pool[0], ...pool.slice(2)];
    } else {
      pool = pool.slice(1);
    }

    setAvatarPool(pool);
    setFormState({ ...formState, profilePic: next });
    toast.success("Random profile picture selected!");
  };

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Edit Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PROFILE PIC */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="size-28 rounded-full bg-base-300 overflow-hidden">
              {formState.profilePic ? (
                <img
                  src={formState.profilePic}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CameraIcon className="size-10 text-base-content opacity-40" />
                </div>
              )}
            </div>
            <button type="button" onClick={handleRandomAvatar} className="btn btn-accent btn-sm">
              <ShuffleIcon className="size-4 mr-2" />
              Generate Random Avatar
            </button>
          </div>

          {/* FULL NAME */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formState.fullName}
              onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
              className="input input-bordered w-full"
              placeholder="Your full name"
            />
          </div>

          {/* BIO */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Bio</span>
            </label>
            <textarea
              name="bio"
              value={formState.bio}
              onChange={(e) => setFormState({ ...formState, bio: e.target.value })}
              className="textarea textarea-bordered h-24"
              placeholder="Tell others about yourself"
            />
          </div>

          {/* NATIVE LANGUAGE & LOCATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Native Language</span>
              </label>
              <select
                name="nativeLanguage"
                value={formState.nativeLanguage}
                onChange={(e) => setFormState({ ...formState, nativeLanguage: e.target.value })}
                className="select select-bordered w-full"
              >
                <option value="">Select your native language</option>
                {LANGUAGES.map((lang) => (
                  <option key={`native-${lang}`} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <div className="relative">
                <MapPinIcon className="absolute top-1/2 transform -translate-y-1/2 left-3 size-5 text-base-content opacity-70" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="input input-bordered w-full pl-10"
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="animate-spin size-4 mr-2" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
      <button className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default ProfileModal;
