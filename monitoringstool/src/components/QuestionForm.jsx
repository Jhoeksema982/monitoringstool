import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "smiley", label: "Smileys" },
  { value: "number", label: "Cijfers (1-5)" },
  { value: "scale", label: "Schaal (1-10)" },
  { value: "boolean", label: "Ja/Nee" },
  { value: "open", label: "Open vraag" },
  { value: "multiple_choice", label: "Meerkeuze" },
];

const MODE_OPTIONS = [
  { value: "regular", label: "Regulier" },
  { value: "ouder_kind", label: "Ouder-kind" },
  { value: "extra_vader_kind", label: "Extra vader-kind" },
];

export default function QuestionForm({ onAdd }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("smiley");
  const [options, setOptions] = useState("");
  const [ageGroup, setAgeGroup] = useState("all");
  const [mode, setMode] = useState("regular");
  const [gender, setGender] = useState("all");

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("smiley");
    setOptions("");
    setAgeGroup("all");
    setMode("regular");
    setGender("all");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let parsedOptions = null;
    if (type === "multiple_choice") {
      parsedOptions = options.split("\n").map((o) => o.trim()).filter(Boolean);
      if (parsedOptions.length < 2) {
        alert("Voer minimaal 2 opties in (elk op een nieuwe regel)");
        return;
      }
    }

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      category: "General",
      priority: "medium",
      type,
      options: parsedOptions,
      age_group: ageGroup,
      mode,
      gender,
    });

    reset();
    setShow(false);
  };

  if (!show) {
    return (
      <div className="bg-teal-700 p-4 rounded-lg mb-4">
        <button
          onClick={() => setShow(true)}
          className="w-full bg-teal-600 hover:bg-teal-500 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors"
        >
          <span className="text-xl">+</span>
          <span>Nieuwe vraag toevoegen</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-teal-700 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Nieuwe vraag</h3>
        <button
          onClick={() => { reset(); setShow(false); }}
          className="text-gray-300 hover:text-white text-2xl leading-none"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Vraag titel..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded text-gray-800"
          autoFocus
        />

        <input
          type="text"
          placeholder="Beschrijving (optioneel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 rounded text-gray-800"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-gray-300 text-xs mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setOptions(""); }}
              className="w-full p-2 rounded text-gray-800 text-sm"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-300 text-xs mb-1">Modus</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full p-2 rounded text-gray-800 text-sm"
            >
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-300 text-xs mb-1">Leeftijd</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full p-2 rounded text-gray-800 text-sm"
            >
              <option value="all">Alle leeftijden</option>
              <option value="under_12">Onder 12</option>
              <option value="12_plus">12+</option>
            </select>
          </div>
        </div>

        {type === "multiple_choice" && (
          <div>
            <label className="block text-gray-300 text-sm mb-2">
              Opties (een per regel)*
            </label>
            <textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Optie 1&#10;Optie 2&#10;Optie 3"
              className="w-full p-3 rounded text-gray-800 h-24"
            />
          </div>
        )}

        <div className="text-xs text-gray-300">
          Gebruik <code className="bg-teal-600 px-1 rounded">{`{parent}`}</code> in de titel of beschrijving voor &quot;papa&quot; of &quot;mama&quot; (afhankelijk van PI).
        </div>

        <button
          type="submit"
          className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded hover:bg-yellow-300 w-full"
        >
          Toevoegen
        </button>
      </form>
    </div>
  );
}
