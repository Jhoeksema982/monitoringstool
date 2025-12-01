import beigeFace from "../assets/images/blank.avif";
import geel from "../assets/images/geel.avif";
import groen from "../assets/images/groen.avif";
import lichtgroen from "../assets/images/lichtgroen.avif";
import rood from "../assets/images/rood.avif";
import { smileys as SMILEYS } from "../constants/ratings";

const imageByKey = { rood, beige: beigeFace, geel, lichtgroen, groen };

export default function QuestionDisplay({
  question,
  index,
  name,
  value,
  onChange,
}) {
  const groupName = name || `smiley-${question?.uuid || index}`;
  const helperText =
    (question?.description || "").trim() || "Welke smiley past het beste?";

  return (
    <div className="w-full max-w-4xl text-center px-5 sm:px-10 py-5 bg-transparent rounded-[32px]">
      <p className="text-3xl font-semibold text-white mb-5">Vraag {index}</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-snug">
        {question.title}
      </h2>
      <p className="text-lg sm:text-xl text-white/90 mb-10">{helperText}</p>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
        {SMILEYS.map((s) => (
          <label
            key={s.key}
            className="flex flex-col items-center cursor-pointer"
          >
            <img
              src={imageByKey[s.key]}
              alt={s.label}
              className="w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] object-contain"
              onClick={() => onChange?.(s.key)}
            />
            <input
              type="radio"
              name={groupName}
              value={s.key}
              checked={value === s.key}
              onChange={() => onChange?.(s.key)}
              className="mt-3 scale-110 accent-teal-500"
            />
            <span className="font-semibold mt-2 text-white text-sm sm:text-base">
              {s.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
