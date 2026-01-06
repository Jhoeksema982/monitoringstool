import { CONSENT_QUESTION_UUID } from "../constants/consent";

const SURVEY_TYPES = [
  { key: "regular", label: "Regulier" },
  { key: "ouder_kind", label: "Ouder-kind dagen" },
];

export default function ResponsesTable({
  responses, // Dit zijn nu SUBMISSIONS (groepen)
  responsesLoading,
  responsesError,
  respPage,
  respLimit,
  respHasPrev,
  respHasNext,
  onPrevPage,
  onNextPage,
  expandedGroups,
  setExpandedGroups,
}) {
  
  // Filter submissions per type (regular / ouder_kind)
  const submissionsByType = SURVEY_TYPES.reduce((acc, type) => {
    acc[type.key] = (responses || []).filter(
      (s) => (s.survey_type || 'regular') === type.key
    );
    return acc;
  }, {});

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold">Ingezonden antwoorden</h2>
        <div className="flex gap-2">
          <button
            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
            onClick={onPrevPage}
            disabled={!respHasPrev || responsesLoading}
          >
            Vorige
          </button>
          <span className="py-1 px-2 text-sm text-gray-300">Pagina {respPage}</span>
          <button
            className="bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded disabled:opacity-50"
            onClick={onNextPage}
            disabled={!respHasNext || responsesLoading}
          >
            Volgende
          </button>
        </div>
      </div>

      {responsesError && (
        <div className="bg-red-500 text-white p-3 rounded mb-4">
          {responsesError}
        </div>
      )}

      {SURVEY_TYPES.map((surveyType) => {
        const items = submissionsByType[surveyType.key] || [];
        const hasItems = items.length > 0;

        return (
          <div key={surveyType.key} className="mb-6">
            <h3 className={`text-lg font-semibold mb-2 px-1 ${
              surveyType.key === "regular" ? "text-teal-300" : "text-orange-300"
            }`}>
              {surveyType.label}
            </h3>
            <div className="bg-teal-700 rounded overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-teal-600 text-sm uppercase text-gray-100">
                  <tr>
                    <th className="px-4 py-2">Datum</th>
                    <th className="px-4 py-2">Info</th>
                    <th className="px-4 py-2">Actie</th>
                    <th className="px-4 py-2">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {responsesLoading ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={4}>Laden...</td>
                    </tr>
                  ) : !hasItems ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={4}>
                        Geen antwoorden gevonden.
                      </td>
                    </tr>
                  ) : (
                    items.map((sub) => {
                      const isOpen = !!expandedGroups[sub.uuid];
                      // Filter consent vraag uit de weergave van antwoorden
                      const cleanResponses = (sub.responses || []).filter(r => r.question_uuid !== CONSENT_QUESTION_UUID);
                      
                      // Zoek user identifier in de antwoorden
                      const firstUser = cleanResponses.find((it) => it.user_identifier)?.user_identifier || "-";
                      const dateStr = new Date(sub.created_at).toLocaleString('nl-NL');

                      return (
                        <>
                          <tr
                            key={sub.uuid}
                            className="border-t border-teal-600 cursor-pointer hover:bg-teal-650/30"
                            onClick={() =>
                              setExpandedGroups((prev) => ({
                                ...prev,
                                [sub.uuid]: !isOpen,
                              }))
                            }
                          >
                            <td className="px-4 py-3 text-sm text-gray-200">
                              {dateStr}
                            </td>
                            <td className="px-4 py-3">
                              {cleanResponses.length} vragen ingevuld · {firstUser}
                            </td>
                            <td className="px-4 py-3 text-sm text-yellow-300">
                              {isOpen ? "Verberg" : "Toon details"}
                            </td>
                            <td className="px-4 py-3" />
                          </tr>
                          {isOpen && (
                            <tr key={`details-${sub.uuid}`} className="border-t border-teal-700">
                              <td className="px-4 py-3 bg-teal-750" colSpan={4}>
                                <div className="divide-y divide-teal-600">
                                  {cleanResponses.map((r) => (
                                    <div
                                      key={r.uuid}
                                      className="py-2 flex flex-col gap-1 md:flex-row md:items-start md:gap-4"
                                    >
                                      <div className="md:w-1/3 font-semibold text-teal-100">
                                        {r.question_title}
                                      </div>
                                      <div className="flex-1 text-white">
                                        {r?.response_data?.label || r?.response_data?.value || "Geen antwoord"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}