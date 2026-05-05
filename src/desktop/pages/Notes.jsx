import { useState, useEffect } from "react";
import axios from "axios";

export default function NotesPage() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);



  // Get token from localStorage
  const token = localStorage.getItem("token");

  // Fetch existing notes
  const fetchNotes = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/notepad/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes(response.data?.notes|| "");
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save notes
  const handleSave = async () => {
    if (!token) {
      alert("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/notepad/`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className="w-full mt-10 p-4">
      <div className="p-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-gray-600">Notes</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded-lg outline-none border-gray-500"
          placeholder="Write your notes here..."
          rows={12}
        />
        <div className="flex justify-end items-end mt-4">
          <button
            onClick={handleSave}
            className="border border-orange-500 font-medium text-[12px] py-0.5 text-orange-500 px-2 rounded cursor-pointer"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
