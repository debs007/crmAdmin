import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { onSoftRefresh } from "../../utils/socket";

const getStableColor = (text = "DM") => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 40%)`;
};

const normalizeNoteText = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join("\n\n").trim();
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
};

export default function AdminNotes() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const { getAllRecentUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(location.state?.id || "");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [notesError, setNotesError] = useState("");

  useEffect(() => {
    if (location.state?.id) {
      setSelectedUserId(location.state.id);
    }
  }, [location.state?.id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError("");
        const data = await getAllRecentUsers();
        const normalizedUsers = (data || [])
          .filter((user) => (user?.id || user?._id) && user?.name)
          .map((user) => ({
            id: user.id || user._id,
            name: user.name,
            unreadMessages: user.unreadMessages || 0,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setUsers(normalizedUsers);

        if (!normalizedUsers.length) {
          setSelectedUserId("");
          return;
        }

        const hasPreselectedUser = normalizedUsers.some(
          (user) => user.id?.toString() === (location.state?.id || selectedUserId)?.toString()
        );

        if (hasPreselectedUser) {
          setSelectedUserId((location.state?.id || selectedUserId).toString());
          return;
        }

        setSelectedUserId((currentId) => {
          const hasCurrentUser = normalizedUsers.some(
            (user) => user.id?.toString() === currentId?.toString()
          );
          return hasCurrentUser ? currentId : normalizedUsers[0].id.toString();
        });
      } catch (error) {
        setUsersError("Unable to load people for notes.");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [location.state?.id]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!token || !selectedUserId) {
        setNotes("");
        setNotesError("");
        return;
      }

      try {
        setNotesLoading(true);
        setNotesError("");
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/notepad/${selectedUserId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotes(normalizeNoteText(response.data?.data?.notes));
      } catch (error) {
        if (error?.response?.status === 404) {
          setNotes("");
          setNotesError("");
          return;
        }
        setNotes("");
        setNotesError(error?.response?.data?.error || "Unable to load notes.");
      } finally {
        setNotesLoading(false);
      }
    };

    const unsubscribe = onSoftRefresh((data) => {
      if (data.type === "Notes") {
        fetchNotes();
      }
    });

    fetchNotes();
    return () => unsubscribe();
  }, [selectedUserId, token]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [search, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id?.toString() === selectedUserId?.toString()) || null,
    [selectedUserId, users]
  );

  return (
    <div className="min-h-full px-0 py-3 md:h-[calc(100dvh-92px)] md:overflow-hidden md:px-6 md:py-5 bg-[#f7f7f5]">
      <div className="h-full rounded-[24px] md:rounded-[28px] border border-orange-100 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)] overflow-hidden">
        <div className="grid h-full min-h-0 grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b xl:border-b-0 xl:border-r border-slate-200 bg-[#fcfcfb] min-h-0 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-slate-200 px-4 py-4 md:px-5 md:py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">
                  Notes Workspace
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Team Notes</h1>
                    <p className="text-sm text-slate-500">
                      Browse everyone&apos;s notes from one place.
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                    {users.length} people
                  </span>
                </div>
                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <FiSearch className="text-slate-400" size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="max-h-[280px] overflow-y-auto px-3 py-3 hide-scrollbar xl:max-h-none xl:min-h-0 xl:flex-1">
                {usersLoading && (
                  <div className="px-3 py-8 text-sm text-slate-500">Loading people...</div>
                )}
                {!usersLoading && usersError && (
                  <div className="px-3 py-8 text-sm text-red-500">{usersError}</div>
                )}
                {!usersLoading && !usersError && !filteredUsers.length && (
                  <div className="px-3 py-8 text-sm text-slate-500">
                    No matching people found.
                  </div>
                )}

                {!usersLoading &&
                  !usersError &&
                  filteredUsers.map((user) => {
                    const isSelected = user.id?.toString() === selectedUserId?.toString();
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id.toString())}
                        className={`mb-2 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                          isSelected
                            ? "border-orange-200 bg-orange-50 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                          style={{ backgroundColor: getStableColor(user.name) }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {user.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {isSelected ? "Viewing notes" : "Open notes"}
                          </span>
                        </span>
                        {user.unreadMessages > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {user.unreadMessages}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="border-b border-slate-200 px-4 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Selected Person
                  </p>
                  <h2 className="mt-2 truncate text-xl md:text-2xl font-semibold text-slate-900">
                    {selectedUser?.name || "Choose a person"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Notes are read-only here and reflect the latest saved entries.
                  </p>
                </div>
                {selectedUser && (
                  <span className="self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    {notes ? `${notes.split(/\s+/).filter(Boolean).length} words` : "No notes yet"}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden px-4 py-4 md:px-6 md:py-6">
              {!selectedUser && !usersLoading && (
                <div className="flex h-full min-h-0 items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center text-sm text-slate-500">
                  Select a person from the left panel to view their notes.
                </div>
              )}

              {selectedUser && (
                <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col overflow-hidden rounded-[24px] md:rounded-[28px] border border-slate-200 bg-[#fffdf8] shadow-[0_18px_36px_rgba(15,23,42,0.04)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 md:px-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedUser.name}&apos;s Notes
                      </p>
                      <p className="text-xs text-slate-500">
                        Updated live when the user saves new notes.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-orange-600 border border-orange-100">
                      Internal Notes
                    </span>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-6 md:py-6 hide-scrollbar">
                    {notesLoading && (
                      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
                        Loading notes...
                      </div>
                    )}

                    {!notesLoading && notesError && (
                      <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
                        {notesError}
                      </div>
                    )}

                    {!notesLoading && !notesError && notes && (
                      <div className="max-h-full overflow-y-auto rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm hide-scrollbar">
                        <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-7 text-slate-700">
                          {notes}
                        </pre>
                      </div>
                    )}

                    {!notesLoading && !notesError && !notes && (
                      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-sm text-slate-500">
                        No notes have been added for {selectedUser.name} yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
