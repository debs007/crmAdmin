import { useEffect, useMemo, useState } from "react";
import search from "../../assets/desktop/search.svg";
import { IoIosClose } from "react-icons/io";
import { useAuth } from "../../context/authContext";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Two modes:
 *  - default: pick existing people then create a new channel (legacy flow)
 *  - mode === "invite" (passed from ChannelChat header): paste a list of
 *    emails to invite to an existing channel via /api/invite-multiple
 *    (feature #10).
 */
function AddChannelPeople() {
  const { getAllRecentUsers } = useAuth();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [allPeople, setAllPeople] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Multi-invite state
  const [emailsRaw, setEmailsRaw] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const location = useLocation();
  const channelName = location?.state?.channelName?.channel;
  const inviteChannelId = location?.state?.channelId || location?.state?.id;
  const inviteMode = location?.state?.mode === "invite" && inviteChannelId;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const getPersonId = (person) => person?._id || person?.id || "";

  const handleButton = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/api/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: channelName,
            members: members.filter(Boolean),
          }),
        }
      );
      if (response.ok) {
        // ok
      }
    } catch (error) {
      // ignore
    }
    navigate("/", { replace: true });
    window.location.reload();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllRecentUsers();
        if (response && Array.isArray(response)) setAllPeople(response);
      } catch (e) {
        // ignore
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length === 0) {
      setFilteredPeople(allPeople);
    } else {
      setFilteredPeople(
        allPeople.filter((person) =>
          person.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setFilteredPeople(allPeople);
    setShowDropdown(true);
  };

  const handleSelectPerson = (id, name) => {
    if (!id) return;
    if (!selectedPeople.some((p) => p.id === id)) {
      setSelectedPeople([...selectedPeople, { id, name }]);
      setMembers((prev) => [...prev, id]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removePerson = (person) => {
    setSelectedPeople(selectedPeople.filter((p) => p.id !== person.id));
    setMembers((prev) => prev.filter((memberId) => memberId !== person.id));
  };

  // ---- Multi-email invite (feature #10) ----
  const parsedEmails = useMemo(() => {
    return emailsRaw
      .split(/[,\n;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
  }, [emailsRaw]);

  const handleSendInvites = async () => {
    if (!inviteChannelId || parsedEmails.length === 0) {
      alert("Please add at least one email address.");
      return;
    }
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API}/api/invite-multiple`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channelId: inviteChannelId,
            emails: parsedEmails,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Could not send invites");
      }
      setInviteResult(data);
      if ((data.summary?.sent ?? 0) > 0) setEmailsRaw("");
    } catch (err) {
      alert(err.message || "Could not send invites");
    } finally {
      setInviting(false);
    }
  };

  if (inviteMode) {
    return (
      <div className="relative w-full p-4 space-y-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Invite people</h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs text-gray-500"
          >
            ← Back
          </button>
        </div>

        <p className="text-[11px] text-gray-500">
          Paste one or more email addresses. Separate them with commas, spaces,
          semicolons, or new lines.
        </p>

        <textarea
          value={emailsRaw}
          onChange={(e) => setEmailsRaw(e.target.value)}
          rows={6}
          placeholder="alice@example.com, bob@example.com&#10;carol@example.com"
          className="w-full p-2 border border-gray-300 rounded text-xs"
        />

        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <span>{parsedEmails.length} email(s) detected</span>
          <button
            type="button"
            onClick={handleSendInvites}
            disabled={inviting || parsedEmails.length === 0}
            className="px-3 py-1.5 bg-orange-500 text-white rounded text-xs disabled:opacity-60"
          >
            {inviting ? "Sending…" : `Send ${parsedEmails.length} invite(s)`}
          </button>
        </div>

        {inviteResult && (
          <div className="border rounded p-3 bg-gray-50 text-xs space-y-2">
            <p className="font-semibold">
              Sent: {inviteResult.summary?.sent ?? 0} • Invalid:{" "}
              {inviteResult.summary?.invalid ?? 0} • Failed:{" "}
              {inviteResult.summary?.failed ?? 0}
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {(inviteResult.results || []).map((r) => (
                <li
                  key={r.email}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{r.email}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      r.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : r.status === "invalid"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full border-b-2 border-orange-400 p-4 space-y-2">
      <h2 className="text-[14px] font-medium">Add People</h2>

      <div className="relative bg-gray-200 rounded flex gap-2 px-4 py-2">
        <img src={search} alt="Search" className="w-5 h-5" />
        <input
          type="text"
          placeholder="Search for people"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="outline-none w-full text-[12px] p-1"
        />
      </div>

      {showDropdown && filteredPeople.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-md mt-1 z-10">
          {filteredPeople.map((person) => (
            <div
              key={getPersonId(person)}
              className="p-2 cursor-pointer hover:bg-gray-100"
              onClick={() =>
                handleSelectPerson(getPersonId(person), person.name)
              }
            >
              {person.name}
            </div>
          ))}
        </div>
      )}

      {selectedPeople.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPeople.map((person, i) => (
            <div
              key={i}
              className="bg-orange-200 text-orange-800 px-2 py-1 rounded flex items-center"
            >
              {person.name}
              <button
                onClick={() => removePerson(person)}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <IoIosClose size={25} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          className="text-[12px] text-orange-400 border border-orange-400 rounded px-3 cursor-pointer"
          onClick={handleButton}
        >
          Create
        </button>
      </div>
    </div>
  );
}

export default AddChannelPeople;
