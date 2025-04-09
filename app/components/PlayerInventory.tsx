"use client";

import React, { useState, useRef } from "react";
import { useSbc } from "../context/SbcContext";

const MIN_RATING = 75;
const MAX_RATING = 99;

const PlayerInventory: React.FC = () => {
  const {
    inventory,
    players,
    addPlayers,
    removePlayers,
    resetInventory,
    importPlayersFromCsv,
    togglePlayerExclusion,
  } = useSbc();
  const [newRating, setNewRating] = useState<number>(85);
  const [newCount, setNewCount] = useState<number>(1);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filterRating, setFilterRating] = useState<string>("");
  const [filterName, setFilterName] = useState<string>("");
  const [showDetailedView, setShowDetailedView] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Générer le tableau de notes possibles
  const ratingOptions = Array.from(
    { length: MAX_RATING - MIN_RATING + 1 },
    (_, i) => MIN_RATING + i
  );

  // Ajouter des joueurs à l'inventaire
  const handleAddPlayers = () => {
    if (newRating >= MIN_RATING && newRating <= MAX_RATING && newCount > 0) {
      addPlayers(newRating, newCount);
      setNewCount(1); // Réinitialiser le compteur
    }
  };

  // Traiter le changement de la valeur de quantité
  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      // Si le champ est vide, on conserve cette valeur
      setNewCount(NaN);
    } else {
      // Sinon on essaie de convertir en nombre
      const numValue = parseInt(value, 10);
      setNewCount(isNaN(numValue) ? NaN : numValue);
    }
  };

  // Traiter le changement de note
  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    // Vérifier que la valeur est un nombre valide, sinon utiliser la valeur minimale
    setNewRating(isNaN(value) ? MIN_RATING : value);
  };

  // Supprimer des joueurs de l'inventaire
  const handleRemovePlayers = (rating: number) => {
    removePlayers(rating, 1);
  };

  // Basculer l'état d'une section (expanded/collapsed)
  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Gérer la modification du filtre
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterRating(e.target.value);
  };

  // Supprimer toutes les occurrences d'un rating
  const handleRemoveAllWithRating = (rating: number) => {
    const count = inventory[rating.toString()] || 0;
    if (count > 0) {
      removePlayers(rating, count);
    }
  };

  // Ajouter 5 joueurs d'un coup
  const handleAddFivePlayers = () => {
    if (newRating >= MIN_RATING && newRating <= MAX_RATING) {
      addPlayers(newRating, 5);
    }
  };

  // Ajouter 10 joueurs d'un coup
  const handleAddTenPlayers = () => {
    if (newRating >= MIN_RATING && newRating <= MAX_RATING) {
      addPlayers(newRating, 10);
    }
  };

  // Trier les joueurs par note (décroissant)
  const sortedInventory = Object.entries(inventory)
    .map(([rating, count]) => ({ rating: parseInt(rating, 10), count }))
    .sort((a, b) => b.rating - a.rating);

  // Filtrer les joueurs si un filtre est appliqué
  const filteredInventory = filterRating
    ? sortedInventory.filter((item) =>
        item.rating.toString().includes(filterRating)
      )
    : sortedInventory;

  // Calculer le nombre total de joueurs
  const totalPlayers = Object.values(inventory).reduce(
    (sum, count) => sum + count,
    0
  );

  // Grouper par catégories de ratings
  const highRatings = filteredInventory.filter((item) => item.rating >= 90);
  const mediumRatings = filteredInventory.filter(
    (item) => item.rating >= 85 && item.rating < 90
  );
  const lowRatings = filteredInventory.filter((item) => item.rating < 85);

  // Filtrer les joueurs pour la vue détaillée
  const filteredPlayers = players.filter((player) => {
    if (filterName) {
      const nameMatch = player.nom
        .toLowerCase()
        .includes(filterName.toLowerCase());
      const ratingMatch = player.note.toString().includes(filterName);
      return nameMatch || ratingMatch;
    }
    return true;
  });

  // Trier les joueurs par note (décroissant) puis par nom
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (b.note !== a.note) {
      return b.note - a.note;
    }
    return a.nom.localeCompare(b.nom);
  });

  // Gérer l'importation d'un fichier CSV
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        if (!csvContent) throw new Error("Impossible de lire le fichier");

        // Traitement du CSV
        const lines = csvContent.split("\n").filter((line) => line.trim());
        const headers = lines[0]
          .split(",")
          .map((header) => header.trim().toLowerCase());

        // Vérifier que le CSV a les bonnes colonnes
        if (!headers.includes("nom") || !headers.includes("note")) {
          throw new Error(
            "Le fichier CSV doit contenir les colonnes 'Nom' et 'Note'"
          );
        }

        const nomIndex = headers.indexOf("nom");
        const noteIndex = headers.indexOf("note");

        // Parser les lignes de joueurs (en sautant l'en-tête)
        const players = lines.slice(1).map((line) => {
          const values = line.split(",").map((val) => val.trim());
          const nom = values[nomIndex];
          const note = parseInt(values[noteIndex], 10);

          if (isNaN(note)) {
            throw new Error(`Note invalide pour le joueur ${nom}`);
          }

          return { nom, note };
        });

        // Importer les joueurs
        importPlayersFromCsv(players);

        // Réinitialiser le champ de fichier
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Erreur lors de l'importation du CSV:", error);
        setImportError(
          error instanceof Error
            ? error.message
            : "Erreur lors de l'importation"
        );
      }
    };

    reader.onerror = () => {
      setImportError("Erreur lors de la lecture du fichier");
    };

    reader.readAsText(file);
  };

  // Déclencher le clic sur l'input de fichier
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Fonction pour basculer entre la vue résumée et la vue détaillée
  const toggleView = () => {
    setShowDetailedView(!showDetailedView);
  };

  // Gérer la modification du filtre par nom
  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(e.target.value);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 px-4 sm:px-6 md:px-0">
      {/* Formulaire d'ajout de joueurs avec design amélioré */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-all duration-300">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
            <span>Ajouter des joueurs</span>
            <button
              onClick={() => toggleCollapse("addPlayers")}
              className="ml-auto text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 cursor-pointer"
            >
              {collapsed["addPlayers"] ? (
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
          </h3>
        </div>

        {!collapsed["addPlayers"] && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Note
                </label>
                <select
                  id="rating"
                  value={isNaN(newRating) ? MIN_RATING : newRating}
                  onChange={handleRatingChange}
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300 cursor-pointer"
                >
                  {ratingOptions.map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="count"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Quantité
                </label>
                <input
                  id="count"
                  type="text"
                  value={isNaN(newCount) ? "" : newCount}
                  onChange={handleCountChange}
                  className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 transition-colors duration-300"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleAddPlayers}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={handleAddPlayers}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-center cursor-pointer"
              >
                <span className="mr-1">+</span>1 joueur
              </button>
              <button
                onClick={handleAddFivePlayers}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-center cursor-pointer"
              >
                <span className="mr-1">+</span>5 joueurs
              </button>
              <button
                onClick={handleAddTenPlayers}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 flex items-center justify-center cursor-pointer"
              >
                <span className="mr-1">+</span>10 joueurs
              </button>
            </div>

            <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Importer des joueurs depuis un CSV
              </h4>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center flex-wrap">
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleCsvImport}
                    className="hidden"
                  />
                  <button
                    onClick={triggerFileInput}
                    className="flex items-center text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-2 px-4 rounded-md transition-colors cursor-pointer shadow-sm hover:shadow"
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Choisir un fichier CSV
                  </button>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    Format requis: CSV avec colonnes &quot;Nom&quot; et
                    &quot;Note&quot;
                  </span>
                </div>
                {importError && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
                    {importError}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résumé de l'inventaire avec design amélioré */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-all duration-300">
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
            <span>Mon inventaire</span>
            <span className="ml-2 px-2 py-0.5 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
              {totalPlayers} joueurs
            </span>
            <button
              onClick={toggleView}
              className="ml-3 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
            >
              {showDetailedView ? "Vue résumée" : "Vue détaillée"}
            </button>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetInventory}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => toggleCollapse("inventory")}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 cursor-pointer"
            >
              {collapsed["inventory"] ? (
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

        {!collapsed["inventory"] && (
          <>
            {players.length > 0 ? (
              <div>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary transition-colors input-with-icon-left"
                      placeholder={
                        showDetailedView
                          ? "Filtrer par nom ou note..."
                          : "Filtrer par note..."
                      }
                      value={showDetailedView ? filterName : filterRating}
                      onChange={
                        showDetailedView
                          ? handleNameFilterChange
                          : handleFilterChange
                      }
                    />
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {showDetailedView ? (
                    // Vue détaillée des joueurs
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Nom
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Note
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedPlayers.length > 0 ? (
                              sortedPlayers.map((player) => (
                                <tr
                                  key={player.id}
                                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    player.excluded
                                      ? "bg-red-50 dark:bg-red-900/20"
                                      : ""
                                  }`}
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {player.nom}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        player.note >= 90
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                          : player.note >= 85
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                      }`}
                                    >
                                      {player.note}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                      <button
                                        onClick={() =>
                                          togglePlayerExclusion(player.id)
                                        }
                                        className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                                          player.excluded
                                            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                        }`}
                                      >
                                        {player.excluded
                                          ? "Inclure dans SBC"
                                          : "Exclure du SBC"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                                >
                                  Aucun joueur trouvé avec ces critères de
                                  recherche
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    // Vue résumée par rating
                    <>
                      {highRatings.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400">
                            Notes élevées (90+)
                          </h4>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
                        {highRatings.map(({ rating, count }) => (
                          <div
                            key={rating}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-primary dark:text-primary-light">
                                {rating}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                OVR
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {count}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                joueurs
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleRemovePlayers(rating)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer un joueur"
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
                                    d="M18 12H6"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAllWithRating(rating)
                                }
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer tous les joueurs"
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
                            </div>
                          </div>
                        ))}
                      </div>

                      {mediumRatings.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400">
                            Notes moyennes (85-89)
                          </h4>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
                        {mediumRatings.map(({ rating, count }) => (
                          <div
                            key={rating}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-secondary dark:text-secondary-light">
                                {rating}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                OVR
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {count}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                joueurs
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleRemovePlayers(rating)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer un joueur"
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
                                    d="M18 12H6"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAllWithRating(rating)
                                }
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer tous les joueurs"
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
                            </div>
                          </div>
                        ))}
                      </div>

                      {lowRatings.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400">
                            Notes basses (&lt; 85)
                          </h4>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4">
                        {lowRatings.map(({ rating, count }) => (
                          <div
                            key={rating}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-gray-600 dark:text-gray-400">
                                {rating}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                OVR
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {count}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                joueurs
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleRemovePlayers(rating)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer un joueur"
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
                                    d="M18 12H6"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAllWithRating(rating)
                                }
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                                title="Retirer tous les joueurs"
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 transition-colors duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Votre inventaire est vide
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                  Ajoutez des joueurs pour commencer à simuler des SBC
                </p>
                <button
                  onClick={() => {
                    toggleCollapse("inventory");
                    toggleCollapse("addPlayers");
                  }}
                  className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors cursor-pointer"
                >
                  Ajouter des joueurs
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerInventory;
