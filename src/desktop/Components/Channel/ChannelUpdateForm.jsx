import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import Select from "react-select";
import Avatar from "../Common/Avatar";

const initialDetails = {
  purpose: "",
  industry: "",
  website: "",
  location: "",
};

/**
 * Channel "settings" modal — covers features #7, #8 and #13.
 *
 *  - Image upload (Cloudinary via /api/:id/image), with letter-avatar fallback
 *  - Status tag (Active / Archived / Paused / Closed) — single-select
 *  - Up to 2 free tags (predefined options + custom) via react-select Creatable
 *  - Description + extra "Channel Details" fields (purpose / industry / website / location)
 *  - Member management (preserved from previous build)
 */
export default function ChannelUpdateForm({
  groupUsers,
  members,
  channelInfo,
  onUpdated,
}) {
  const location = useLocation();
  const { getAllRecentUsers } = useAuth();
  const [allPeople, setAllPeople] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [statusOptions, setStatusOptions] = useState([
    "Active",
    "Archived",
    "Paused",
    "Closed",
  ]);
  const [predefinedTagOptions, setPredefinedTagOptions] = useState([]);
  const [statusTag, setStatusTag] = useState(channelInfo?.statusTag || "Active");
  const [name, setName] = useState(
    groupUsers?.name?.charAt(0).toUpperCase() + groupUsers?.name?.slice(1) || ""
  );
  const [description, setDescription] = useState(
    groupUsers?.description || channelInfo?.description || ""
  );
  const [tags, setTags] = useState(
    (channelInfo?.tags || []).map((t) => ({ value: t, label: t }))
  );
  const [details, setDetails] = useState({
    ...initialDetails,
    ...(channelInfo?.channelDetails || {}),
  });
  const [imagePreview, setImagePreview] = useState(channelInfo?.image || "");
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const channelId = location.pathname.split("/").at(2) || channelInfo?._id;
  const token = localStorage.getItem("token");
  const getUserId = (user) => user?._id || user?.id || "";
  const apiBase = import.meta.env.VITE_BACKEND_API;

  // Sync local state when channelInfo changes (e.g. after a save reload).
  useEffect(() => {
    if (!channelInfo) return;
    setStatusTag(channelInfo.statusTag || "Active");
    setDescription(channelInfo.description || description);
    setTags((channelInfo.tags || []).map((t) => ({ value: t, label: t })));
    setDetails({ ...initialDetails, ...(channelInfo.channelDetails || {}) });
    setImagePreview(channelInfo.image || "");
  }, [channelInfo]);

  // Load the centralized tag option list.
  useEffect(() => {
    fetch(`${apiBase}/api/tags/options`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          if (Array.isArray(data.statusTagOptions))
            setStatusOptions(data.statusTagOptions);
          if (Array.isArray(data.predefinedTagOptions))
            setPredefinedTagOptions(data.predefinedTagOptions);
        }
      })
      .catch(() => {});
  }, [apiBase]);

  // Member loader (preserved).
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllRecentUsers();
        if (response && Array.isArray(response)) {
          setAllPeople(response);
          const selected = response
            .filter((user) =>
              members?.some((member) => member?._id === getUserId(user))
            )
            .map((user) => ({
              value: getUserId(user),
              label: user?.name,
            }));
          setSelectedMembers(selected);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUsers();
  }, [members]);

  const removeMember = async (memberId) => {
    if (!memberId) return;
    if (!window.confirm("Remove this member from the channel?")) return;
    try {
      const response = await fetch(
        `${apiBase}/api/${channelId}/remove-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memberId }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to remove member");
      }
      setSelectedMembers((prev) => prev.filter((m) => m.value !== memberId));
    } catch (err) {
      alert(err.message || "Unable to remove member");
    }
  };

  const handleImagePick = () => fileRef.current?.click();
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setError("");
    setImageUploading(true);
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${apiBase}/api/${channelId}/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Upload failed");
      }
      setImagePreview(data.image || "");
    } catch (err) {
      setError(err.message || "Upload failed");
      setImagePreview(channelInfo?.image || "");
    } finally {
      setImageUploading(false);
      URL.revokeObjectURL(localUrl);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const tagSelectOptions = [
    ...predefinedTagOptions.map((t) => ({ value: t, label: t })),
    ...tags.filter((t) => !predefinedTagOptions.includes(t.value)),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        description,
        members: selectedMembers.map((m) => m.value),
        statusTag,
        tags: tags.map((t) => t.value).slice(0, 2),
        channelDetails: details,
      };
      const response = await fetch(`${apiBase}/api/${channelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || "Update failed");
      }
      if (typeof onUpdated === "function") {
        onUpdated();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const memberOptions = allPeople
    .map((user) => ({ value: getUserId(user), label: user.name }))
    .filter((option) => option.value);

  return (
    <form
      className="p-4 pt-8 space-y-3 max-h-[80vh] overflow-y-auto"
      onSubmit={handleSubmit}
    >
      <div>
        <h3 className="text-[15px] font-bold text-gray-600 flex gap-2 pb-3">
          Channel Settings
        </h3>
      </div>

      {/* Channel image (feature #13) */}
      <div className="flex items-center gap-3">
        <Avatar
          name={name || "Channel"}
          src={imagePreview}
          size={56}
          rounded="rounded-lg"
        />
        <div className="flex flex-col gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={handleImagePick}
            disabled={imageUploading || !channelId}
            className="px-3 py-1 text-xs rounded bg-orange-500 text-white disabled:opacity-60"
          >
            {imageUploading
              ? "Uploading…"
              : imagePreview
              ? "Change image"
              : "Upload image"}
          </button>
          <p className="text-[10px] text-gray-500">
            {imagePreview
              ? "Image set. Falls back to first letter when removed."
              : "Optional. Falls back to first-letter avatar."}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter channel name"
          className="w-full px-2 py-1 border border-gray-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this channel about?"
          rows={2}
          className="w-full px-2 py-1 border border-gray-300 text-sm rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status tag (Tag 1) — feature #8 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={statusTag}
          onChange={(e) => setStatusTag(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 text-sm rounded-md"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Tags 2 + 3 (predefined + custom) — feature #8 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags (up to 2)
        </label>
        <Select
          isMulti
          isClearable
          options={tagSelectOptions}
          value={tags}
          onChange={(value) => setTags((value || []).slice(0, 2))}
          onCreateOption={undefined}
          placeholder="Pick or type custom tags"
          className="text-sm"
          // The vanilla react-select doesn't allow creation. Provide a small
          // "add custom" input alongside.
        />
        <CustomTagInput
          onAdd={(label) => {
            const trimmed = (label || "").trim();
            if (!trimmed) return;
            setTags((prev) => {
              if (prev.length >= 2) return prev;
              if (prev.some((t) => t.value === trimmed)) return prev;
              return [...prev, { value: trimmed, label: trimmed }];
            });
          }}
          disabled={tags.length >= 2}
        />
      </div>

      {/* Channel details (feature #7) */}
      <div className="border rounded p-2 space-y-2 bg-gray-50">
        <p className="text-[11px] font-semibold text-gray-600">
          Channel Details
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">
              Purpose
            </label>
            <input
              type="text"
              value={details.purpose}
              onChange={(e) =>
                setDetails({ ...details, purpose: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 text-xs rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">
              Industry
            </label>
            <input
              type="text"
              value={details.industry}
              onChange={(e) =>
                setDetails({ ...details, industry: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 text-xs rounded"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">
              Website
            </label>
            <input
              type="url"
              value={details.website}
              onChange={(e) =>
                setDetails({ ...details, website: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 text-xs rounded"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-0.5">
              Location
            </label>
            <input
              type="text"
              value={details.location}
              onChange={(e) =>
                setDetails({ ...details, location: e.target.value })
              }
              className="w-full px-2 py-1 border border-gray-300 text-xs rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Members
        </label>
        <Select
          isMulti
          name="members"
          options={memberOptions}
          value={selectedMembers}
          onChange={setSelectedMembers}
          placeholder="Select or search users..."
          className="text-sm"
        />
      </div>

      {members?.length ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Current Members</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {members.map((member) => (
              <li
                key={member?._id}
                className="flex items-center justify-between text-sm border p-1 rounded"
              >
                <span className="flex items-center gap-2">
                  <Avatar name={member?.name} src={member?.avatar} size={20} />
                  {member?.name}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-300 rounded"
                  onClick={() => removeMember(member?._id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-md font-semibold text-sm transition duration-200 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Channel"}
      </button>
    </form>
  );
}

// Tiny inline "add custom tag" helper. Kept colocated so the CustomTag UX
// doesn't require us to swap react-select for Creatable.
function CustomTagInput({ onAdd, disabled }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-1 mt-1">
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(value);
            setValue("");
          }
        }}
        placeholder={
          disabled ? "Tag limit reached (max 2)" : "Add custom tag and press Enter"
        }
        className="flex-1 px-2 py-1 border border-gray-300 text-xs rounded"
      />
      <button
        type="button"
        disabled={disabled || !value.trim()}
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
        className="px-2 py-1 text-xs border border-gray-400 rounded disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}
