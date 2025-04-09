import React from "react";

interface SbcResultsProps {
  simulationResult: {
    possible: boolean;
    completedTeams: number;
    totalTeams: number;
    squads: number[][];
  };
  selectedSbc: {
    name: string;
    isComplex: boolean;
    teams: { rating: number; count: number }[];
  };
  collapsed: Record<string, boolean>;
  toggleCollapse: (key: string) => void;
}

const SbcResults: React.FC<SbcResultsProps> = ({
  simulationResult,
  selectedSbc,
  collapsed,
  toggleCollapse,
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-md transition-colors duration-300">
      <div
        className={`p-4 ${
          simulationResult.possible
            ? "bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800"
        }`}
      >
        <div className="flex items-start">
          <div
            className={`rounded-full p-2 ${
              simulationResult.possible
                ? "bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200"
                : "bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200"
            }`}
          >
            {simulationResult.possible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold dark:text-white">
              {simulationResult.possible
                ? `Vous pouvez compléter le SBC "${selectedSbc.name}"`
                : `Vous ne pouvez pas compléter le SBC "${selectedSbc.name}"`}
            </h3>
            <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
              {simulationResult.possible
                ? `Équipes complétées: ${simulationResult.completedTeams}/${simulationResult.totalTeams}`
                : "Nombre de joueurs insuffisant ou note trop basse pour compléter ce SBC."}
            </p>
          </div>
          <button
            onClick={() => toggleCollapse("simulationResults")}
            className="ml-auto text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
          >
            {collapsed["simulationResults"] ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {simulationResult.squads.length > 0 &&
        !collapsed["simulationResults"] && (
          <div className="max-h-[60vh] overflow-y-auto p-4 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            <h4 className="text-md font-medium mb-4 text-gray-800 dark:text-white sticky top-0 bg-white dark:bg-gray-800 py-2">
              Équipes complétées ({simulationResult.completedTeams}/
              {simulationResult.totalTeams})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulationResult.squads.map((squad, index) => {
                // Calculer la distribution des notes dans cette équipe
                const ratingDistribution: Record<number, number> = {};
                squad.forEach((rating) => {
                  ratingDistribution[rating] =
                    (ratingDistribution[rating] || 0) + 1;
                });

                // Trier les notes par ordre décroissant
                const sortedRatings = Object.entries(ratingDistribution)
                  .map(([rating, count]) => ({
                    rating: parseInt(rating, 10),
                    count,
                  }))
                  .sort((a, b) => b.rating - a.rating);

                // Obtenir le niveau d'équipe requis
                const requiredRating = selectedSbc.isComplex
                  ? selectedSbc.teams[
                      Math.min(index, selectedSbc.teams.length - 1)
                    ].rating
                  : selectedSbc.teams[0].rating;

                return (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 hover:shadow-md transition-all duration-300"
                  >
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                      <span>
                        Équipe #{index + 1}{" "}
                        <span className="text-primary ml-1">
                          {requiredRating} OVR requis
                        </span>
                      </span>
                      <span className="ml-auto text-gray-500 dark:text-gray-400 text-xs">
                        11 joueurs
                      </span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {sortedRatings.map(({ rating, count }) => (
                        <div
                          key={rating}
                          className="flex-none relative rounded-lg overflow-hidden bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 text-center aspect-square min-w-[88px]"
                        >
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-2xl font-bold text-white">
                              {rating}
                            </span>
                            <span className="text-sm text-gray-300">OVR</span>
                          </div>
                          <span className="absolute top-2 right-2 text-gray-400 text-sm">
                            ×{count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default SbcResults;
