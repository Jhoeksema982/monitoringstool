import { useState, useEffect } from "react";
import QuestionDisplay from "../components/QuestionDisplay";
import ConsentQuestion from "../components/ConsentQuestion";
import StartScreen from "../components/StartScreen";
import { questionsApi, responsesApi } from "../services/api";
import { RATING_LABELS } from "../constants/ratings";
import { CONSENT_QUESTION_UUID } from "../constants/consent";

export default function Survey() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [consent, setConsent] = useState(null); // null, "ja", of "nee"
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
      // Filter out consent question (it's shown separately)
      const filteredQuestions = (response.data || []).filter(
        (q) => q.uuid !== CONSENT_QUESTION_UUID
      );
      setQuestions(filteredQuestions);
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

    // Check consent first
    if (!consent) {
      setSubmitError("Beantwoord eerst de toestemmingsvraag.");
      return;
    }

    if (consent === "nee") {
      setSubmitError("Zonder toestemming kunnen we de vragenlijst niet invullen.");
      return;
    }

    const unanswered = questions.filter((q) => !answers[q.uuid]);
    if (unanswered.length > 0) {
      setSubmitError("Beantwoord alle vragen voordat je verstuurt.");
      return;
    }

    // Create consent response
    const consentResponse = {
      question_uuid: CONSENT_QUESTION_UUID,
      response_data: {
        value: consent,
        label: consent === "ja" ? "Ja" : "Nee",
      },
    };

    const responses = [
      consentResponse,
      ...questions.map((q) => ({
        question_uuid: q.uuid,
        response_data: {
          value: answers[q.uuid],
          label: RATING_LABELS[answers[q.uuid]] || answers[q.uuid],
        },
      })),
    ];

    try {
      setSubmitting(true);

      // 👇 survey_type wordt hier meegestuurd
      await responsesApi.submit({
        survey_type: mode, // 'ouder_kind' of 'regular'
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
            src="/images/groen.avif"
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
              setConsent(null);
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

    // Show consent question first
    if (!consent) {
      return (
        <>
          <ConsentQuestion
            value={consent}
            onChange={(val) => {
              setConsent(val);
              if (val === "nee") {
                setSubmitError("Zonder toestemming kunnen we de vragenlijst niet invullen.");
              } else {
                setSubmitError(null);
              }
            }}
          />
          {consent === "nee" && (
            <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">
              Zonder toestemming kunnen we de vragenlijst niet invullen.
            </div>
          )}
        </>
      );
    }

    if (consent === "nee") {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl mb-4">
            <h2 className="text-2xl font-bold mb-2">Geen toestemming</h2>
            <p>Zonder toestemming van de ouders/verzorgers kunnen we de vragenlijst niet invullen.</p>
          </div>
          <button
            className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
            onClick={() => {
              setConsent(null);
              setAnswers({});
            }}
          >
            Opnieuw proberen
          </button>
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
            index={index + 2} // Start from 2 because consent is question 1
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
