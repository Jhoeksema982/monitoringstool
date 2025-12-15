import { useState, useEffect } from "react";
import QuestionDisplay from "../components/QuestionDisplay";
import StartScreen from "../components/StartScreen";
import { questionsApi, responsesApi } from "../services/api";
import { RATING_LABELS } from "../constants/ratings";

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // { [question_uuid]: 'rood' | 'beige' | ... }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState('regular');
  const [showStart, setShowStart] = useState(true);


  useEffect(() => {
    if (!showStart) loadQuestions();
  }, [showStart, mode]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionsApi.getAll({ mode });
      // API returns { data: [...] } structure
      setQuestions(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load questions');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (questionUuid, value) => {
    setAnswers((prev) => ({ ...prev, [questionUuid]: value }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitted(false);
    const unanswered = questions.filter((q) => !answers[q.uuid]);
    if (unanswered.length > 0) {
      setSubmitError('Beantwoord alle vragen voordat je verstuurt.');
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
      await responsesApi.submit({ responses });
      setSubmitted(true);
    } catch (e) {
      console.error('Error submitting responses:', e);
      setSubmitError('Versturen mislukt. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <p className="text-lg">Loading...</p>;
    }

    if (error) {
      return (
        <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl">
          {error}
        </div>
      );
    }

    if (questions.length === 0) {
      return <p className="text-lg">Er zijn nog geen vragen toegevoegd.</p>;
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
        <StartScreen onStart={(m) => { setMode(m); setShowStart(false); }} />
      ) : (
        <section className="w-full max-w-5xl flex flex-col items-center gap-8 text-white text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">Vragenlijst</h1>

      {submitError && (
        <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">
          {submitError}
        </div>
      )}
      {submitted && (
        <div className="bg-green-600/90 text-white px-6 py-3 rounded-xl">
          Bedankt! Je antwoorden zijn verstuurd.
        </div>
      )}

          <div className="w-full flex flex-col items-center gap-10">{renderContent()}</div>
        </section>
      )}
    </>
  );
}
