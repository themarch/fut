/**
 * FIFA 25 SBC Rating Calculator
 * Basé sur la formule présente dans le Google Sheets fourni
 * Optimisé pour être économe avec les cartes à disposition
 */

/**
 * Calcule la note globale d'une équipe SBC basée sur les notes individuelles des joueurs
 * Implémentation de la formule FIFA 25
 */
export const calculateTeamRating = (playerRatings: number[]): number => {
  // Une équipe doit contenir exactement 11 joueurs
  if (playerRatings.length !== 11) {
    throw new Error("Une équipe doit contenir exactement 11 joueurs");
  }

  // Calcul de la somme des notes
  const sum = playerRatings.reduce((acc, rating) => acc + rating, 0);

  // Calcul de la moyenne
  const average = sum / 11;

  // Calcul des valeurs au-dessus de la moyenne pour chaque joueur
  const aboveAvgValues = playerRatings.map((rating) =>
    Math.max(0, rating - average)
  );

  // Somme des valeurs au-dessus de la moyenne
  const aboveAvgSum = aboveAvgValues.reduce((acc, val) => acc + val, 0);

  // Calcul de la note combinée selon la formule
  const combined = sum + aboveAvgSum;

  // Arrondi à l'entier inférieur pour obtenir la note finale
  return Math.floor(combined / 11);
};

/**
 * Cache pour les calculs de combinaisons déjà effectués
 * Clé: chaîne représentant les ratings disponibles + rating cible
 * Valeur: meilleure combinaison trouvée
 */
const combinationsCache: Record<string, number[] | null> = {};

/**
 * Vérifie si un ensemble de joueurs peut satisfaire les exigences d'un SBC
 */
export const canCompleteSbc = (
  availablePlayers: Record<string, number>,
  requiredRating: number,
  numSquads: number
): boolean => {
  // Conversion de l'inventaire en liste de notes
  const availableRatings: number[] = [];

  Object.entries(availablePlayers).forEach(([rating, count]) => {
    const ratingNum = parseInt(rating, 10);
    for (let i = 0; i < count; i++) {
      availableRatings.push(ratingNum);
    }
  });

  // Vérification du nombre minimum de joueurs requis
  if (availableRatings.length < numSquads * 11) {
    return false;
  }

  // Tentative de formation des équipes requises
  const { success } = formOptimalSquads(
    availableRatings,
    requiredRating,
    numSquads
  );

  return success;
};

/**
 * Regroupe les ratings par valeur pour optimiser la recherche
 */
const groupRatingsByValue = (ratings: number[]): Array<[number, number]> => {
  const groups: Array<[number, number]> = [];
  const countMap: Record<string, number> = {};

  // Compte les occurrences de chaque rating
  ratings.forEach((rating) => {
    const key = rating.toString();
    countMap[key] = (countMap[key] || 0) + 1;
  });

  // Convertit en groupes [rating, count]
  Object.entries(countMap).forEach(([rating, count]) => {
    groups.push([parseInt(rating, 10), count]);
  });

  return groups;
};

/**
 * Simule la complétion d'un SBC et renvoie les équipes optimales
 */
export const simulateSbcCompletion = (
  availablePlayers: Record<string, number>,
  requiredRating: number,
  numSquads: number
): {
  possible: boolean;
  squads: number[][];
  remainingPlayers: Record<string, number>;
} => {
  // Conversion de l'inventaire en liste de notes
  const availableRatings: number[] = [];

  Object.entries(availablePlayers).forEach(([rating, count]) => {
    const ratingNum = parseInt(rating, 10);
    for (let i = 0; i < count; i++) {
      availableRatings.push(ratingNum);
    }
  });

  // Vérification du nombre minimum de joueurs requis
  if (availableRatings.length < numSquads * 11) {
    return {
      possible: false,
      squads: [],
      remainingPlayers: { ...availablePlayers },
    };
  }

  // Formation des équipes optimales
  const { success, teams, remainingRatings } = formOptimalSquads(
    availableRatings,
    requiredRating,
    numSquads
  );

  // Conversion des ratings restants en format inventaire
  const remainingPlayers = convertToInventory(remainingRatings);

  return {
    possible: success,
    squads: teams,
    remainingPlayers,
  };
};

/**
 * Forme les équipes optimales pour un SBC donné
 */
