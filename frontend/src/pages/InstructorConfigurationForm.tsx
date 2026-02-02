import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Save, ArrowLeft, Trophy, User, Bot } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { PageLayout } from '../components/Layout/PageLayout';
import { Card, Input, Textarea, Button } from '../components/ui';
import { useToast } from '../components/ui';
import { BotStrategy, DifficultyLevel } from '../types/negotiation';

export const InstructorConfigurationForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { configurations, createConfig, updateConfig, fetchConfigurations } = useConfig();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('');
  const [studentGoals, setStudentGoals] = useState<string[]>(['']);
  const [botGoals, setBotGoals] = useState<string[]>(['']);
  const [studentConstraints, setStudentConstraints] = useState<string[]>(['']);
  const [botConstraints, setBotConstraints] = useState<string[]>(['']);
  const [botOpeningOffer, setBotOpeningOffer] = useState<string[]>(['']);
  const [botStrategy, setBotStrategy] = useState<BotStrategy>('collaborative');
  const [temperament, setTemperament] = useState(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [timeLimit, setTimeLimit] = useState(15);
  const [formality, setFormality] = useState<'casual' | 'professional' | 'formal'>('professional');
  const [emotionalResponsiveness, setEmotionalResponsiveness] = useState<'low' | 'medium' | 'high'>('medium');
  const [communicationStyle, setCommunicationStyle] = useState<'direct' | 'indirect' | 'diplomatic'>('direct');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchConfigurations();
    }
  }, [id]);

  useEffect(() => {
    if (id && configurations.length > 0) {
      const config = configurations.find(c => c.id === id);
      if (config) {
        setName(config.name);
        setScenario(config.scenario);
        setStudentGoals(config.studentGoals.length > 0 ? config.studentGoals : ['']);
        setBotGoals(config.botGoals.length > 0 ? config.botGoals : ['']);
        setStudentConstraints(config.studentConstraints.length > 0 ? config.studentConstraints : ['']);
        setBotConstraints(config.botConstraints.length > 0 ? config.botConstraints : ['']);
        setBotOpeningOffer(config.botOpeningOffer.length > 0 ? config.botOpeningOffer : ['']);
        setBotStrategy(config.botStrategy);
        setTemperament(config.temperament);
        setDifficulty(config.difficulty);
        setTimeLimit(config.timeLimit);
        setFormality(config.personality.formality);
        setEmotionalResponsiveness(config.personality.emotionalResponsiveness);
        setCommunicationStyle(config.personality.communicationStyle);
      }
    }
  }, [id, configurations]);

  const handleAddItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[]) => {
    setter([...items, '']);
  };

  const handleRemoveItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number) => {
    setter(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, items: string[], index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setter(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const filteredStudentGoals = studentGoals.filter(g => g.trim() !== '');
    const filteredBotGoals = botGoals.filter(g => g.trim() !== '');

    // Validate required fields
    if (filteredStudentGoals.length === 0) {
      showToast('error', 'Please add at least one student goal');
      setIsSubmitting(false);
      return;
    }

    if (filteredBotGoals.length === 0) {
      showToast('error', 'Please add at least one bot goal');
      setIsSubmitting(false);
      return;
    }

    const configData = {
      name,
      scenario,
      studentGoals: filteredStudentGoals,
      botGoals: filteredBotGoals,
      studentConstraints: studentConstraints.filter(c => c.trim() !== ''),
      botConstraints: botConstraints.filter(c => c.trim() !== ''),
      botOpeningOffer: botOpeningOffer.filter(o => o.trim() !== ''),
      botStrategy,
      temperament,
      difficulty,
      timeLimit,
      personality: {
        formality,
        emotionalResponsiveness,
        communicationStyle,
      },
    };

    try {
      if (id) {
        await updateConfig(id, configData);
        showToast('success', 'Configuration updated successfully!');
      } else {
        await createConfig(configData);
        showToast('success', 'Configuration created successfully!');
      }
      navigate('/instructor/configurations');
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title={`${id ? 'Edit' : 'Create'} Configuration`}
      subtitle="Configure the negotiation scenario, goals, and bot behavior"
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate('/instructor/configurations')}
          leftIcon={<ArrowLeft size={18} />}
        >
          Back
        </Button>
      }
    >
      <div className="max-w-7xl mx-auto">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Basic Information</h2>
              <div className="space-y-4">
                <Input
                  label="Configuration Name *"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="e.g., Salary Negotiation - Tech Industry"
                />
                <Textarea
                  label="Scenario *"
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  required
                  rows={3}
                  placeholder="Describe the negotiation scenario (this is shown to the student)..."
                  helperText="This scenario description will be visible to students"
                />
              </div>
            </Card>

            {/* Goals and Constraints - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Side */}
              <Card padding="lg" className="bg-sky-50 border-2 border-sky-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-sky-900">Student Side</h2>
                </div>

                {/* Student Goals */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Student Goals *
                  </label>
                  <p className="text-xs text-neutral-600 mb-3">
                    What is the student trying to achieve? These will be evaluated for trophies.
                  </p>
                  {studentGoals.map((goal, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={goal}
                        onChange={e => handleItemChange(setStudentGoals, studentGoals, index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        placeholder={`Goal ${index + 1}`}
                        required={index === 0}
                      />
                      {studentGoals.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(setStudentGoals, studentGoals, index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddItem(setStudentGoals, studentGoals)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2"
                  >
                    Add Goal
                  </Button>
                </div>

                {/* Student Constraints */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Student Constraints
                  </label>
                  <p className="text-xs text-neutral-600 mb-3">
                    What limitations or context does the student have?
                  </p>
                  {studentConstraints.map((constraint, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={constraint}
                        onChange={e => handleItemChange(setStudentConstraints, studentConstraints, index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                        placeholder={`Constraint ${index + 1}`}
                      />
                      {studentConstraints.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(setStudentConstraints, studentConstraints, index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleAddItem(setStudentConstraints, studentConstraints)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2"
                  >
                    Add Constraint
                  </Button>
                </div>
              </Card>

              {/* Bot Side */}
              <Card padding="lg" className="bg-warning-50 border-2 border-warning-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-warning-500 flex items-center justify-center">
                    <Bot size={20} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-warning-900">Bot Side</h2>
                </div>

                {/* Bot Goals */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Bot Goals *
                  </label>
                  <p className="text-xs text-neutral-600 mb-3">
                    What is the bot trying to achieve? (Hidden from student)
                  </p>
                  {botGoals.map((goal, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={goal}
                        onChange={e => handleItemChange(setBotGoals, botGoals, index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all"
                        placeholder={`Goal ${index + 1}`}
                        required={index === 0}
                      />
                      {botGoals.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(setBotGoals, botGoals, index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="warning"
                    size="sm"
                    onClick={() => handleAddItem(setBotGoals, botGoals)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2"
                  >
                    Add Goal
                  </Button>
                </div>

                {/* Bot Constraints */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Bot Constraints
                  </label>
                  <p className="text-xs text-neutral-600 mb-3">
                    What limitations or context does the bot have?
                  </p>
                  {botConstraints.map((constraint, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={constraint}
                        onChange={e => handleItemChange(setBotConstraints, botConstraints, index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all"
                        placeholder={`Constraint ${index + 1}`}
                      />
                      {botConstraints.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(setBotConstraints, botConstraints, index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="warning"
                    size="sm"
                    onClick={() => handleAddItem(setBotConstraints, botConstraints)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2"
                  >
                    Add Constraint
                  </Button>
                </div>

                {/* Bot Opening Offer */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Bot Opening Offer
                  </label>
                  <p className="text-xs text-neutral-600 mb-3">
                    What specific terms will the bot present in its opening statement? (e.g., salary amounts, vacation days, specific conditions)
                  </p>
                  {botOpeningOffer.map((offer, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={offer}
                        onChange={e => handleItemChange(setBotOpeningOffer, botOpeningOffer, index, e.target.value)}
                        className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all"
                        placeholder={`Offer term ${index + 1} (e.g., "$55,000 starting salary")`}
                      />
                      {botOpeningOffer.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveItem(setBotOpeningOffer, botOpeningOffer, index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="warning"
                    size="sm"
                    onClick={() => handleAddItem(setBotOpeningOffer, botOpeningOffer)}
                    leftIcon={<Plus size={16} />}
                    className="mt-2"
                  >
                    Add Offer Term
                  </Button>
                </div>
              </Card>
            </div>

            {/* Bot Configuration */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Bot Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Bot Strategy *
                  </label>
                  <select
                    value={botStrategy}
                    onChange={e => setBotStrategy(e.target.value as BotStrategy)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="collaborative">Collaborative</option>
                    <option value="competitive">Competitive</option>
                    <option value="analytical">Analytical</option>
                    <option value="emotional">Emotional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Difficulty *
                  </label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Temperament: {temperament}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={temperament}
                    onChange={e => setTemperament(parseInt(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    1 = Very calm/flexible, 10 = Very assertive/rigid
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Time Limit (minutes, 0 = unlimited) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={timeLimit}
                    onChange={e => setTimeLimit(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Personality */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Formality
                  </label>
                  <select
                    value={formality}
                    onChange={e => setFormality(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Emotional Responsiveness
                  </label>
                  <select
                    value={emotionalResponsiveness}
                    onChange={e => setEmotionalResponsiveness(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Communication Style
                  </label>
                  <select
                    value={communicationStyle}
                    onChange={e => setCommunicationStyle(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  >
                    <option value="direct">Direct</option>
                    <option value="indirect">Indirect</option>
                    <option value="diplomatic">Diplomatic</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Trophy Info */}
            <Card padding="lg" className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
              <div className="flex items-center gap-3 mb-4">
                <Trophy size={24} className="text-yellow-600" />
                <h2 className="text-2xl font-bold text-neutral-900">Trophy System</h2>
              </div>
              <p className="text-neutral-700 mb-4">
                Student goals will be automatically evaluated by Claude AI at the end of the negotiation.
                Trophy levels are determined by achievement:
              </p>
              <ul className="space-y-2 text-sm text-neutral-800">
                <li className="flex items-start gap-2">
                  <span className="text-lg">❌</span>
                  <div><strong>Fail (0%):</strong> Goal was not achieved - no trophy</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🥉</span>
                  <div><strong>Bronze (~70%):</strong> Got close to achieving the goal</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🥈</span>
                  <div><strong>Silver (~90%):</strong> Successfully achieved the goal</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lg">🥇</span>
                  <div><strong>Gold (100%+):</strong> Exceeded the goal</div>
                </li>
              </ul>
            </Card>

            {/* Actions */}
            <Card padding="lg">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/instructor/configurations')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  leftIcon={<Save size={18} />}
                >
                  {id ? 'Update Configuration' : 'Create Configuration'}
                </Button>
              </div>
            </Card>
          </form>
        </div>
    </PageLayout>
  );
};
