import React from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2 } from 'lucide-react';
import { SessionOutcome } from '../../types/negotiation';
import { Card, Badge } from '../ui';

interface FeedbackResultsProps {
  outcome: SessionOutcome;
  animate?: boolean;
}

const levelStyles: Record<number, { badge: string; ring: string; cell: string; label: string }> = {
  1: {
    badge: 'bg-danger-100 text-danger-700 border-danger-300',
    ring: 'ring-danger-400',
    cell: 'bg-danger-50 border-danger-300',
    label: 'text-danger-700',
  },
  2: {
    badge: 'bg-warning-100 text-warning-700 border-warning-300',
    ring: 'ring-warning-400',
    cell: 'bg-warning-50 border-warning-300',
    label: 'text-warning-700',
  },
  3: {
    badge: 'bg-success-100 text-success-700 border-success-300',
    ring: 'ring-success-400',
    cell: 'bg-success-50 border-success-300',
    label: 'text-success-700',
  },
};

export const FeedbackResults: React.FC<FeedbackResultsProps> = ({ outcome, animate = false }) => {
  const rubric = outcome.rubricEvaluation || [];
  const hasRubric = rubric.length > 0;
  const maxLevel = hasRubric ? rubric[0].levels.length : 3;
  const overallLevel = outcome.overallLevel || 1;
  const overallStyle = levelStyles[Math.min(3, Math.max(1, overallLevel))];

  const Wrapper: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) =>
    animate ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        {children}
      </motion.div>
    ) : (
      <>{children}</>
    );

  return (
    <div className="space-y-6">
      {/* Overall assessment grade */}
      <Wrapper>
        <Card padding="lg" className={`border-2 ${overallStyle.cell}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/70 flex items-center justify-center flex-shrink-0">
                <Award size={32} className={overallStyle.label} />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">Overall Assessment</p>
                <p className={`text-3xl font-bold ${overallStyle.label}`}>
                  Level {overallLevel} <span className="text-neutral-400 text-2xl font-semibold">of {maxLevel}</span>
                </p>
              </div>
            </div>
            {outcome.overallAssessment && (
              <p className="text-neutral-700 leading-relaxed sm:border-l sm:border-neutral-300 sm:pl-4 flex-1">
                {outcome.overallAssessment}
              </p>
            )}
          </div>
        </Card>
      </Wrapper>

      {/* Rubric table */}
      {hasRubric && (
        <Wrapper delay={0.1}>
          <Card padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Rubric Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '820px' }}>
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left text-sm font-semibold text-neutral-700 p-3 w-52">Rubric Component</th>
                    {Array.from({ length: maxLevel }).map((_, i) => (
                      <th key={i} className="text-left text-sm font-semibold text-neutral-700 p-3">
                        Level {i + 1}
                      </th>
                    ))}
                    <th className="text-left text-sm font-semibold text-neutral-700 p-3 w-64">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {rubric.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-neutral-100 align-top">
                      <td className="p-3">
                        <p className="font-semibold text-neutral-900 text-sm">{row.component}</p>
                      </td>
                      {row.levels.map((levelText, levelIndex) => {
                        const level = levelIndex + 1;
                        const achieved = level === row.levelAchieved;
                        const style = levelStyles[Math.min(3, Math.max(1, level))];
                        return (
                          <td key={levelIndex} className="p-2">
                            <div
                              className={`h-full rounded-xl border p-2.5 text-sm transition-all ${
                                achieved
                                  ? `${style.cell} ring-2 ${style.ring} font-medium text-neutral-900`
                                  : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                              }`}
                            >
                              {achieved && (
                                <div className={`flex items-center gap-1 mb-1 text-xs font-bold ${style.label}`}>
                                  <CheckCircle2 size={14} />
                                  Achieved
                                </div>
                              )}
                              {levelText}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3">
                        <p className="text-sm text-neutral-600">{row.explanation}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Wrapper>
      )}

      {/* Legacy fallback for sessions evaluated before the rubric feature */}
      {!hasRubric && outcome.criteriaEvaluation && outcome.criteriaEvaluation.length > 0 && (
        <Wrapper delay={0.1}>
          <Card padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Goal Achievements</h3>
            <div className="space-y-3">
              {outcome.criteriaEvaluation.map((criteria, idx) => (
                <div key={idx} className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <p className="font-semibold text-neutral-900 mb-1">{criteria.goal}</p>
                  <Badge
                    variant={
                      criteria.achievementLevel === 'exceed' ? 'success' :
                      criteria.achievementLevel === 'achieve' ? 'primary' :
                      criteria.achievementLevel === 'close' ? 'warning' : 'danger'
                    }
                    size="sm"
                    className="mb-2"
                  >
                    {criteria.achievementLevel}
                  </Badge>
                  <p className="text-sm text-neutral-600">{criteria.notes}</p>
                </div>
              ))}
            </div>
          </Card>
        </Wrapper>
      )}

      {/* Written feedback */}
      {outcome.feedback && (
        <Wrapper delay={0.2}>
          <Card padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-3">Feedback</h3>
            <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{outcome.feedback}</p>
          </Card>
        </Wrapper>
      )}

      {/* Bot analysis */}
      {outcome.botAnalysis && (
        <Wrapper delay={0.3}>
          <Card padding="lg">
            <h3 className="text-xl font-bold text-neutral-900 mb-3">Negotiation Partner's Perspective</h3>
            <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{outcome.botAnalysis}</p>
          </Card>
        </Wrapper>
      )}
    </div>
  );
};
