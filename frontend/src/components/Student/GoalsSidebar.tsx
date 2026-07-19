import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

interface GoalsSidebarProps {
  goals: string[]; // Student goals
  constraints: string[]; // Student constraints
}

export const GoalsSidebar: React.FC<GoalsSidebarProps> = ({ goals, constraints }) => {
  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Target size={20} className="text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Your Goals</h2>
        </div>
        <div className="space-y-2">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="flex items-start gap-2">
                <span className="text-primary-500 text-sm font-semibold flex-shrink-0">
                  {index + 1}.
                </span>
                <p className="text-sm text-gray-800">{goal}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {constraints.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-warning-600" />
            <h3 className="text-lg font-bold text-gray-900">Your Constraints</h3>
          </div>
          <div className="space-y-2">
            {constraints.map((constraint, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-600 text-sm flex-shrink-0">•</span>
                  <p className="text-sm text-gray-700">{constraint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
