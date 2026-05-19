import { Check, X } from "lucide-react";
import beigeFace from "../assets/images/blank.avif";
import geel from "../assets/images/geel.avif";
import groen from "../assets/images/groen.avif";
import lichtgroen from "../assets/images/lichtgroen.avif";
import rood from "../assets/images/rood.avif";
import { smileys, numbers, scale, booleanOptions } from "../constants/ratings";

const imageByKey = { rood, beige: beigeFace, geel, lichtgroen, groen };

function SmileyDisplay({ question, value, onChange, index }) {
    return (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {smileys.map((s) => (
                <label key={s.key} className="flex flex-col items-center cursor-pointer">
                    <img
                        src={imageByKey[s.key]}
                        alt={s.label}
                        className="w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] object-contain transition-transform hover:scale-110 active:scale-95"
                        onClick={() => onChange?.(s.key)}
                    />
                    <input
                        type="radio"
                        name={`smiley-${question?.uuid || index}`}
                        value={s.key}
                        checked={value === s.key}
                        onChange={() => onChange?.(s.key)}
                        className="mt-3 scale-110 accent-teal-500"
                    />
                    <span className="font-semibold mt-2 text-white text-sm sm:text-base">{s.label}</span>
                </label>
            ))}
        </div>
    );
}

const CIRCLE_COLORS = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-600"];

function NumberDisplay({ question, value, onChange, index }) {
    return (
        <div className="flex justify-center gap-4 sm:gap-8">
            {numbers.map((item) => (
                <label key={item.key} className="flex flex-col items-center cursor-pointer">
                    <button
                        type="button"
                        onClick={() => onChange?.(item.key)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full font-bold text-2xl sm:text-3xl transition-all shadow-lg hover:scale-110 active:scale-95 border-2 border-black ${
                            value === item.key
                                ? `${CIRCLE_COLORS[item.key - 1]} text-white scale-110 ring-4 ring-white`
                                : `${CIRCLE_COLORS[item.key - 1]} text-white`
                        }`}
                    >
                        {item.key}
                    </button>
                    <span className="font-semibold mt-3 text-white text-base sm:text-lg">{item.label}</span>
                </label>
            ))}
        </div>
    );
}

function ScaleDisplay({ question, value, onChange, index }) {
    return (
        <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
            {scale.map((item) => (
                <label key={item.key} className="flex flex-col items-center cursor-pointer">
                    <button
                        type="button"
                        onClick={() => onChange?.(item.key)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold text-base sm:text-lg transition-all shadow-lg hover:scale-110 active:scale-95 ${
                            value === item.key
                                ? "bg-yellow-400 text-teal-900 scale-110"
                                : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                    >
                        {item.key}
                    </button>
                </label>
            ))}
            <div className="w-full flex justify-between text-xs sm:text-sm text-gray-300 mt-2 px-2">
                <span>Slecht</span>
                <span>Goed</span>
            </div>
        </div>
    );
}

function BooleanDisplay({ question, value, onChange, index }) {
    return (
        <div className="flex justify-center gap-6 sm:gap-10">
            {booleanOptions.map((opt) => (
                <label key={opt.key} className="flex flex-col items-center cursor-pointer">
                    <button
                        type="button"
                        onClick={() => onChange?.(opt.key)}
                        className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full font-bold text-xl sm:text-2xl transition-all shadow-lg hover:scale-110 active:scale-95 ${
                            value === opt.key
                                ? opt.key === "yes"
                                    ? "bg-green-500 text-white scale-110 ring-4 ring-white"
                                    : "bg-red-500 text-white scale-110 ring-4 ring-white"
                                : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                    >
                        {opt.key === "yes" ? (
                            <Check className="w-12 h-12 mx-auto" />
                        ) : (
                            <X className="w-12 h-12 mx-auto" />
                        )}
                    </button>
                    <span className="font-semibold mt-2 text-white text-sm sm:text-base">{opt.label}</span>
                </label>
            ))}
        </div>
    );
}

function OpenDisplay({ question, value, onChange, index }) {
    return (
        <div className="w-full max-w-2xl">
            <textarea
                value={value || ""}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="Type hier je antwoord..."
                className="w-full h-32 p-4 rounded-lg text-gray-800 text-lg resize-none"
            />
        </div>
    );
}

function MultipleChoiceDisplay({ question, value, onChange, index }) {
    const options = question?.options || [];
    return (
        <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
            {options.map((opt, i) => (
                <label
                    key={i}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                        value === opt ? "bg-yellow-400 text-teal-900" : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                    <input
                        type="radio"
                        name={`mc-${question?.uuid || index}`}
                        value={opt}
                        checked={value === opt}
                        onChange={() => onChange?.(opt)}
                        className="w-5 h-5 accent-teal-500"
                    />
                    <span className="font-semibold text-lg">{opt}</span>
                </label>
            ))}
        </div>
    );
}

function MultipleSelectDisplay({ question, value, onChange, index }) {
    const options = question?.options || [];
    const selected = Array.isArray(value) ? value : [];
    return (
        <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto">
            {options.map((opt, i) => {
                const isSelected = selected.includes(opt);
                return (
                    <label
                        key={i}
                        className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-yellow-400 text-teal-900" : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                    >
                        <input
                            type="checkbox"
                            name={`ms-${question?.uuid || index}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => {
                                if (isSelected) {
                                    onChange?.(selected.filter((v) => v !== opt));
                                } else {
                                    onChange?.([...selected, opt]);
                                }
                            }}
                            className="w-5 h-5 accent-teal-500"
                        />
                        <span className="font-semibold text-lg">{opt}</span>
                    </label>
                );
            })}
        </div>
    );
}

