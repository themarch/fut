"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  simulateSbcCompletion,
  findOptimalCombinations,
} from "../utils/ratingCalculator";

// Définir les types pour notre contexte
interface PlayerInventory {
  [rating: string]: number;
}

// Interface pour représenter un joueur
interface Player {
  id: string; // Identifiant unique pour le joueur
  nom: string;
  note: number;
  excluded: boolean; // Indique si le joueur est exclu des SBC
}

// Interface pour représenter une exigence d'équipe dans un SBC
interface TeamRequirement {
  rating: number;
  count: number;
}

// Interface SBC mis à jour pour supporter plusieurs équipes avec différentes notes
interface SbcRequirement {
  name: string;
  teams: TeamRequirement[];
  isComplex: boolean; // Indique si le SBC a des exigences complexes (plusieurs équipes à différentes notes)
}

// Interface pour les SBCs simples (pour la rétrocompatibilité)
interface SimpleSbcRequirement {
  name: string;
  requiredRating: number;
  numSquads: number;
}

interface SimulationResult {
  possible: boolean;
  squads: number[][];
  remainingPlayers: PlayerInventory;
  completedTeams: number; // Nombre d'équipes complétées avec succès
  totalTeams: number; // Nombre total d'équipes requises
}

interface SbcContextType {
  // Inventaire des joueurs
  inventory: PlayerInventory;
  // Liste des joueurs détaillée
  players: Player[];
  // Ajouter des joueurs à l'inventaire
  addPlayers: (rating: number, count: number) => void;
  // Supprimer des joueurs de l'inventaire
  removePlayers: (rating: number, count: number) => void;
  // Réinitialiser l'inventaire
  resetInventory: () => void;
  // Importer des joueurs depuis un fichier CSV
  importPlayersFromCsv: (players: { nom: string; note: number }[]) => void;
  // Exclure/Inclure un joueur des SBC
  togglePlayerExclusion: (playerId: string) => void;
  // SBCs prédéfinis
  predefinedSbcs: SbcRequirement[];
  // SBC personnalisé
  customSbc: SbcRequirement;
  // Mettre à jour le SBC personnalisé
  updateCustomSbc: (
    sbc: Partial<SbcRequirement> | Partial<SimpleSbcRequirement>
  ) => void;
  // Résultat de la simulation
  simulationResult: SimulationResult | null;
  // Lancer une simulation
  runSimulation: (sbc: SbcRequirement, algorithm?: string) => void;
  // Ajouter une équipe au SBC personnalisé
  addTeamToCustomSbc: (rating: number, count: number) => void;
  // Supprimer une équipe du SBC personnalisé
  removeTeamFromCustomSbc: (index: number) => void;
  // Mettre à jour une équipe du SBC personnalisé
  updateTeamInCustomSbc: (index: number, rating: number, count: number) => void;
  // Passer du mode simple au mode complexe pour le SBC personnalisé
  toggleCustomSbcMode: () => void;
  // Ajouter le SBC personnalisé à la liste des SBCs prédéfinis
  addCustomSbcToPredefined: (sbc: SbcRequirement) => void;
  // Supprimer un SBC prédéfini
  removePredefinedSbc: (index: number) => void;
  // Modifier un SBC prédéfini
  editPredefinedSbc: (index: number, sbc: SbcRequirement) => void;
}

// Valeurs par défaut pour le contexte
const defaultContext: SbcContextType = {
  inventory: {},
  players: [],
  addPlayers: () => {},
  removePlayers: () => {},
  resetInventory: () => {},
  importPlayersFromCsv: () => {},
  togglePlayerExclusion: () => {},
  predefinedSbcs: [
    {
      name: "Gullit Icon Prime",
      isComplex: true,
      teams: [
        { rating: 91, count: 5 },
        { rating: 90, count: 6 },
        { rating: 89, count: 5 },
      ],
    },
    {
      name: "Ronaldo Icon Prime",
      isComplex: true,
      teams: [
        { rating: 91, count: 3 },
        { rating: 90, count: 4 },
        { rating: 89, count: 4 },
        { rating: 88, count: 3 },
      ],
    },
    {
      name: "Mid-Icon",
      isComplex: false,
      teams: [{ rating: 87, count: 3 }],
    },
    {
      name: "Base Icon",
      isComplex: false,
      teams: [{ rating: 85, count: 2 }],
    },
  ],
  customSbc: {
    name: "Personnalisé",
    isComplex: false,
    teams: [{ rating: 86, count: 1 }],
  },
  updateCustomSbc: () => {},
  simulationResult: null,
  runSimulation: () => {},
  addTeamToCustomSbc: () => {},
  removeTeamFromCustomSbc: () => {},
  updateTeamInCustomSbc: () => {},
  toggleCustomSbcMode: () => {},
  addCustomSbcToPredefined: () => {},
  removePredefinedSbc: () => {},
  editPredefinedSbc: () => {},
};

