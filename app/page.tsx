"use client";

import PlayerInventory from "./components/PlayerInventory";
import SbcSimulator from "./components/SbcSimulator";
import { SbcProvider } from "./context/SbcContext";
import SbcResults from "./components/sbc/SbcResults";
import { useSbc } from "./context/SbcContext";
import { useRef, useEffect, useState } from "react";

// Type pour le SBC
interface SbcType {
  name: string;
  isComplex: boolean;
  teams: { rating: number; count: number }[];
}

// Create a wrapper component to use hooks
function HomeContent() {
  const { simulationResult } = useSbc();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [lastSimulatedSbc, setLastSimulatedSbc] = useState<SbcType | null>(
    null
  );

  // Effet pour scroller vers les résultats quand ils sont disponibles
  useEffect(() => {
    if (simulationResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Stocker le SBC actuellement simulé s'il n'est pas déjà défini
      if (!lastSimulatedSbc && simulationResult) {
        // Nous utilisons une valeur par défaut au cas où
        setLastSimulatedSbc({
          name: "SBC",
          isComplex: false,
          teams: [{ rating: 85, count: 1 }],
        });
      }
    }
  }, [simulationResult, lastSimulatedSbc]);

  // Fonction pour recevoir le SBC sélectionné de SbcSimulator
  const handleSbcSimulated = (selectedSbc: SbcType) => {
    setLastSimulatedSbc(selectedSbc);
  };

  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-800 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 inline-block">
          FIFA SBC Calculator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Optimisez vos SBC et économisez vos cartes joueurs en simulant les
          meilleures combinaisons possibles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col min-h-[600px] h-fit">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              Inventaire de Joueurs
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Gérez vos joueurs et importez-les depuis un fichier CSV
            </p>
          </div>
          <div className="p-4 flex-grow overflow-y-auto">
            <PlayerInventory />
          </div>
        </div>

        <div className="lg:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col min-h-[600px] h-fit">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Simulateur de SBC</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Configurez et simulez vos SBC
            </p>
          </div>
          <div className="p-4 flex-grow overflow-y-auto">
            <SbcSimulator onSimulate={handleSbcSimulated} />
          </div>
        </div>
      </div>

      {/* Results section - Full width */}
      {simulationResult && (
        <div
          ref={resultsRef}
          className="mt-8 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700"
        >
          <div className="bg-gradient-to-r from-green-500 to-teal-600 dark:from-green-600 dark:to-teal-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              Résultats de la Simulation
            </h2>
            <p className="text-green-100 text-sm mt-1">
              Solutions optimales pour votre SBC
            </p>
          </div>
          <div className="p-4">
            <SbcResults
              simulationResult={simulationResult}
              selectedSbc={
                lastSimulatedSbc || {
                  name: "SBC",
                  teams: [{ rating: 85, count: 1 }],
                  isComplex: false,
                }
              }
              collapsed={{}}
              toggleCollapse={() => {}}
            />
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 pb-8">
        <p>
          &copy; {new Date().getFullYear()} FIFA SBC Calculator - Ce site
          n&apos;est pas affilié à EA Sports
        </p>
      </footer>
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <SbcProvider>
          <HomeContent />
        </SbcProvider>
      </div>
    </main>
  );
}
