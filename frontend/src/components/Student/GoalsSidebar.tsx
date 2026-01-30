import React from 'react';
import { AchievementLevel, TrophyLevel } from '../../types/negotiation';

interface GoalsSidebarProps {
  goals: string[]; // Student goals
  constraints: string[]; // Student constraints
  achievementLevels?: Map<number, { level: AchievementLevel; trophy?: TrophyLevel }>; // goal index -> achievement data
}

const getTrophyEmoji = (level?: TrophyLevel) => {
  if (!level) return '⚪'; // No trophy (fail)
  const trophies = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
  };
  return trophies[level];
};

export const GoalsSidebar: React.FC<GoalsSidebarProps> = ({ goals, constraints, achievementLevels = new Map() }) => {
  // Count achievements by trophy level
  let bronzeCount = 0;
  let silverCount = 0;
  let goldCount = 0;
  let totalAchieved = 0;

  achievementLevels.forEach(({ trophy }) => {
    if (trophy) {
      totalAchieved++;
      if (trophy === 'bronze') bronzeCount++;
      else if (trophy === 'silver') silverCount++;
      else if (trophy === 'gold') goldCount++;
    }
  });

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Goals</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {totalAchieved}/{goals.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Goals Achieved</div>
          </div>
          <div className="mt-3 flex justify-around text-xs">
            <div className="text-center">
              <div className="text-lg">🥉</div>
              <div className="font-semibold">{bronzeCount}</div>
              <div className="text-gray-600">Close</div>
            </div>
            <div className="text-center">
              <div className="text-lg">🥈</div>
              <div className="font-semibold">{silverCount}</div>
              <div className="text-gray-600">Achieved</div>
            </div>
            <div className="text-center">
              <div className="text-lg">🥇</div>
              <div className="font-semibold">{goldCount}</div>
              <div className="text-gray-600">Exceeded</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {goals.map((goal, index) => {
          const achievement = achievementLevels.get(index);
          const trophy = achievement?.trophy;
          const isAchieved = trophy !== undefined;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border-2 ${
                isAchieved
                  ? trophy === 'gold'
                    ? 'bg-yellow-50 border-yellow-400'
                    : trophy === 'silver'
                    ? 'bg-gray-50 border-gray-400'
                    : 'bg-amber-50 border-amber-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl flex-shrink-0">
                  {getTrophyEmoji(trophy)}
                </span>
                <div className="flex-1">
                  <p className={`text-sm ${isAchieved ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    {goal}
                  </p>
                  {achievement && achievement.level !== 'fail' && (
                    <p className="text-xs text-gray-600 mt-1">
                      {achievement.level === 'close' && '70% - Close!'}
                      {achievement.level === 'achieve' && '90% - Achieved!'}
                      {achievement.level === 'exceed' && '100%+ - Exceeded!'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constraints Section */}
      {constraints.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">⚠️ Your Constraints</h3>
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

      <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-semibold mb-1">💡 Tip:</p>
        <p>Goals are evaluated at the end based on how well you achieved them:</p>
        <ul className="mt-2 space-y-1 ml-2">
          <li>🥉 Close (~70%)</li>
          <li>🥈 Achieved (~90%)</li>
          <li>🥇 Exceeded (100%+)</li>
        </ul>
      </div>
    </div>
  );
};
