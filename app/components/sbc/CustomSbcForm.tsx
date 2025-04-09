import React from "react";
import { useSbc } from "../../context/SbcContext";

const CustomSbcForm: React.FC = () => {
  const {
    customSbc,
    updateCustomSbc,
    updateTeamInCustomSbc,
    addTeamToCustomSbc,
    removeTeamFromCustomSbc,
    toggleCustomSbcMode,
    runSimulation,
    addCustomSbcToPredefined,
  } = useSbc();

  // Fonction pour générer un nom aléatoire drôle pour un SBC
  const generateRandomSbcName = (): string => {
    const adjectives = [
      "Incroyable",
      "Légendaire",
      "Mystérieux",
      "Extravagant",
      "Majestueux",
      "Épique",
      "Étincelant",
      "Glorieux",
      "Catastrophique",
      "Désastreux",
      "Bizarre",
      "Mirobolant",
      "Fantastique",
      "Ridicule",
      "Magique",
    ];

    const nouns = [
      "Pépite",
      "Diamant",
      "Challenge",
      "Trésor",
      "Opportunité",
      "Défi",
      "Miracle",
      "Fiasco",
      "Cauchemar",
      "Aventure",
      "Épreuve",
      "Expédition",
      "Mystère",
      "Chance",
      "Folie",
    ];

    const players = [
      "Ronaldo",
      "Messi",
      "Mbappé",
      "Neymar",
      "Haaland",
      "Pogba",
      "Benzema",
      "Griezmann",
      "Salah",
      "Kane",
      "Lewandowski",
      "De Bruyne",
      "Modric",
      "Ramos",
      "Maldini",
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomPlayer = players[Math.floor(Math.random() * players.length)];

    // Format: "Adjectif Nom du Joueur"
    return `${randomAdjective} ${randomNoun} de ${randomPlayer}`;
  };

  // Gérer les changements dans le SBC personnalisé - nom
  const handleCustomSbcNameChange = (value: string) => {
    updateCustomSbc({ name: value });
  };

  // Gérer les changements d'équipe dans le SBC personnalisé
  const handleTeamChange = (
    index: number,
    field: "rating" | "count",
    value: string
  ) => {
    if (field === "rating") {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        updateTeamInCustomSbc(index, numValue, customSbc.teams[index].count);
      }
    } else {
      // Permettre un champ vide temporairement et valider la valeur
      const numValue = value === "" ? 0 : parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        updateTeamInCustomSbc(index, customSbc.teams[index].rating, numValue);
      }
    }
  };

  // Calculer le nombre total d'équipes
  const getTotalTeamsCount = () => {
    return customSbc.teams.reduce((sum, team) => sum + team.count, 0);
  };

  // Fonction pour ajouter le SBC personnalisé à la liste sans faire de simulation
  const handleAddCustomSbc = () => {
    // Créer une copie du SBC personnalisé
    const sbcToAdd = { ...customSbc };

    // Si aucun nom n'est fourni, générer un nom aléatoire drôle
    if (!sbcToAdd.name.trim()) {
      sbcToAdd.name = generateRandomSbcName();
    }

    // Ajouter à la liste des SBCs prédéfinis
    addCustomSbcToPredefined(sbcToAdd);

    // Réinitialiser le formulaire
    updateCustomSbc({
      name: "",
      teams: [{ rating: 86, count: 1 }],
      isComplex: false,
    });
  };

  // Function to handle simulation
  const handleSimulate = () => {
    runSimulation(customSbc, "standard");
  };

  return (
    <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-800 dark:text-white">
          Configuration du SBC personnalisé
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 cursor-default">
            Mode {customSbc.isComplex ? "complexe" : "simple"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCustomSbcMode();
            }}
            className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            {customSbc.isComplex ? "Passer en simple" : "Passer en complexe"}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Nom du SBC */}
        <div>
          <label
            htmlFor="customSbcName"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Nom du SBC{" "}
            <span className="text-xs text-gray-500">
              (optionnel, un nom aléatoire sera généré si vide)
            </span>
          </label>
          <input
            type="text"
            id="customSbcName"
            value={customSbc.name}
            onChange={(e) => handleCustomSbcNameChange(e.target.value)}
            className="w-full pl-4 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
            placeholder="Ex: Icon Moments Ronaldo"
          />
        </div>

        {/* Configuration des équipes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Équipes requises
            </label>
            {customSbc.isComplex && (
              <button
                onClick={() => addTeamToCustomSbc(86, 1)}
                className="flex items-center text-sm text-primary dark:text-primary-light hover:text-primary-dark cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Ajouter une équipe
              </button>
            )}
          </div>

          {customSbc.isComplex ? (
            // Mode complexe - plusieurs équipes avec différentes notes
            <div className="space-y-3">
              {customSbc.teams.map((team, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`team-${index}-rating`}
                      className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                    >
                      Note OVR
                    </label>
                    <select
                      id={`team-${index}-rating`}
                      value={team.rating}
                      onChange={(e) =>
                        handleTeamChange(index, "rating", e.target.value)
                      }
                      className="w-full pl-4 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300 cursor-pointer"
                    >
                      {Array.from({ length: 15 }, (_, i) => 85 + i).map(
                        (rating) => (
                          <option key={rating} value={rating}>
                            {rating}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor={`team-${index}-count`}
                      className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                    >
                      Nombre d&apos;équipes
                    </label>
                    <input
                      type="text"
                      id={`team-${index}-count`}
                      value={team.count === 0 ? "" : team.count}
                      onChange={(e) =>
                        handleTeamChange(index, "count", e.target.value)
                      }
                      className="w-full pl-4 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                    />
                  </div>
                  {customSbc.teams.length > 1 && (
                    <button
                      onClick={() => removeTeamFromCustomSbc(index)}
                      className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 cursor-pointer self-end"
                      title="Supprimer cette équipe"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // Mode simple - une seule note avec un nombre d'équipes
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="simple-rating"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Note OVR requise
                </label>
                <select
                  id="simple-rating"
                  value={customSbc.teams[0].rating}
                  onChange={(e) =>
                    handleTeamChange(0, "rating", e.target.value)
                  }
                  className="w-full pl-4 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300 cursor-pointer"
                >
                  {Array.from({ length: 15 }, (_, i) => 85 + i).map(
                    (rating) => (
                      <option key={rating} value={rating}>
                        {rating}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label
                  htmlFor="simple-count"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre d&apos;équipes
                </label>
                <input
                  type="text"
                  id="simple-count"
                  value={
                    customSbc.teams[0].count === 0
                      ? ""
                      : customSbc.teams[0].count
                  }
                  onChange={(e) => handleTeamChange(0, "count", e.target.value)}
                  placeholder="0"
                  className="w-full pl-4 pr-4 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total: {getTotalTeamsCount()} équipes
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {customSbc.isComplex
                ? "Mode complexe"
                : `Note requise: ${customSbc.teams[0].rating} OVR`}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={handleAddCustomSbc}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Ajouter à la liste
            </button>

            <button
              onClick={handleSimulate}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-md shadow-sm hover:shadow transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Simuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomSbcForm;