// Clé pour stocker l'inventaire dans localStorage
const INVENTORY_STORAGE_KEY = "fifa-sbc-inventory";
const CUSTOM_SBC_STORAGE_KEY = "fifa-sbc-custom";
// Clé pour stocker les joueurs dans localStorage
const PLAYERS_STORAGE_KEY = "fifa-sbc-players";
// Clé pour stocker les SBCs prédéfinis
const PREDEFINED_SBCS_STORAGE_KEY = "fifa-sbc-predefined";

// Constantes pour les notes de joueurs
const MIN_RATING = 75;
const MAX_RATING = 99;

// Fonction pour récupérer l'inventaire depuis localStorage
const getStoredInventory = (): PlayerInventory => {
  if (typeof window === "undefined") return {};

  try {
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return storedInventory ? JSON.parse(storedInventory) : {};
  } catch (error) {
    console.error("Erreur lors de la récupération de l'inventaire:", error);
    return {};
  }
};

// Fonction pour récupérer les joueurs depuis localStorage
const getStoredPlayers = (): Player[] => {
  if (typeof window === "undefined") return [];

  try {
    const storedPlayers = localStorage.getItem(PLAYERS_STORAGE_KEY);
    return storedPlayers ? JSON.parse(storedPlayers) : [];
  } catch (error) {
    console.error("Erreur lors de la récupération des joueurs:", error);
    return [];
  }
};

// Fonction pour récupérer les SBCs prédéfinis depuis localStorage
const getStoredPredefinedSbcs = (): SbcRequirement[] => {
  if (typeof window === "undefined") return defaultContext.predefinedSbcs;

  try {
    const storedSbcs = localStorage.getItem(PREDEFINED_SBCS_STORAGE_KEY);
    if (storedSbcs) {
      const parsed = JSON.parse(storedSbcs);
      // Vérifier que nous avons un tableau valide
      if (Array.isArray(parsed)) {
        // Fusionner avec les 4 SBCs par défaut pour garantir qu'ils sont toujours présents
        const defaultSbcs = defaultContext.predefinedSbcs.slice(0, 4);

        // Garder uniquement les SBCs personnalisés (ceux après les 4 premiers)
        const customSbcs = parsed.slice(4);

        return [...defaultSbcs, ...customSbcs];
      }
    }
    return defaultContext.predefinedSbcs;
  } catch (error) {
    console.error("Erreur lors de la récupération des SBCs prédéfinis:", error);
    return defaultContext.predefinedSbcs;
  }
};

// Fonction pour récupérer le SBC personnalisé depuis localStorage
const getStoredCustomSbc = (): SbcRequirement => {
  if (typeof window === "undefined") return defaultContext.customSbc;

  try {
    const storedCustomSbc = localStorage.getItem(CUSTOM_SBC_STORAGE_KEY);
    if (storedCustomSbc) {
      const parsed = JSON.parse(storedCustomSbc);

      // Conversion du format ancien (simple) vers le nouveau format si nécessaire
      if ("requiredRating" in parsed && "numSquads" in parsed) {
        return {
          name: parsed.name || "Personnalisé",
          isComplex: false,
          teams: [
            {
              rating: parsed.requiredRating || 86,
              count: parsed.numSquads || 1,
            },
          ],
        };
      }

      return parsed;
    }
    return defaultContext.customSbc;
  } catch (error) {
    console.error("Erreur lors de la récupération du SBC personnalisé:", error);
    return defaultContext.customSbc;
  }
};

// Créer le contexte
const SbcContext = createContext<SbcContextType>(defaultContext);

// Hook personnalisé pour utiliser le contexte
export const useSbc = () => useContext(SbcContext);

