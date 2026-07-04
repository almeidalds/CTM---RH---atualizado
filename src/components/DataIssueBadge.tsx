/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DataIssueSeverity } from "../types/rh";

interface DataIssueBadgeProps {
  severity: DataIssueSeverity;
}

export const DataIssueBadge: React.FC<DataIssueBadgeProps> = ({ severity }) => {
  let classes = "bg-gray-100 text-gray-700 border-gray-200";

  switch (severity) {
    case "Crítica":
      classes = "bg-red-100 text-red-800 border-red-300 font-bold";
      break;
    case "Alta":
      classes = "bg-amber-100 text-amber-800 border-amber-300 font-semibold";
      break;
    case "Média":
      classes = "bg-blue-100 text-blue-800 border-blue-200";
      break;
    case "Baixa":
      classes = "bg-gray-100 text-gray-600 border-gray-200";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${classes}`}>
      {severity}
    </span>
  );
};