const formOptimalSquads = (
  availableRatings: number[],
  requiredRating: number,
  numSquads: number
): {
  success: boolean;
  teams: number[][];
  remainingRatings: number[];
} => {
  // Tri des ratings disponibles (ordre croissant)
  const sortedRatings = [...availableRatings].sort((a, b) => a - b);

  // Vider le cache pour les nouvelles combinaisons
  Object.keys(combinationsCache).forEach(
    (key) => delete combinationsCache[key]
  );

  const teams: number[][] = [];
  const remainingRatings = [...sortedRatings];

  // Essai de formation d'équipes économiques
  for (let i = 0; i < numSquads; i++) {
    // Si nous n'avons plus assez de joueurs, impossible de continuer
    if (remainingRatings.length < 11) {
      return {
        success: false,
        teams,
        remainingRatings,
      };
    }

    // Recherche de la combinaison optimale pour atteindre la note requise
    const team = findMostEconomicalTeam(remainingRatings, requiredRating);

    if (!team) {
      // Si on ne peut pas former une équipe valide, c'est un échec
      return {
        success: false,
        teams,
        remainingRatings,
      };
    }

    // Ajout de l'équipe formée
    teams.push(team);

    // Retrait des joueurs utilisés
    team.forEach((rating) => {
      const index = remainingRatings.indexOf(rating);
      if (index !== -1) {
        remainingRatings.splice(index, 1);
      }
    });
  }

  return {
    success: true,
    teams,
    remainingRatings,
  };
};

/**
 * Trouve la combinaison de joueurs la plus économique pour atteindre une note cible
 */
const findMostEconomicalTeam = (
  availableRatings: number[],
  targetRating: number
): number[] | null => {
  // S'il n'y a pas assez de joueurs, impossible de former une équipe
  if (availableRatings.length < 11) {
    return null;
  }

  // Clé pour le cache
  const cacheKey = `${availableRatings.join(",")}_${targetRating}`;

  // Vérifier si on a déjà calculé cette combinaison
  if (combinationsCache[cacheKey]) {
    return combinationsCache[cacheKey];
  }

  // Grouper les joueurs par note pour éviter les calculs redondants
  const ratingsGrouped = groupRatingsByValue(availableRatings);

  // Utilisation d'une approche récursive avec mémoisation pour trouver la meilleure combinaison
  const result = findBestCombination(ratingsGrouped, targetRating, 11);

  // Stocker dans le cache
  combinationsCache[cacheKey] = result;

  return result;
};

/**
 * Trouve la meilleure combinaison de joueurs pour atteindre une note cible
 * en étant le plus économique possible
 */
const findBestCombination = (
  ratingGroups: Array<[number, number]>,
  targetRating: number,
  playersNeeded: number,
  currentTeam: number[] = [],
  memo: Map<string, number[] | null> = new Map()
): number[] | null => {
  // Si on a déjà 11 joueurs, on vérifie la note
  if (playersNeeded === 0) {
    const rating = calculateTeamRating(currentTeam);
    return rating >= targetRating ? currentTeam : null;
  }

  // Si on n'a plus de groupes disponibles, impossible de continuer
  if (ratingGroups.length === 0) {
    return null;
  }

  // Clé pour la mémoisation
  const memoKey = `${ratingGroups
    .map(([r, c]) => `${r}_${c}`)
    .join("|")}_${playersNeeded}_${currentTeam.join(".")}`;
  if (memo.has(memoKey)) {
    return memo.get(memoKey) || null;
  }

  // Calcul de la note actuelle (si applicable)
  const currentRating =
    currentTeam.length === 11 ? calculateTeamRating(currentTeam) : 0;

  // Si on a déjà atteint la note cible avec 11 joueurs, c'est parfait
  if (currentTeam.length === 11 && currentRating >= targetRating) {
    return currentTeam;
  }

  // Calculer la note minimale possible pour les joueurs restants
  let bestTeam: number[] | null = null;
  let bestValue = Infinity; // Pour évaluer l'économie de la solution

  // Essai avec le groupe actuel
  const [rating, count] = ratingGroups[0];
  const remainingGroups =
    count > 1
      ? [[rating, count - 1] as [number, number], ...ratingGroups.slice(1)]
      : ratingGroups.slice(1);

  // Essai en utilisant une carte de ce groupe
  const teamWithCard = [...currentTeam, rating];
  const resultWithCard = findBestCombination(
    remainingGroups,
    targetRating,
    playersNeeded - 1,
    teamWithCard,
    memo
  );

  // Si on a trouvé une solution, on calcule sa valeur (coût des cartes)
  if (resultWithCard) {
    const teamValue = resultWithCard.reduce((sum, r) => sum + r, 0);
    if (teamValue < bestValue) {
      bestValue = teamValue;
      bestTeam = resultWithCard;
    }
  }

  // Essai en sautant ce groupe
  const resultWithoutCard = findBestCombination(
    ratingGroups.slice(1),
    targetRating,
    playersNeeded,
    currentTeam,
    memo
  );

  // Si on a trouvé une solution en sautant ce groupe, on compare sa valeur
  if (resultWithoutCard) {
    const teamValue = resultWithoutCard.reduce((sum, r) => sum + r, 0);
    if (teamValue < bestValue) {
      bestValue = teamValue;
      bestTeam = resultWithoutCard;
    }
  }

  // Mémorisation du résultat
  memo.set(memoKey, bestTeam);

  return bestTeam;
};

/**
 * Algorithme alternatif pour trouver une équipe économique
 * Utilise une approche plus directe en combinant des cartes basses avec des cartes hautes
 */