function replaceParent(text, gender, ageGroup) {
    if (!text) return text;
    if (ageGroup === "under_12") {
        const parent = gender === "female" ? "mama" : "papa";
        return text.replace(/\{parent\}/g, parent);
    }
    const parent = gender === "female" ? "moeder" : "vader";
    return text.replace(/\{parent\}/g, parent);
}

export default function QuestionDisplay({
    question,
    index,
    name,
    value,
    onChange,
    displayMode,
    parentGender,
    ageGroup,
}) {
    const type = question?.type || displayMode || "smiley";

    const helperText =
        type === "open"
            ? "Geef je antwoord"
            : type === "multiple_choice"
              ? "Kies één optie"
              : type === "multiple_select"
                ? "Kies één of meerdere opties"
                : type === "boolean"
                  ? "Kies ja of nee"
                  : type === "scale"
                    ? "Kies een cijfer van 1 tot 10"
                    : type === "number"
                      ? "Kies een cijfer van 1 tot 5"
                      : (question?.description || "").trim() || "Welke smiley past het beste?";

    const renderDisplay = () => {
        switch (type) {
            case "smiley":
                return <SmileyDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "number":
                return <NumberDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "scale":
                return <ScaleDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "boolean":
                return <BooleanDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "open":
                return <OpenDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "multiple_choice":
                return <MultipleChoiceDisplay question={question} value={value} onChange={onChange} index={index} />;
            case "multiple_select":
                return <MultipleSelectDisplay question={question} value={value} onChange={onChange} index={index} />;
            default:
                return <SmileyDisplay question={question} value={value} onChange={onChange} index={index} />;
        }
    };

    const title = replaceParent(question.title, parentGender, ageGroup);
    const description = replaceParent(question.description || helperText, parentGender, ageGroup);

    return (
        <div className="question-container w-full max-w-4xl text-center px-5 sm:px-10 py-5 bg-transparent rounded-[32px]">
            <p className="text-3xl font-semibold text-white mb-5">Vraag {index}</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">{title}</h2>
            <p className="text-lg sm:text-xl text-white/90 mb-10">{description}</p>
            {renderDisplay()}
            <div className="mt-8">
                <button
                    type="button"
                    onClick={() => onChange?.("liever_niet")}
                    className={`px-4 py-2 rounded-full text-sm border transition ${
                        value === "liever_niet" || (Array.isArray(value) && value === "liever_niet")
                            ? "text-yellow-400 border-yellow-400/50 font-semibold"
                            : "text-white border-white hover:text-yellow-400 hover:border-yellow-400/50 hover:bg-white/10"
                    }`}
                >
                    Zeg ik liever niet
                </button>
            </div>
        </div>
    );
}
