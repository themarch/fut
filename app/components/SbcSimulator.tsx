"use client";

import React, { useState } from "react";
import { useSbc } from "../context/SbcContext";
import SbcHeader from "./sbc/SbcHeader";
import SbcSelector from "./sbc/SbcSelector";
import CustomSbcForm from "./sbc/CustomSbcForm";

// Type pour le SBC
interface SbcType {
  name: string;
  isComplex: boolean;
  teams: { rating: number; count: number }[];
}

interface SbcSimulatorProps {
  onSimulate?: (selectedSbc: SbcType) => void;
}

const SbcSimulator: React.FC<SbcSimulatorProps> = ({ onSimulate }) => {
  const { predefinedSbcs, customSbc, runSimulation } = useSbc();

  const [selectedSbcIndex, setSelectedSbcIndex] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<string>("standard");

  // Sélectionner un SBC prédéfini ou personnalisé
  const selectedSbc =
    selectedSbcIndex === predefinedSbcs.length
      ? customSbc
      : predefinedSbcs[selectedSbcIndex];

  // Basculer l'état d'une section (expanded/collapsed)
  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Function to handle simulation
  const handleSimulate = () => {
    runSimulation(selectedSbc, selectedAlgorithm);

    // Notify parent component about the selected SBC
    if (onSimulate) {
      onSimulate(selectedSbc);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-0 space-y-6">
      <SbcHeader />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Right Side - SBC Simulator */}
        <div className="w-full lg:w-3/3">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden transition-all duration-300">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                <span>Choisir un SBC</span>
                <button
                  onClick={() => toggleCollapse("sbcSelection")}
                  className="ml-auto text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                >
                  {collapsed["sbcSelection"] ? (
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

            {!collapsed["sbcSelection"] && (
              <div className="p-4">
                {selectedSbcIndex === predefinedSbcs.length ? (
                  <div>
                    {/* Bouton de retour */}
                    <div className="mb-4 flex justify-start">
                      <button
                        onClick={() => setSelectedSbcIndex(0)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded transition-colors duration-200 flex items-center"
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
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                        Retour à la liste
                      </button>
                    </div>
                    <CustomSbcForm />
                  </div>
                ) : (
                  <SbcSelector
                    selectedSbcIndex={selectedSbcIndex}
                    setSelectedSbcIndex={setSelectedSbcIndex}
                    predefinedSbcs={predefinedSbcs}
                    customSbc={customSbc}
                    handleSimulate={handleSimulate}
                    selectedAlgorithm={selectedAlgorithm}
                    setSelectedAlgorithm={setSelectedAlgorithm}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SbcSimulator;
