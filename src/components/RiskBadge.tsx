/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { RiskLevel } from "../types/rh";

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  let badgeStyles = "bg-gray-100 text-gray-700 border-gray-200";
  
  switch (level) {
    case "Crítico":
      badgeStyles = "bg-red-50 text-[#DC2626] border-red-200 font-bold animate-pulse";
      break;
    case "Alto":
      badgeStyles = "bg-amber-50 text-[#F59E0B] border-amber-200 font-semibold";
      break;
    case "Médio":
      badgeStyles = "bg-sky-50 text-yinmn border-sky-200 font-medium";
      break;
    case "Baixo":
      badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "Sem risco":
      badgeStyles = "bg-emerald-50 text-[#00995D] border-emerald-200";
      break;
    case "Cadastro incompleto":
      badgeStyles = "bg-gray-50 text-gray-500 border-gray-300 border-dashed";
      break;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium border ${badgeStyles}`}>
      {level}
    </span>
  );
};