// Provider du contexte
export const SbcProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [inventory, setInventory] = useState<PlayerInventory>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [customSbc, setCustomSbc] = useState<SbcRequirement>(
    defaultContext.customSbc
  );
  const [simulationResult, setSimulationResult] =
    useState<SimulationResult | null>(null);
  const [predefinedSbcs, setPredefinedSbcs] = useState<SbcRequirement[]>(
    defaultContext.predefinedSbcs
  );

  // Charger l'inventaire, les joueurs et le SBC personnalisé depuis localStorage au chargement
  useEffect(() => {
    const storedInventory = getStoredInventory();
    const storedPlayers = getStoredPlayers();
    const storedCustomSbc = getStoredCustomSbc();
    const storedPredefinedSbcs = getStoredPredefinedSbcs();

    setInventory(storedInventory);
    setPlayers(storedPlayers);
    setCustomSbc(storedCustomSbc);
    setPredefinedSbcs(storedPredefinedSbcs);
  }, []);

  // Mettre à jour localStorage quand les joueurs changent
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(players));
    }
  }, [players]);

  // Mettre à jour localStorage quand l'inventaire change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    }
  }, [inventory]);

  // Mettre à jour localStorage quand le SBC personnalisé change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOM_SBC_STORAGE_KEY, JSON.stringify(customSbc));
    }
  }, [customSbc]);

  // Mettre à jour l'inventaire en fonction de la liste des joueurs
  const updateInventoryFromPlayers = (playersList: Player[]) => {
    const newInventory: PlayerInventory = {};

    // On compte uniquement les joueurs non exclus
    playersList.forEach((player) => {
      if (!player.excluded) {
        const key = player.note.toString();
        newInventory[key] = (newInventory[key] || 0) + 1;
      }
    });

    setInventory(newInventory);
  };

  // Ajouter des joueurs manuellement à l'inventaire
  const addPlayers = (rating: number, count: number) => {
    // Valider les inputs
    if (isNaN(rating) || isNaN(count) || count <= 0) {
      return; // Ne rien faire si les valeurs sont invalides
    }

    // Ajouter les joueurs à la liste des joueurs
    const newPlayers = [...players];
    for (let i = 0; i < count; i++) {
      newPlayers.push({
        id: `manual-${rating}-${Date.now()}-${i}`,
        nom: `Joueur ${rating}`,
        note: rating,
        excluded: false,
      });
    }

    setPlayers(newPlayers);

    // Mettre à jour l'inventaire
    setInventory((prev) => {
      const key = rating.toString();
      const currentCount = prev[key] || 0;
      return {
        ...prev,
        [key]: currentCount + count,
      };
    });
  };

  // Supprimer des joueurs de l'inventaire
  const removePlayers = (rating: number, count: number) => {
    // Valider les inputs
    if (isNaN(rating) || isNaN(count) || count <= 0) {
      return; // Ne rien faire si les valeurs sont invalides
    }

    // Trouver les joueurs à supprimer
    const playersWithRating = players.filter(
      (p) => p.note === rating && !p.excluded
    );

    // Si pas assez de joueurs, on supprime ce qu'on peut
    const countToRemove = Math.min(count, playersWithRating.length);

    if (countToRemove === 0) return;

    // Créer un ensemble d'IDs de joueurs à supprimer
    const playerIdsToRemove = new Set(
      playersWithRating.slice(0, countToRemove).map((p) => p.id)
    );

    // Filtrer les joueurs pour enlever ceux qu'on veut supprimer
    const newPlayers = players.filter((p) => !playerIdsToRemove.has(p.id));

    setPlayers(newPlayers);

    // Mettre à jour l'inventaire
    setInventory((prev) => {
      const key = rating.toString();
      const currentCount = prev[key] || 0;
      // Éviter les nombres négatifs
      const newCount = Math.max(0, currentCount - countToRemove);

      // Si la nouvelle quantité est 0, on peut supprimer la clé
      if (newCount === 0) {
        const newInventory = Object.fromEntries(
          Object.entries(prev).filter(([k]) => k !== key)
        );
        return newInventory;
      }

      return {
        ...prev,
        [key]: newCount,
      };
    });
  };

  // Réinitialiser l'inventaire
  const resetInventory = () => {
    setInventory({});
    setPlayers([]);
    setSimulationResult(null);
  };

  // Importer des joueurs depuis un fichier CSV
  const importPlayersFromCsv = (
    importedPlayers: { nom: string; note: number }[]
  ) => {
    // Créer de nouveaux joueurs à partir des données CSV
    const newPlayers = [
      ...players,
      ...importedPlayers.map((p) => ({
        id: `import-${p.note}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
        nom: p.nom,
        note: p.note,
        excluded: false,
      })),
    ];

    setPlayers(newPlayers);

    // Mettre à jour l'inventaire
    const newInventory = { ...inventory };

    importedPlayers.forEach((player) => {
      const rating = player.note;
      if (rating >= MIN_RATING && rating <= MAX_RATING) {
        const key = rating.toString();
        newInventory[key] = (newInventory[key] || 0) + 1;
      }
    });

    setInventory(newInventory);
  };

  // Exclure/Inclure un joueur des SBC
  const togglePlayerExclusion = (playerId: string) => {
    const newPlayers = players.map((player) => {
      if (player.id === playerId) {
        return { ...player, excluded: !player.excluded };
      }
      return player;
    });

    setPlayers(newPlayers);

    // Mettre à jour l'inventaire en fonction des exclusions
    updateInventoryFromPlayers(newPlayers);
  };

  // Mettre à jour le SBC personnalisé
  const updateCustomSbc = (
    sbc: Partial<SbcRequirement> | Partial<SimpleSbcRequirement>
  ) => {
    setCustomSbc((prev) => {
      // Si c'est un SBC simple (ancien format)
      if ("requiredRating" in sbc || "numSquads" in sbc) {
        const simpleSbc = sbc as Partial<SimpleSbcRequirement>;
        // Mettre à jour uniquement la première équipe
        const updatedTeams = [...prev.teams];

        if (updatedTeams.length === 0) {
          updatedTeams.push({ rating: 86, count: 1 });
        }

        if (simpleSbc.requiredRating !== undefined) {
          updatedTeams[0].rating = isNaN(simpleSbc.requiredRating)
            ? 86
            : simpleSbc.requiredRating;
        }

        if (simpleSbc.numSquads !== undefined) {
          updatedTeams[0].count = isNaN(simpleSbc.numSquads)
            ? 1
            : simpleSbc.numSquads;
        }

        return {
          ...prev,
          name: simpleSbc.name || prev.name,
          teams: updatedTeams,
        };
      }

      // Si c'est un SBC au nouveau format
      return { ...prev, ...sbc };
    });
  };

  // Ajouter une équipe au SBC personnalisé
  const addTeamToCustomSbc = (rating: number, count: number) => {
    if (isNaN(rating) || isNaN(count) || count <= 0) {
      return;
    }

    setCustomSbc((prev) => {
      return {
        ...prev,
        teams: [...prev.teams, { rating, count }],
      };
    });
  };

  // Supprimer une équipe du SBC personnalisé
  const removeTeamFromCustomSbc = (index: number) => {
    setCustomSbc((prev) => {
      if (prev.teams.length <= 1) {
        // Ne pas supprimer la dernière équipe
        return prev;
      }

      const newTeams = [...prev.teams];
      newTeams.splice(index, 1);

      return {
        ...prev,
        teams: newTeams,
      };
    });
  };

  // Mettre à jour une équipe du SBC personnalisé
  const updateTeamInCustomSbc = (
    index: number,
    rating: number,
    count: number
  ) => {
    if (isNaN(rating) || isNaN(count) || count <= 0) {
      return;
    }

    setCustomSbc((prev) => {
      if (index < 0 || index >= prev.teams.length) {
        return prev;
      }

      const newTeams = [...prev.teams];
      newTeams[index] = { rating, count };

      return {
        ...prev,
        teams: newTeams,
      };
    });
  };

  // Basculer entre le mode simple et complexe pour le SBC personnalisé
  const toggleCustomSbcMode = () => {
    setCustomSbc((prev) => {
      return {
        ...prev,
        isComplex: !prev.isComplex,
      };
    });
  };

  // Lancer une simulation pour un SBC
  const runSimulation = (
    sbc: SbcRequirement,
    algorithm: string = "standard"
  ) => {
    const allSquads: number[][] = [];
    let isSuccessful = true;
    let currentInventory = { ...inventory };
    let totalTeams = 0;

    // Calculer le nombre total d'équipes
    sbc.teams.forEach((team) => {
      totalTeams += team.count;
    });

    // Simuler chaque type d'équipe
    for (const teamReq of sbc.teams) {
      // Simuler chaque équipe de ce type
      for (let i = 0; i < teamReq.count; i++) {
        // Simulation d'une équipe selon l'algorithme sélectionné
        let result;

        switch (algorithm) {
          case "economic":
            // Utiliser l'algorithme économe
            const economicResult = findOptimalCombinations(
              currentInventory,
              teamReq.rating,
              1
            );
            // Adapter le format de retour
            result = {
              possible: economicResult.success,
              squads: economicResult.teams,
              remainingPlayers: economicResult.remainingPlayers,
            };
            break;
          case "ultra_economic":
            // Utiliser l'algorithme ultra économe - préférer les cartes de faible valeur
            // et optimiser au maximum l'utilisation des ressources
            const ultraResult = simulateSbcCompletion(
              currentInventory,
              teamReq.rating,
              1
            );

            // Double optimisation en utilisant des joueurs de plus faible valeur
            if (ultraResult.possible) {
              // Si une équipe a été formée, essayer de la réoptimiser
              result = {
                possible: ultraResult.possible,
                squads: ultraResult.squads.map((squad) => {
                  // Trier les joueurs par valeur croissante pour l'équipe
                  const sortedSquad = [...squad].sort((a, b) => a - b);
                  return sortedSquad;
                }),
                remainingPlayers: ultraResult.remainingPlayers,
              };
            } else {
              result = ultraResult;
            }
            break;
          case "standard":
          default:
            // Algorithme standard
            result = simulateSbcCompletion(currentInventory, teamReq.rating, 1);
            break;
        }

        if (result.possible) {
          // Ajouter l'équipe aux résultats
          allSquads.push(...result.squads);
          // Mettre à jour l'inventaire pour la prochaine simulation
          currentInventory = result.remainingPlayers;
        } else {
          // Si une équipe ne peut pas être complétée, marquer l'échec
          isSuccessful = false;
          break;
        }
      }

      // Si une équipe a échoué, sortir de la boucle
      if (!isSuccessful) {
        break;
      }
    }

    // Créer le résultat final
    setSimulationResult({
      possible: isSuccessful,
      squads: allSquads,
      remainingPlayers: currentInventory,
      completedTeams: allSquads.length,
      totalTeams,
    });
  };

  // Function to add custom SBC to predefined SBCs
  const addCustomSbcToPredefined = (sbc: SbcRequirement) => {
    // Only add if the SBC has a name and valid teams
    if (
      sbc.name &&
      sbc.teams.length > 0 &&
      sbc.teams.every((team) => team.rating > 0 && team.count > 0)
    ) {
      // Add a copy of the SBC to the predefined list
      setPredefinedSbcs((prevSbcs) => {
        const newSbcs = [
          ...prevSbcs,
          { ...sbc, name: sbc.name || "Personnalisé" },
        ];

        // Sauvegarder dans localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            PREDEFINED_SBCS_STORAGE_KEY,
            JSON.stringify(newSbcs)
          );
        }

        return newSbcs;
      });
    }
  };

  // Fonction pour supprimer un SBC prédéfini
  const removePredefinedSbc = (index: number) => {
    setPredefinedSbcs((prevSbcs) => {
      // Ne pas permettre de supprimer les 4 premiers SBC par défaut (Gullit, Ronaldo, Mid-Icon, Base Icon)
      if (index < 4) {
        // Afficher un message d'erreur
        console.warn("Impossible de supprimer un SBC par défaut");
        return prevSbcs;
      }

      // Créer une nouvelle copie du tableau pour déclencher un re-render
      const newSbcs = [...prevSbcs];
      // Supprimer l'élément à l'index spécifié
      newSbcs.splice(index, 1);

      // Sauvegarder la liste mise à jour dans localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          PREDEFINED_SBCS_STORAGE_KEY,
          JSON.stringify(newSbcs)
        );
      }

      return newSbcs;
    });
  };

  // Fonction pour modifier un SBC prédéfini
  const editPredefinedSbc = (index: number, sbc: SbcRequirement) => {
    setPredefinedSbcs((prevSbcs) => {
      const newSbcs = [...prevSbcs];
      newSbcs[index] = { ...sbc };

      // Sauvegarder la liste mise à jour dans localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          PREDEFINED_SBCS_STORAGE_KEY,
          JSON.stringify(newSbcs)
        );
      }

      return newSbcs;
    });
  };

  // Valeur du contexte
  const value: SbcContextType = {
    inventory,
    players,
    addPlayers,
    removePlayers,
    resetInventory,
    importPlayersFromCsv,
    togglePlayerExclusion,
    predefinedSbcs,
    customSbc,
    updateCustomSbc,
    simulationResult,
    runSimulation,
    addTeamToCustomSbc,
    removeTeamFromCustomSbc,
    updateTeamInCustomSbc,
    toggleCustomSbcMode,
    addCustomSbcToPredefined,
    removePredefinedSbc,
    editPredefinedSbc,
  };

  return <SbcContext.Provider value={value}>{children}</SbcContext.Provider>;
};
