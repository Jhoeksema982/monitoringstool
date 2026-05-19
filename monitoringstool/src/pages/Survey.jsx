import { useState, useEffect, useRef } from "react";
import QuestionDisplay from "../components/QuestionDisplay";
import StartScreen from "../components/StartScreen";
import { questionsApi, responsesApi } from "../services/api";
import { RATING_LABELS } from "../constants/ratings";
import groenImage from "../assets/images/groen.avif";
import roodImage from "../assets/images/rood.avif";
import { CONSENT_QUESTION_UUID } from "../constants/consent";

export default function Survey() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [consentDenied, setConsentDenied] = useState(false);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [mode, setMode] = useState("regular");
    const [location, setLocation] = useState(null);
    const [parentGender, setParentGender] = useState("male");
    const [showStart, setShowStart] = useState(true);
    const [ageGroup, setAgeGroup] = useState("all");
    const [autoAdvance, setAutoAdvance] = useState(true);
    const advanceTimeout = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem("survey_state");
        if (saved) {
            try {
                const state = JSON.parse(saved);
                setAnswers(state.answers || {});
                setCurrentQuestionIndex(state.currentQuestionIndex || 0);
                setMode(state.mode);
                setLocation(state.location);
                setParentGender(state.parentGender || "male");
                setAgeGroup(state.ageGroup || "all");
                setConsentDenied(state.consentDenied || false);
                if (state.location && state.mode) {
                    setShowStart(false);
                }
            } catch {}
        }

        document.title = "Vragenlijst - Monitoringstool";
    }, []);

    useEffect(() => {
        if (!showStart) {
            localStorage.setItem(
                "survey_state",
                JSON.stringify({
                    answers,
                    currentQuestionIndex,
                    mode,
                    location,
                    parentGender,
                    ageGroup,
                    consentDenied,
                }),
            );
        }
    }, [answers, currentQuestionIndex, mode, location, showStart, ageGroup, consentDenied]);

    const clearSurveyState = () => {
        localStorage.removeItem("survey_state");
        setAnswers({});
        setCurrentQuestionIndex(0);
        setShowStart(true);
        setAgeGroup("all");
        setParentGender("male");
        setConsentDenied(false);
        setSubmitted(false);
    };

    useEffect(() => {
        if (!showStart) loadQuestions();
    }, [showStart]);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const response = await questionsApi.getAll({ mode, gender: parentGender });
            const filteredQuestions = (response.data || []).filter(
                (q) =>
                    (q.age_group === "all" || q.age_group === ageGroup || !q.age_group),
            ).map((q) => ({
                ...q,
                type: q.type === "smiley" && ageGroup === "12_plus" ? "number" : q.type,
            }));
            const sortedQuestions = [...filteredQuestions].sort((a, b) => {
                if (a.uuid === CONSENT_QUESTION_UUID) return -1;
                if (b.uuid === CONSENT_QUESTION_UUID) return 1;
                return (a.position ?? 0) - (b.position ?? 0);
            });
            setQuestions(sortedQuestions);
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
        if (questionUuid === CONSENT_QUESTION_UUID && (value === "no" || value === "liever_niet")) {
            setConsentDenied(true);
            return;
        }
        const currentQ = questions[currentQuestionIndex];
        if (autoAdvance && currentQ?.type !== "multiple_select" && currentQuestionIndex < questions.length - 1) {
            if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
            advanceTimeout.current = setTimeout(() => {
                setCurrentQuestionIndex((prev) => prev + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }, 300);
        }
    };

    useEffect(() => {
        return () => {
            if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
        };
    }, []);

    const handleNext = () => {
        setCurrentQuestionIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePrevious = () => {
        setCurrentQuestionIndex((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async () => {
        setSubmitError(null);

        const unanswered = questions.filter((q) => {
            const a = answers[q.uuid];
            return a === undefined || a === null || (Array.isArray(a) && a.length === 0);
        });
        if (unanswered.length > 0) {
            setSubmitError("Beantwoord alle vragen voordat je verstuurt.");
            return;
        }

        const responses = questions.map((q) => {
            const val = answers[q.uuid];
            const label = Array.isArray(val)
                ? val.join(", ")
                : RATING_LABELS[val] || val;
            return {
                question_uuid: q.uuid,
                response_data: { value: val, label },
            };
        });
        try {
            setSubmitting(true);
            if (location === "demo") {
                // Demo modus: niet opslaan, alleen simuleren
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                await responsesApi.submit({
                    survey_type: mode,
                    location: location,
                    responses,
                });
            }
            setSubmitted(true);
            localStorage.removeItem("survey_state");
            setAnswers({});
            setCurrentQuestionIndex(0);
        } catch (e) {
            console.error(e);
            setSubmitError("Versturen mislukt. Probeer het opnieuw.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderContent = () => {
        if (consentDenied) {
            return (
                <div className="flex flex-col items-center text-center p-6 animate-in fade-in zoom-in duration-300">
                    <img src={roodImage} alt="Geen toestemming" className="w-40 mx-auto mb-6 rounded-lg mt-8" />
                    <h2 className="text-4xl font-bold mb-4">Geen toestemming</h2>
                    <p className="mb-6 text-xl text-gray-200">
                        Je kunt de vragenlijst niet invullen zonder toestemming van je ouders/verzorgers.
                    </p>
                    <button
                        className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
                        onClick={clearSurveyState}
                    >
                        Terug naar home
                    </button>
                </div>
            );
        }

        if (submitted) {
            return (
                <div className="flex flex-col items-center text-center p-6 animate-in fade-in zoom-in duration-300">
                    <img src={groenImage} alt="Bedankt" className="w-40 mx-auto mb-6 rounded-lg mt-8" />
                    <h2 className="text-4xl font-bold mb-4">Bedankt voor het invullen!</h2>
                    <p className="mb-6 text-xl text-gray-200">
                        {location === "demo"
                            ? "Dit was een demo — er is niets opgeslagen."
                            : <>Je antwoorden zijn goed ontvangen voor locatie{" "}
                              <span className="font-bold text-yellow-400">{location}</span>.</>
                        }
                    </p>
                    <button
                        className="bg-yellow-400 text-teal-900 font-semibold px-6 py-3 rounded-full hover:bg-yellow-300 transition"
                        onClick={() => {
                            clearSurveyState();
                        }}
                    >
                        Nieuwe vragenlijst
                    </button>
                </div>
            );
        }

        if (loading) return <p>Laden...</p>;

        if (error) {
            return <div className="bg-red-600/80 text-white px-6 py-4 rounded-xl">{error}</div>;
        }

        if (questions.length === 0) {
            return <p>Er zijn nog geen vragen toegevoegd.</p>;
        }

        // DE VRAGEN ZELF
        const currentQ = questions[currentQuestionIndex];
        if (!currentQ) return <p>Er zijn nog geen vragen toegevoegd.</p>;
        const hasAnsweredCurrent = answers[currentQ.uuid] !== undefined;
        const isLastQuestion = currentQuestionIndex === questions.length - 1;

        return (
            <div className="w-full flex flex-col items-center animate-in slide-in-from-right-8 fade-in duration-500">
                <div className="w-full max-w-2xl mb-4 flex justify-between items-center px-4">
                    <span className="text-teal-200 text-sm">
                        Locatie: <span className="font-semibold text-white">{location}</span>
                    </span>
                    <span className="text-teal-200 text-sm">
                        {mode === "ouder_kind" ? "Ouder-kind dag" : mode === "extra_vader_kind" ? "Ander ouder-kind moment" : "Regulier bezoek"}
                    </span>
                </div>

                <QuestionDisplay
                    key={currentQ.uuid}
                    question={currentQ}
                    index={currentQuestionIndex + 1}
                    name={`question-${currentQ.uuid}`}
                    value={answers[currentQ.uuid] || null}
                    onChange={(val) => handleChange(currentQ.uuid, val)}
                    parentGender={parentGender}
                    ageGroup={ageGroup}
                />

                <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
                    {currentQuestionIndex > 0 && (
                        <button
                            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                            onClick={handlePrevious}
                            disabled={submitting}
                        >
                            Vorige
                        </button>
                    )}

                    <button
                        className={`flex-grow px-8 py-3 rounded-full font-bold text-lg transition shadow-lg
                    ${
                        hasAnsweredCurrent && !submitting
                            ? "bg-yellow-400 text-teal-900 hover:bg-yellow-300 hover:scale-105"
                            : "bg-gray-500/50 text-gray-300 cursor-not-allowed"
                    }`}
                        onClick={isLastQuestion ? handleSubmit : handleNext}
                        disabled={!hasAnsweredCurrent || submitting}
                    >
                        {isLastQuestion ? (submitting ? "Even geduld..." : "Vragen versturen") : "Volgende vraag"}
                    </button>
                </div>

                <div className="mt-6 text-sm text-white/40">
                    Vraag {currentQuestionIndex + 1} van {questions.length}
                </div>
            </div>
        );
    };

    return (
        <>
            {showStart ? (
                <StartScreen
                    onStart={(selectedMode, selectedLocation, selectedAgeGroup, selectedGender) => {
                        setMode(selectedMode);
                        setLocation(selectedLocation);
                        setAgeGroup(selectedAgeGroup);
                        setParentGender(selectedGender || "male");
                        setShowStart(false);
                    }}
                />
            ) : (
                <section className="w-full max-w-5xl flex flex-col items-center gap-6 text-white text-center py-8">
                    <div className="w-full flex justify-start">
                        <button
                            className="text-teal-200 hover:text-white text-sm flex items-center gap-1"
                            onClick={clearSurveyState}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"
                                />
                            </svg>
                            Terug naar home
                        </button>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-bold">Vragenlijst</h1>

                    {submitError && <div className="bg-red-600/80 text-white px-6 py-3 rounded-xl">{submitError}</div>}

                    <div className="w-full flex flex-col items-center justify-start pt-10 min-h-[400px]">
                        {renderContent()}
                    </div>
                </section>
            )}
        </>
    );
}
