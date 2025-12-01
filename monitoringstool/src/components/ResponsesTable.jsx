export default function ResponsesTable({
  responses,
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
  const hasResponses = Array.isArray(responses) && responses.length > 0;

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

      <div className="bg-teal-700 rounded overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-teal-600 text-sm uppercase text-gray-100">
            <tr>
              <th className="px-4 py-2">Inzending</th>
              <th className="px-4 py-2">Samenvatting</th>
              <th className="px-4 py-2">Actie</th>
              <th className="px-4 py-2">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {responsesLoading ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>
                  Laden...
                </td>
              </tr>
            ) : !hasResponses ? (
              <tr>
                <td className="px-4 py-3" colSpan={4}>
                  Geen antwoorden gevonden.
                </td>
              </tr>
            ) : (
              (() => {
                const groupsMap = responses.reduce((acc, r) => {
                  const key = r.submission_uuid || r.created_at || r.uuid;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(r);
                  return acc;
                }, {});

                const groups = Object.entries(groupsMap)
                  .map(([groupKey, items]) => ({
                    groupKey,
                    createdAt: items[0]?.created_at,
                    items,
                  }))
                  .sort((a, b) => {
                    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bt - at;
                  });

                return groups.map((g, idx) => {
                  const isOpen = !!expandedGroups[g.groupKey];
                  const firstUser =
                    g.items.find((it) => it.user_identifier)?.user_identifier || "-";

                  return (
                    <>
                      <tr
                        key={`group-${g.groupKey}`}
                        className="border-t border-teal-600 cursor-pointer hover:bg-teal-650/30"
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [g.groupKey]: !isOpen,
                          }))
                        }
                      >
                        <td className="px-4 py-3 text-sm text-gray-200">
                          Inzending {(respPage - 1) * respLimit + idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          {g.items.length} antwoorden · gebruiker: {firstUser}
                        </td>
                        <td className="px-4 py-3 text-sm text-yellow-300">
                          {isOpen ? "Verberg" : "Toon"}
                        </td>
                        <td className="px-4 py-3" />
                      </tr>
                      {isOpen && (
                        <tr
                          key={`group-details-${g.groupKey}`}
                          className="border-t border-teal-700"
                        >
                          <td className="px-4 py-3 bg-teal-750" colSpan={4}>
                            <div className="divide-y divide-teal-600">
                              {g.items.map((r) => (
                                <div
                                  key={r.uuid}
                                  className="py-2 flex flex-col gap-1 md:flex-row md:items-start md:gap-4"
                                >
                                  <div className="md:w-1/3 font-semibold">
                                    {r.question_title || r.question_uuid}
                                  </div>
                                  <div className="flex-1">
                                    {r?.response_data?.label ||
                                      r?.response_data?.value ||
                                      ""}
                                  </div>
                                  <div className="text-xs text-gray-300 md:w-1/4 md:text-right">
                                    {r.user_identifier || "-"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                });
              })()
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


