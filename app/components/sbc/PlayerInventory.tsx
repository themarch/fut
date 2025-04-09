import React from "react";
import { useSbc } from "../../context/SbcContext";

const PlayerInventory: React.FC = () => {
  const { inventory } = useSbc();

  // Calculer le nombre total de joueurs
  const totalPlayers = Object.values(inventory).reduce(
    (sum, count) => sum + count,
    0
  );

  // Trier les joueurs par note (décroissant)
  const sortedInventory = Object.entries(inventory)
    .map(([rating, count]) => ({ rating: parseInt(rating, 10), count }))
    .sort((a, b) => b.rating - a.rating);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-all duration-300 h-full">
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">
          Inventaire des joueurs
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {totalPlayers} joueurs dans l&apos;inventaire
        </p>
      </div>
      <div className="p-4">
        <div className="mt-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {sortedInventory.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              Aucun joueur dans l&apos;inventaire
            </div>
          ) : (
            <div className="space-y-2">
              {sortedInventory.map((item) => (
                <div
                  key={item.rating}
                  className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary font-semibold">
                      {item.rating}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Note {item.rating}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.count} joueur{item.count > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerInventory;
