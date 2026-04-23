import { Smile, Hash, Gauge, Check, X, FileText, List } from "lucide-react";
import { QUESTION_TYPES } from "../constants/ratings";

const iconMap = {
  smiley: Smile,
  number: Hash,
  scale: Gauge,
  boolean: Check,
  open: FileText,
  multiple_choice: List,
};

export default function QuestionTypeModal({ isOpen, onSelect, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-teal-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Kies vraagtype</h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-2xl leading-none"
              aria-label="Sluiten"
            >
              &times;
            </button>
          </div>
          
          <p className="text-gray-200 mb-4 sm:mb-6">
            Welk type vraag wil je toevoegen?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {QUESTION_TYPES.map((type) => {
              const Icon = iconMap[type.value];
              return (
                <button
                  key={type.value}
                  onClick={() => onSelect(type.value)}
                  className="bg-teal-600 hover:bg-teal-500 p-4 sm:p-6 rounded-lg text-left transition-colors border-2 border-transparent hover:border-yellow-400"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {Icon && <Icon className="w-6 h-6 text-yellow-400" />}
                    <span className="font-semibold text-white text-lg">{type.label}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}