import { useState } from "react";
import QuestionTypeModal from "./QuestionTypeModal";

export default function QuestionForm({ onAdd }) {
  const [text, setText] = useState("");
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [questionType, setQuestionType] = useState("smiley");
  const [options, setOptions] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("all");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    let parsedOptions = null;
    if (questionType === "multiple_choice") {
      parsedOptions = options
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);
      if (parsedOptions.length < 2) {
        alert("Voer minimaal 2 opties in (elk op een nieuwe regel)");
        return;
      }
    }

    onAdd({
      title: text,
      description,
      category: "General",
      priority: "medium",
      type: questionType,
      options: parsedOptions,
      age_group: ageGroup,
    });

    setText("");
    setDescription("");
    setOptions("");
    setQuestionType("smiley");
    setAgeGroup("all");
  };

  const typeLabel = {
    smiley: "Smileys",
    number: "Cijfers (1-5)",
    scale: "Schaal (1-10)",
    boolean: "Ja/Nee",
    open: "Open vraag",
    multiple_choice: "Meerkeuze",
  }[questionType];

  const ageGroupLabel = {
    all: "Alle leeftijden",
    under_12: "Onder 12 jaar",
    "12_plus": "12 jaar en ouder",
  }[ageGroup];

  return (
    <>
      <div className="bg-teal-700 p-4 rounded-lg mb-4">
        <button
          type="button"
          onClick={() => setShowTypeModal(true)}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <span className="text-xl">+</span>
          <span>Nieuwe vraag toevoegen</span>
        </button>
      </div>

      <QuestionTypeModal
        isOpen={showTypeModal}
        onSelect={(type) => {
          setQuestionType(type);
          setShowTypeModal(false);
        }}
        onClose={() => setShowTypeModal(false)}
      />

      {questionType && (
        <form onSubmit={handleSubmit} className="bg-teal-700 p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Type: </span>
            <span className="bg-yellow-400 text-teal-900 px-3 py-1 rounded-full font-semibold text-sm">
              {typeLabel}
            </span>
          </div>

          <input
            type="text"
            placeholder="Vraag titel..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-3 rounded text-gray-800"
          />

          <input
            type="text"
            placeholder="Beschrijving (optioneel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded text-gray-800"
          />

          {questionType === "multiple_choice" && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Opties (één per regel)*
              </label>
              <textarea
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Optie 1&#10;Optie 2&#10;Optie 3"
                className="w-full p-3 rounded text-gray-800 h-24"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 text-sm mb-2">Leeftijdsgroep</label>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Alle" },
                { value: "under_12", label: "Onder 12" },
                { value: "12_plus", label: "12+" },
              ].map((ag) => (
                <button
                  key={ag.value}
                  type="button"
                  onClick={() => setAgeGroup(ag.value)}
                  className={`flex-1 py-2 rounded font-semibold text-sm transition ${
                    ageGroup === ag.value
                      ? "bg-yellow-400 text-teal-900"
                      : "bg-teal-600 text-white"
                  }`}
                >
                  {ag.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded hover:bg-yellow-300 w-full"
          >
            Toevoegen
          </button>
        </form>
      )}
    </>
  );
}
