export default function ConsentQuestion({ value, onChange }) {
  return (
    <div className="w-full max-w-4xl text-center px-5 sm:px-10 py-5 bg-transparent rounded-[32px]">
      <p className="text-3xl font-semibold text-white mb-5">Vraag 1</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
        Geven de ouders/verzorgers toestemming voor het invullen van deze vragenlijst?
      </h2>
      <p className="text-lg sm:text-xl text-white/90 mb-10">
        Selecteer hieronder uw antwoord
      </p>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
        <label className="flex flex-col items-center cursor-pointer">
          <div
            className={`w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] rounded-full flex items-center justify-center text-4xl font-bold transition ${
              value === "ja"
                ? "bg-green-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            onClick={() => onChange?.("ja")}
          >
            ✓
          </div>
          <input
            type="radio"
            name="consent"
            value="ja"
            checked={value === "ja"}
            onChange={() => onChange?.("ja")}
            className="mt-3 scale-110 accent-teal-500"
          />
          <span className="font-semibold mt-2 text-white text-sm sm:text-base">
            Ja
          </span>
        </label>
        <label className="flex flex-col items-center cursor-pointer">
          <div
            className={`w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] rounded-full flex items-center justify-center text-4xl font-bold transition ${
              value === "nee"
                ? "bg-red-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            onClick={() => onChange?.("nee")}
          >
            ✗
          </div>
          <input
            type="radio"
            name="consent"
            value="nee"
            checked={value === "nee"}
            onChange={() => onChange?.("nee")}
            className="mt-3 scale-110 accent-teal-500"
          />
          <span className="font-semibold mt-2 text-white text-sm sm:text-base">
            Nee
          </span>
        </label>
      </div>
    </div>
  );
}

