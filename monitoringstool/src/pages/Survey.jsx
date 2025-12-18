import { useState, useEffect } from "react";
import QuestionDisplay from "../components/QuestionDisplay";
import StartScreen from "../components/StartScreen";
import { questionsApi, responsesApi } from "../services/api";
import { RATING_LABELS } from "../constants/ratings";

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // 👇 OKD of regulier (1x gekozen)
  const [mode, setMode] = useState("regular");
  const [showStart, setShowStart] = useState(true);

  useEffect(() => {
    if (!showStart) loadQuestions();
  }, [showStart]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsApi.getAll(); // 👈 zelfde vragen
      setQuestions(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Vragen konden niet geladen worden.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (questionUuid, value) => {
    setAnswers((prev) => ({ ...prev, [questionUuid]: value }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    const unanswered = questions.filter((q) => !answers[q.uuid]);
    if (unanswered.length > 0) {
      setSubmitError("Beantwoord alle vragen voordat je verstuurt.");
      return;
    }

    const responses = questions.map((q) => ({
      question_uuid: q.uuid,
      response_data: {
        value: answers[q.uuid],
        label: RATING_LABELS[answers[q.uuid]] || answers[q.uuid],
      },
    }));

    try {
      setSubmitting(true);

      // 👇 survey_type wordt hier meegestuurd
      await responsesApi.submit({
        survey_type: mode, // 'okd' of 'regular'
        responses,
      });

      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setSubmitError("Versturen mislukt. Probeer het opnieuw.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (submitted) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 min-h-[calc(100vh-96px)]">
          <img
            src="/src/assets/images/groen.avif"
            alt="Bedankt"
            className="w-40 mx-auto mb-6 rounded-lg"
          />
          <h2 className="text-4xl font-bold mb-4">
            Bedankt voor uw deelname!
          </h2>
          <p className="mb-6 text-xl text-gray-200">
            Uw antwoorden zijn succesvol verstuurd.
          </p>
          <button
            className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
            }}
          >
            Nieuwe vragenlijst invullen
          </button>
        </div>
      );
    }

    if (loading) return <p>Loading...</p>;

    if (error) {
      return (
        <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl">
          {error}
        </div>
      );
    }

    if (questions.length === 0) {
      return <p>Er zijn nog geen vragen toegevoegd.</p>;
    }

    return (
      <>
        {questions.map((q, index) => (
          <QuestionDisplay
            key={q.uuid}
            question={q}
            index={index + 1}
            name={`smiley-${q.uuid}`}
            value={answers[q.uuid] || null}
            onChange={(val) => handleChange(q.uuid, val)}
          />
        ))}

        <button
          className="mt-3 bg-[#d9d9d9] text-gray-800 font-semibold py-2 px-10 rounded-full hover:bg-white transition disabled:opacity-60"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Versturen..." : "Versturen"}
        </button>
      </>
    );
  };

  return (
    <>
      {showStart ? (
        <StartScreen
          onStart={(selectedMode) => {
            setMode(selectedMode); // okd / regular
            setShowStart(false);
          }}
        />
      ) : (
        <section className="w-full max-w-5xl flex flex-col items-center gap-8 text-white text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">
            Vragenlijst
          </h1>

          {submitError && (
            <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">
              {submitError}
            </div>
          )}

          <div className="w-full flex flex-col items-center gap-10">
            {renderContent()}
          </div>
        </section>
      )}
    </>
  );
}