const findEconomicalTeamRating = (
  availableRatings: number[],
  targetRating: number
): number[] | null => {
  // S'il n'y a pas assez de joueurs, impossible de former une équipe
  if (availableRatings.length < 11) {
    return null;
  }

  // Tri des ratings (croissant)
  const sortedRatings = [...availableRatings].sort((a, b) => a - b);

  // Sélection initiale: les cartes les plus basses
  const selectedTeam = sortedRatings.slice(0, 11);
  let currentRating = calculateTeamRating(selectedTeam);

  // Si la note est déjà suffisante, on a notre équipe
  if (currentRating >= targetRating) {
    return selectedTeam;
  }

  // Sinon, on remplace progressivement les cartes basses par des cartes plus hautes
  // jusqu'à atteindre la note cible
  let lowIndex = 0; // Index de la carte la plus basse dans l'équipe
  let highIndex = 11; // Index de la carte la plus haute non utilisée

  while (currentRating < targetRating && highIndex < sortedRatings.length) {
    // Remplacement de la carte la plus basse par la prochaine carte disponible
    selectedTeam[lowIndex] = sortedRatings[highIndex];

    // Recalcul de la note
    currentRating = calculateTeamRating(selectedTeam);

    // Avancer aux prochaines cartes
    lowIndex = (lowIndex + 1) % 11;
    highIndex++;

    // Tri pour s'assurer que nous remplaçons toujours la carte la plus basse
    selectedTeam.sort((a, b) => a - b);
  }

  // Si on n'a pas pu atteindre la note requise, échec
  if (currentRating < targetRating) {
    return null;
  }

  // Optimisation finale: essayer de remplacer des cartes hautes par des cartes plus basses
  // tout en maintenant la note cible
  for (let i = 10; i >= 0; i--) {
    const originalCard = selectedTeam[i];

    // Parcourir les cartes disponibles non utilisées
    for (const rating of sortedRatings) {
      if (
        rating < originalCard &&
        !selectedTeam.includes(rating) &&
        rating !== 0 // Ignorer les slots vides (brick slots)
      ) {
        // Tester temporairement avec cette carte
        selectedTeam[i] = rating;
        const testRating = calculateTeamRating(selectedTeam);

        // Si la note reste suffisante, on garde cette carte plus basse
        if (testRating >= targetRating) {
          break;
        } else {
          // Sinon on remet la carte originale
          selectedTeam[i] = originalCard;
        }
      }
    }
  }

  return selectedTeam;
};

/**
 * Convertit une liste de notes en format inventaire
 */
const convertToInventory = (ratings: number[]): Record<string, number> => {
  const inventory: Record<string, number> = {};

  for (const rating of ratings) {
    const key = rating.toString();
    if (!inventory[key]) {
      inventory[key] = 0;
    }
    inventory[key]++;
  }

  return inventory;
};

/**
 * Fonction d'extension pour la recherche des combinaisons optimales
 * Essaie de minimiser au maximum l'utilisation des cartes à forte valeur
 */
export const findOptimalCombinations = (
  availablePlayers: Record<string, number>,
  requiredRating: number,
  numTeams: number
): {
  success: boolean;
  teams: number[][];
  remainingPlayers: Record<string, number>;
} => {
  // On commence par la simulation standard
  const result = simulateSbcCompletion(
    availablePlayers,
    requiredRating,
    numTeams
  );

  // Si ce n'est pas possible, on renvoie directement le résultat
  if (!result.possible) {
    return {
      success: false,
      teams: result.squads,
      remainingPlayers: result.remainingPlayers,
    };
  }

  // Sinon, on essaie d'optimiser davantage chaque équipe
  const optimizedTeams: number[][] = [];

  // Pour chaque équipe formée, on essaie de l'optimiser davantage
  for (const team of result.squads) {
    // On réintroduit temporairement ces joueurs dans l'inventaire
    const tempInventory: Record<string, number> = {
      ...result.remainingPlayers,
    };
    for (const rating of team) {
      const key = rating.toString();
      tempInventory[key] = (tempInventory[key] || 0) + 1;
    }

    // On convertit l'inventaire en liste
    const tempRatings: number[] = [];
    Object.entries(tempInventory).forEach(([rating, count]) => {
      const ratingNum = parseInt(rating, 10);
      for (let i = 0; i < count; i++) {
        tempRatings.push(ratingNum);
      }
    });

    // On cherche une équipe encore plus économique
    const optimizedTeam = findEconomicalTeamRating(tempRatings, requiredRating);

    if (optimizedTeam) {
      optimizedTeams.push(optimizedTeam);

      // On met à jour l'inventaire en retirant les joueurs utilisés
      for (const rating of optimizedTeam) {
        const key = rating.toString();
        result.remainingPlayers[key] = (result.remainingPlayers[key] || 0) - 1;
        if (result.remainingPlayers[key] <= 0) {
          delete result.remainingPlayers[key];
        }
      }
    } else {
      // Si l'optimisation échoue, on garde l'équipe originale
      optimizedTeams.push(team);
    }
  }

  return {
    success: true,
    teams: optimizedTeams,
    remainingPlayers: result.remainingPlayers,
  };
};
