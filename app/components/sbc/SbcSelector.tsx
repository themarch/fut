import React, { useState } from "react";
import { useSbc } from "../../context/SbcContext";

interface SbcSelectorProps {
  selectedSbcIndex: number;
  setSelectedSbcIndex: (index: number) => void;
  predefinedSbcs: any[];
  customSbc: any;
  handleSimulate: () => void;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algorithm: string) => void;
}

const SbcSelector: React.FC<SbcSelectorProps> = ({
  selectedSbcIndex,
  setSelectedSbcIndex,
  predefinedSbcs,
  customSbc,
  handleSimulate,
  selectedAlgorithm,
  setSelectedAlgorithm,
}) => {
  const { removePredefinedSbc, addCustomSbcToPredefined } = useSbc();
  const [inlineEditingIndex, setInlineEditingIndex] = useState<number>(-1);
  const [editingSbc, setEditingSbc] = useState<{
    name: string;
    isComplex: boolean;
    teams: { rating: number; count: number }[];
  } | null>(null);

  // Fonction pour obtenir une représentation textuelle des équipes requises
  const getTeamsDescription = (sbc: any) => {
    if (!sbc.isComplex) {
      const team = sbc.teams[0];
      return `${team.count} équipe${team.count > 1 ? "s" : ""} à ${
        team.rating
      } OVR`;
    }

    return sbc.teams
      .map(
        (team: any) =>
          `${team.count} équipe${team.count > 1 ? "s" : ""} à ${
            team.rating
          } OVR`
      )
      .join(", ");
  };

  // Calculer le nombre total d'équipes
  const getTotalTeamsCount = (sbc: any) => {
    return sbc.teams.reduce((sum: number, team: any) => sum + team.count, 0);
  };

  // Gérer l'édition d'un SBC prédéfini
  const handleEditSbc = (index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection du SBC
    setInlineEditingIndex(index);
    setEditingSbc({ ...predefinedSbcs[index] });
  };

  // Gérer la suppression d'un SBC prédéfini
  const handleDeleteSbc = (index: number, e: React.MouseEvent) => {
    console.log("handleDeleteSbc appelé avec index:", index);
    e.stopPropagation(); // Empêcher la sélection du SBC

    console.log(
      "Confirmation demandée pour supprimer:",
      predefinedSbcs[index].name
    );

    // Forcer la suppression pour tester sans confirmation
    removePredefinedSbc(index);
    console.log("SBC supprimé sans confirmation pour déboguer");

    // Ajuster la sélection si nécessaire
    if (selectedSbcIndex === index) {
      setSelectedSbcIndex(0);
      console.log("Sélection ajustée à 0");
    } else if (selectedSbcIndex > index) {
      setSelectedSbcIndex(selectedSbcIndex - 1);
      console.log(
        "Sélection ajustée de",
        selectedSbcIndex,
        "à",
        selectedSbcIndex - 1
      );
    }

    // Commenté temporairement pour déboguer
    /*
    if (
      window.confirm(
        `Êtes-vous sûr de vouloir supprimer le SBC "${predefinedSbcs[index].name}" ?`
      )
    ) {
      removePredefinedSbc(index);

      // Ajuster la sélection si nécessaire
      if (selectedSbcIndex === index) {
        setSelectedSbcIndex(0);
      } else if (selectedSbcIndex > index) {
        setSelectedSbcIndex(selectedSbcIndex - 1);
      }
    }
    */
  };

  // Gérer les changements dans le SBC édité en ligne
  const handleInlineEditChange = (field: "name", value: string) => {
    if (!editingSbc) return;
    setEditingSbc({ ...editingSbc, [field]: value });
  };

  // Gérer les changements d'équipe dans le SBC édité en ligne
  const handleInlineTeamChange = (
    index: number,
    field: "rating" | "count",
    value: string
  ) => {
    if (!editingSbc) return;

    const updatedTeams = [...editingSbc.teams];

    if (field === "rating") {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        updatedTeams[index] = {
          ...updatedTeams[index],
          rating: numValue,
        };
      }
    } else {
      // Permettre un champ vide pour count et le traiter directement
      updatedTeams[index] = {
        ...updatedTeams[index],
        count: value === "" ? 0 : parseInt(value, 10) || 0,
      };
    }

    setEditingSbc({ ...editingSbc, teams: updatedTeams });
  };

  // Ajouter une équipe au SBC édité en ligne
  const handleAddTeamToInlineEdit = () => {
    if (!editingSbc) return;
    setEditingSbc({
      ...editingSbc,
      teams: [...editingSbc.teams, { rating: 86, count: 1 }],
    });
  };

  // Supprimer une équipe du SBC édité en ligne
  const handleRemoveTeamFromInlineEdit = (index: number) => {
    if (!editingSbc || editingSbc.teams.length <= 1) return;

    const updatedTeams = [...editingSbc.teams];
    updatedTeams.splice(index, 1);

    setEditingSbc({ ...editingSbc, teams: updatedTeams });
  };

  // Basculer le mode du SBC édité en ligne
  const handleToggleInlineEditMode = () => {
    if (!editingSbc) return;

    if (editingSbc.isComplex) {
      // Passer en mode simple - utiliser la première équipe
      setEditingSbc({
        ...editingSbc,
        isComplex: false,
        teams: [editingSbc.teams[0]],
      });
    } else {
      // Passer en mode complexe - garder l'équipe actuelle
      setEditingSbc({
        ...editingSbc,
        isComplex: true,
      });
    }
  };

  // Gérer la mise à jour d'un SBC édité en ligne
  const handleUpdateInlineEdit = (index: number) => {
    if (!editingSbc) return;

    // Vérifier que le SBC a au moins un nom
    if (!editingSbc.name.trim()) {
      alert("Veuillez donner un nom au SBC avant de le sauvegarder.");
      return;
    }

    // Supprimer l'ancien SBC et ajouter la nouvelle version
    removePredefinedSbc(index);
    addCustomSbcToPredefined({ ...editingSbc });

    // Réinitialiser l'état d'édition
    setInlineEditingIndex(-1);
    setEditingSbc(null);
  };

  // Annuler l'édition en ligne
  const handleCancelInlineEdit = () => {
    setInlineEditingIndex(-1);
    setEditingSbc(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {predefinedSbcs.map((sbc, index) => (
          <div
            key={index}
            className={`px-4 py-3 rounded-lg border transition-all ${
              inlineEditingIndex === index
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 md:col-span-2"
                : selectedSbcIndex === index
                ? "border-primary bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            } ${inlineEditingIndex === index ? "" : "cursor-pointer"}`}
            onClick={() =>
              inlineEditingIndex === index ? null : setSelectedSbcIndex(index)
            }
          >
            {inlineEditingIndex === index && editingSbc ? (
              // Mode édition en ligne - prendre toute la largeur
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white">
                    Modification du SBC
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Mode {editingSbc.isComplex ? "complexe" : "simple"}
                    </span>
                    <button
                      onClick={handleToggleInlineEditMode}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                    >
                      {editingSbc.isComplex
                        ? "Passer en simple"
                        : "Passer en complexe"}
                    </button>
                  </div>
                </div>

                <div className="gap-6 flex flex-col">
                  <div>
                    <label
                      htmlFor={`inline-sbc-${index}-name`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Nom du SBC
                    </label>
                    <input
                      type="text"
                      id={`inline-sbc-${index}-name`}
                      value={editingSbc.name}
                      onChange={(e) =>
                        handleInlineEditChange("name", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                      placeholder="Ex: Icon Moments Ronaldo"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Équipes requises
                      </label>
                      {editingSbc.isComplex && (
                        <button
                          onClick={handleAddTeamToInlineEdit}
                          className="flex items-center text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 cursor-pointer"
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

                    {editingSbc.isComplex ? (
                      // Mode complexe
                      <div className="space-y-3">
                        {editingSbc.teams.map((team, teamIndex) => (
                          <div
                            key={teamIndex}
                            className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <div className="flex-1">
                              <label
                                htmlFor={`inline-team-${index}-${teamIndex}-rating`}
                                className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                              >
                                Note OVR
                              </label>
                              <select
                                id={`inline-team-${index}-${teamIndex}-rating`}
                                value={team.rating}
                                onChange={(e) =>
                                  handleInlineTeamChange(
                                    teamIndex,
                                    "rating",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300 cursor-pointer"
                              >
                                {Array.from(
                                  { length: 15 },
                                  (_, i) => 85 + i
                                ).map((rating) => (
                                  <option key={rating} value={rating}>
                                    {rating}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label
                                htmlFor={`inline-team-${index}-${teamIndex}-count`}
                                className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"
                              >
                                Nombre d&apos;équipes
                              </label>
                              <input
                                type="text"
                                id={`inline-team-${index}-${teamIndex}-count`}
                                value={team.count || ""}
                                onChange={(e) =>
                                  handleInlineTeamChange(
                                    teamIndex,
                                    "count",
                                    e.target.value
                                  )
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                              />
                            </div>
                            {editingSbc.teams.length > 1 && (
                              <button
                                onClick={() =>
                                  handleRemoveTeamFromInlineEdit(teamIndex)
                                }
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
                      // Mode simple
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor={`inline-simple-${index}-rating`}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Note OVR requise
                          </label>
                          <select
                            id={`inline-simple-${index}-rating`}
                            value={editingSbc.teams[0].rating}
                            onChange={(e) =>
                              handleInlineTeamChange(
                                0,
                                "rating",
                                e.target.value
                              )
                            }
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300 cursor-pointer"
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
                            htmlFor={`inline-simple-${index}-count`}
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Nombre d&apos;équipes
                          </label>
                          <input
                            type="text"
                            id={`inline-simple-${index}-count`}
                            value={
                              editingSbc.teams[0].count === 0
                                ? ""
                                : editingSbc.teams[0].count
                            }
                            onChange={(e) =>
                              handleInlineTeamChange(0, "count", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end items-center space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCancelInlineEdit}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded transition-colors duration-200 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
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
                    Annuler
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Êtes-vous sûr de vouloir supprimer le SBC "${editingSbc?.name}" ?`
                        )
                      ) {
                        removePredefinedSbc(index);
                        handleCancelInlineEdit();

                        // Ajuster la sélection si nécessaire
                        if (selectedSbcIndex === index) {
                          setSelectedSbcIndex(0);
                        } else if (selectedSbcIndex > index) {
                          setSelectedSbcIndex(selectedSbcIndex - 1);
                        }
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-red-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-red-400 text-sm font-medium rounded transition-colors duration-200 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
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
                    Supprimer
                  </button>

                  <button
                    onClick={() => handleUpdateInlineEdit(index)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded transition-colors duration-200 flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 mr-1"
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
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage normal
              <div className="flex items-start">
                <input
                  type="radio"
                  id={`sbc-${index}`}
                  name="sbc"
                  checked={selectedSbcIndex === index}
                  onChange={() => setSelectedSbcIndex(index)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 mt-1"
                />
                <div className="ml-3">
                  <label
                    htmlFor={`sbc-${index}`}
                    className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    {sbc.name}
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {sbc.isComplex
                      ? `${getTotalTeamsCount(sbc)} équipes au total`
                      : getTeamsDescription(sbc)}
                  </p>
                  {sbc.isComplex && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {sbc.teams.map((team: any, i: number) => (
                        <div key={i}>
                          {team.count} équipe{team.count > 1 ? "s" : ""} à{" "}
                          {team.rating} OVR
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-auto flex space-x-1">
                  <button
                    onClick={(e) => handleEditSbc(index, e)}
                    className="p-1.5 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="Modifier ce SBC"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  {index >=
                    4 /* Ne pas permettre de supprimer les SBC par défaut (les 4 premiers) */ && (
                    <button
                      onClick={(e) => {
                        console.log(
                          "Bouton supprimer cliqué pour l'index",
                          index
                        );
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteSbc(index, e);
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors z-10 relative"
                      title="Supprimer ce SBC"
                      data-testid={`delete-sbc-${index}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
              </div>
            )}
          </div>
        ))}

        {/* SBC personnalisé */}
        <div
          className={`px-4 py-3 rounded-lg border transition-all cursor-pointer ${
            selectedSbcIndex === predefinedSbcs.length
              ? "border-primary bg-primary/10 dark:bg-primary/20"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
          onClick={() => setSelectedSbcIndex(predefinedSbcs.length)}
        >
          <div className="flex items-start">
            <input
              type="radio"
              id="sbc-custom"
              name="sbc"
              checked={selectedSbcIndex === predefinedSbcs.length}
              onChange={() => setSelectedSbcIndex(predefinedSbcs.length)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 mt-1"
            />
            <div className="ml-3">
              <label
                htmlFor="sbc-custom"
                className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                {customSbc.name || "Personnalisé"}
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {customSbc.isComplex
                  ? `${getTotalTeamsCount(customSbc)} équipes au total`
                  : getTeamsDescription(customSbc)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode de calcul et bouton de simulation */}
      <div className="mt-6 flex flex-col items-center space-y-4">
        {/* Sélecteur d'algorithme */}
        <div className="w-full max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
            Mode de calcul
          </label>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setSelectedAlgorithm("standard")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedAlgorithm === "standard"
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="Algorithme de base utilisant une approche équilibrée"
            >
              Standard
            </button>
            <button
              onClick={() => setSelectedAlgorithm("economic")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedAlgorithm === "economic"
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="Optimise l'utilisation des cartes pour économiser les plus précieuses"
            >
              Économe
            </button>
            <button
              onClick={() => setSelectedAlgorithm("ultra_economic")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedAlgorithm === "ultra_economic"
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="Maximise l'utilisation des cartes de faible valeur pour préserver vos meilleures cartes"
            >
              Ultra économe
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            {selectedAlgorithm === "standard" &&
              "Mode classique - approche équilibrée pour la construction d'équipes."}
            {selectedAlgorithm === "economic" &&
              "Optimise vos ressources en préservant les cartes les plus valorisées."}
            {selectedAlgorithm === "ultra_economic" &&
              "Maximise l'utilisation des cartes les plus faibles pour préserver vos meilleurs joueurs."}
          </p>
        </div>

        <button
          onClick={handleSimulate}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 cursor-pointer flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
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
  );
};

export default SbcSelector;
