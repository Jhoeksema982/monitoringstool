import { useState } from "react";

export default function QuestionForm({ onAdd }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ title: text, category: "General", priority: "medium" });
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="Nieuwe vraag..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-grow p-2 rounded text-gray-800"
      />
      <button
        type="submit"
        className="bg-yellow-400 text-teal-900 font-semibold px-4 py-2 rounded hover:bg-yellow-300"
      >
        Toevoegen
      </button>
    </form>
  );
}
