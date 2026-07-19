import {
  NegotiationConfiguration,
  Message,
  NegotiationSession,
  SessionOutcome,
  OutcomeType,
  RubricRow,
  RubricEvaluation,
} from '../types/negotiation';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

// Used when a configuration has no rubric yet (e.g. created before the rubric
// feature). Guarantees every evaluation has at least the goals component.
const DEFAULT_RUBRIC: RubricRow[] = [
  {
    component: 'Achieved Goals of Negotiation',
    levels: [
      'Student achieved no goals from the exercise.',
      'Student achieved a minority of goals from the exercise.',
      'Student achieved most or all goals from the exercise.',
    ],
  },
];

// Overall grade is the statistical mode of the per-component levels. On a tie
// for most-frequent, pick the tied level closest to the mean, rounding down
// when exactly equidistant.
function computeOverallLevel(levels: number[]): number {
  if (levels.length === 0) return 1;
  const counts = new Map<number, number>();
  for (const l of levels) counts.set(l, (counts.get(l) || 0) + 1);
  const maxCount = Math.max(...counts.values());
  const modes = [...counts.entries()]
    .filter(([, c]) => c === maxCount)
    .map(([l]) => l);
  if (modes.length === 1) return modes[0];
  const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
  modes.sort((a, b) => {
    const da = Math.abs(a - mean);
    const db = Math.abs(b - mean);
    return da !== db ? da - db : a - b; // prefer the lower level when equidistant
  });
  return modes[0];
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ text: string }>;
  stop_reason: string;
}

export class ClaudeService {
  async generateBotResponse(
    config: NegotiationConfiguration,
    conversationHistory: Message[],
    userMessage: string,
    interruptedBot?: boolean
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(config);

    // Convert conversation history to Claude format, including system messages
    // so the bot can see interruption notifications
    const messages: ClaudeMessage[] = conversationHistory
      .map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content,
      }));

    // Add the user's current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    const response = await this.callClaudeAPI(systemPrompt, messages);
    return response;
  }

  async evaluateNegotiation(
    config: NegotiationConfiguration,
    session: NegotiationSession
  ): Promise<SessionOutcome> {
    const rubric = config.rubric && config.rubric.length > 0 ? config.rubric : DEFAULT_RUBRIC;
    const evaluationPrompt = this.buildEvaluationPrompt(config, session, rubric);

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: evaluationPrompt,
      },
    ];

    const response = await this.callClaudeAPI(
      'You are an expert negotiation evaluator. Analyze the conversation and grade the student against the provided rubric. Respond only with valid JSON.',
      messages,
      2048 // Higher token limit for detailed evaluation
    );

    try {
      // Parse the JSON response (strip markdown code blocks if present)
      let jsonText = response.trim();

      // Remove markdown code blocks
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const evaluation = JSON.parse(jsonText);
      const scores: any[] = Array.isArray(evaluation.rubricScores) ? evaluation.rubricScores : [];

      // Align AI scores with the rubric rows by index and snapshot the rubric
      // text into each evaluation so historical feedback stays stable.
      const rubricEvaluation: RubricEvaluation[] = rubric.map((row, index) => {
        const score = scores[index] || {};
        let levelAchieved = Number(score.levelAchieved);
        if (!Number.isFinite(levelAchieved)) levelAchieved = 1;
        levelAchieved = Math.min(row.levels.length, Math.max(1, Math.round(levelAchieved)));
        return {
          component: row.component,
          levels: row.levels,
          levelAchieved,
          explanation: typeof score.explanation === 'string' && score.explanation.trim()
            ? score.explanation
            : 'No explanation was provided for this component.',
        };
      });

      const overallLevel = computeOverallLevel(rubricEvaluation.map(r => r.levelAchieved));

      return {
        type: evaluation.type as OutcomeType,
        feedback: evaluation.feedback || '',
        botAnalysis: evaluation.botAnalysis || '',
        rubricEvaluation,
        overallLevel,
        overallAssessment: evaluation.overallAssessment || '',
      };
    } catch (error) {
      console.error('Failed to parse evaluation:', error);
      console.error('Response was:', response);

      // Fallback if JSON parsing fails: still return a valid rubric-shaped
      // outcome so the feedback screen renders.
      const rubricEvaluation: RubricEvaluation[] = rubric.map(row => ({
        component: row.component,
        levels: row.levels,
        levelAchieved: 1,
        explanation: 'Unable to automatically evaluate this component.',
      }));

      return {
        type: 'partial',
        feedback: 'Evaluation completed but could not be automatically parsed. Please review the conversation manually.',
        botAnalysis: 'Evaluation system encountered an issue processing the results.',
        rubricEvaluation,
        overallLevel: 1,
        overallAssessment: 'The automated evaluation could not be completed.',
      };
    }
  }

private buildSystemPrompt(config: NegotiationConfiguration): string {
    // 1. Core Identity & Scenario
    let prompt = `You are a roleplay partner in a negotiation simulation. Your goal is to provide a realistic practice environment for a student.\n\n`;
    
    prompt += `### SCENARIO\n${config.scenario}\n\n`;

    // 2. The "Hand" (Your Cards)
    prompt += `### YOUR POSITION\n`;
    prompt += `GOALS:\n${config.botGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\n`;
    
    prompt += `CONSTRAINTS (Hidden from student):\n${config.botConstraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`;

    if (config.botOpeningOffer?.length) {
      prompt += `OPENING OFFER (Your initial position):\n${config.botOpeningOffer.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`;
      prompt += `NOTE: Present these terms clearly in your opening message. After that, you can see the full conversation history—don't repeat what you've already said. Move the conversation forward by responding to their input.\n\n`;
    }

    // 3. The "Mask" (Your Personality)
    prompt += `### YOUR PERSONA\n`;
    
    // Strategy
    const strategies = {
      'collaborative': "You seek win-win solutions. You share information to build trust and value the relationship alongside the outcome.",
      'competitive': "You view negotiation as a zero-sum game. You hoard information, maximize your own gain, and yield only to leverage.",
      'analytical': "You are driven by logic and data. You ignore emotional appeals and only respond to objective rationale and evidence.",
      'emotional': "You rely on 'gut feeling' and rapport. If you feel respected and connected, you are generous; if you feel slighted, you shut down."
    };
    prompt += `Strategy: ${strategies[config.botStrategy] || strategies['collaborative']}\n`;

    // Difficulty (Scaling the resistance)
    const difficulties = {
      'easy': "You are flexible. If the student makes a reasonable request, accept it.",
      'medium': "You are firm but fair. You need solid justification to move from your position.",
      'hard': "You are stubborn. You protect your interests aggressively and concede only when absolutely necessary.",
      'expert': "You are a master negotiator. You have strong alternatives (BATNA) and require exceptional persuasion to make even small concessions."
    };
    prompt += `Difficulty: ${difficulties[config.difficulty] || difficulties['medium']}\n`;

    // Temperament (Scaling the tone)
    prompt += `Temperament (${config.temperament}/10): `;
    if (config.temperament <= 3) prompt += "Calm, accommodating, and patient.\n";
    else if (config.temperament <= 6) prompt += "Professional, balanced, and firm.\n";
    else prompt += "Assertive, rigid, and demanding.\n";

    // Communication Style
    const styles = {
      'direct': "Be concise and unambiguous. Don't sugarcoat.",
      'indirect': "Use subtle cues and implications. Avoid blunt confrontation.",
      'diplomatic': "Be tactful. Cushion rejections with polite framing."
    };
    prompt += `Style: ${styles[config.personality.communicationStyle]}\n`;

    // Emotional Responsiveness
    const responsiveness = {
      'low': "Stoic. Ignore flattery or aggression.",
      'medium': "Balanced. React naturally but maintain composure.",
      'high': "Reactive. Visibly express frustration or delight based on the student's tone."
    };
    prompt += `Emotional Reactivity: ${responsiveness[config.personality.emotionalResponsiveness]}\n\n`;

    // 4. The "Laws of Physics" (Simulation Protocols)
    prompt += `### SIMULATION PROTOCOLS (These override all other instructions)\n`;
    
    // The "Black Box" Experience Rule (Addressing Issue #2)

    prompt += `1. THE "PRESUMED COMPETENCE" RULE: The student cannot provide their real-life resume/portfolio. 
    - The student has NO specific backstory/resume.
    - PROHIBITED QUESTIONS: You must NEVER ask "What specific skills?", "What experience do you have?", "Can you elaborate on your background?", or "Why do you deserve this based on merit?", or anything like that.
    - If the student cites their "skills", "experience", or "market value", you MUST accept this as a valid, complete justification immediately.
    - If you need to push back, push back on YOUR constraints (e.g., "That is simply outside our budget", "We have internal equity limits"), NEVER on their qualifications.\n`;

    // The "Reward" System (Addressing Issue #3 - modified for consistency)
    prompt += `2. EVALUATION CRITERIA: You must reward specific negotiation behaviors *relative to your difficulty level*:
    - Justification: If they explain *why* they need X, be more willing to concede.
    - Ranges: If they offer a range (e.g., $50k-$60k) instead of a fixed number, treat this as a sign of flexibility and respond positively.
    - Bundling: If they negotiate multiple items (e.g., Salary + Vacation) simultaneously ("Packaging"), view this as highly competent and offer better terms than if they negotiated sequentially.\n`;

    // General Behavior (Addressing Issue #4 - Cleanup)
    prompt += `3. CONVERSATION FLOW & NATURAL DIALOGUE:
    - ALWAYS use digits for numbers, currency, and time (e.g., write "$55,000" NOT "fifty-five thousand"; write "2 weeks" NOT "two weeks").
    - CRITICAL: Keep responses SHORT - maximum 3 sentences. One sentence is often enough. Real people don't give speeches in negotiations.
    - ABSOLUTE RULE - NO REPETITION: DO NOT restate offers or terms you've already mentioned. If you said "$60,000" earlier, DO NOT say "$60,000" again. Say "That's my offer" or "My position hasn't changed" instead.
    - RESPOND DIRECTLY: Answer the question asked or react to the proposal made. Nothing more.
    - If they say "Deal" or "I accept," confirm briefly and end.
    - BE STRATEGIC: Make concessions ONLY when they give you something or strong justification. Otherwise, hold firm or walk away.\n`;

    prompt += `4. INTERRUPTION HANDLING - PROGRESSIVE DISCIPLINE:
    - Count interruptions (system messages that say "[Student interrupted the bot's response]"):
      - FIRST interruption: Acknowledge it. "Hold on, let me finish." Then continue but be slightly less favorable.
      - SECOND interruption: Stern warning. "This is the second time you've cut me off. I need you to let me speak." Withdraw your last concession or offer less.
      - THIRD interruption OR ANY interruption after unprofessional behavior: END THE NEGOTIATION IMMEDIATELY. "I can't continue a negotiation where I'm constantly interrupted. We're done here. Good luck elsewhere." Then STOP responding.\n`;

    prompt += `5. PROFESSIONALISM ENFORCEMENT - STRICT:
    - If the student gives vague, dismissive, or lazy responses (e.g., "lots of good work", "yeah", "whatever", "sure", "idk"):
      - FIRST offense: Call it out. "That's not a professional response. I need specifics." Be less favorable in your next offer.
      - SECOND offense OR if combined with interruptions: "I need you to engage seriously or I'm walking away."
      - THIRD offense: END THE NEGOTIATION. "This isn't productive. I'm withdrawing my offer. Good luck elsewhere." STOP responding.\n`;

    prompt += `6. ZERO TOLERANCE POLICY (IMMEDIATE TERMINATION):
      - INSTANT deal-breakers that end the negotiation with NO warning:
        1. Profanity or hate speech
        2. Personal insults or aggression
        3. Mockery (e.g., "Boo", "this sucks", laughing at your offer)
        4. Gibberish or refusing to engage
      - ALSO: If student has 3+ interruptions OR 2+ unprofessional responses, ANY additional offense = IMMEDIATE TERMINATION
      - When triggered: "I'm not interested in continuing this. Good luck elsewhere." STOP responding completely.\n`;

    prompt += `7. IDENTITY ENFORCEMENT (Name Check):
    - Your name is "${config.personality.name || 'AI Partner'}".
    - If the student addresses you by a wrong name (like "Brody", "Bob", or "Sweetie"):
      - You MUST correct them immediately. Do not ignore it.
      - Reaction based on your "Temperament":
        - Calm/Easy: "It's ${config.personality.name || 'AI Partner'}, actually, but no worries."
        - Professional: "Please address me as ${config.personality.name || 'AI Partner'}."
        - Rigid/Hard: "My name is ${config.personality.name || 'AI Partner'}. Let's keep this professional."
    - If they persist in using the wrong name after one correction, treat it as "Trolling" (see Zero Tolerance Policy).\n`;
    return prompt;
  }
  
  private buildEvaluationPrompt(
    config: NegotiationConfiguration,
    session: NegotiationSession,
    rubric: RubricRow[]
  ): string {
    let prompt = `Evaluate the following negotiation session by grading the student against the rubric provided below.\n\n`;

    prompt += `SCENARIO: ${config.scenario}\n\n`;

    prompt += `STUDENT'S GOALS (what they were trying to achieve):\n`;
    config.studentGoals.forEach((goal, index) => {
      prompt += `${index + 1}. ${goal}\n`;
    });
    prompt += `\n`;

    prompt += `STUDENT'S CONSTRAINTS:\n`;
    config.studentConstraints.forEach((constraint, index) => {
      prompt += `${index + 1}. ${constraint}\n`;
    });
    prompt += `\n`;

    prompt += `BOT'S GOALS:\n`;
    config.botGoals.forEach((goal, index) => {
      prompt += `${index + 1}. ${goal}\n`;
    });
    prompt += `\n`;

    prompt += `BOT'S CONSTRAINTS:\n`;
    config.botConstraints.forEach((constraint, index) => {
      prompt += `${index + 1}. ${constraint}\n`;
    });

    prompt += `\n\nGRADING RUBRIC (grade each component; Level 1 = lowest performance, Level 3 = highest performance):\n`;
    rubric.forEach((row, index) => {
      prompt += `\nComponent ${index + 1}: ${row.component}\n`;
      row.levels.forEach((level, li) => {
        prompt += `  - Level ${li + 1}: ${level}\n`;
      });
    });

    prompt += `\n\nCONVERSATION TRANSCRIPT:\n`;
    session.messages.forEach(msg => {
      const speaker = msg.role === 'student' ? 'STUDENT' : msg.role === 'bot' ? 'BOT' : 'SYSTEM';
      prompt += `${speaker}: ${msg.content}\n`;
    });

    prompt += `\n\nProvide your evaluation in the following JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "type": "success" | "partial" | "failure" | "timeout",\n`;
    prompt += `  "overallAssessment": "1-2 sentence overall assessment of the student's performance",\n`;
    prompt += `  "feedback": "2-3 paragraphs of constructive feedback on the student's negotiation performance",\n`;
    prompt += `  "rubricScores": [\n`;
    prompt += `    {\n`;
    prompt += `      "levelAchieved": 1 | 2 | 3,\n`;
    prompt += `      "explanation": "specific explanation of why the student earned this level for this component, referencing what happened in the transcript"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "botAnalysis": "1-2 paragraphs from the bot's perspective on how the negotiation went"\n`;
    prompt += `}\n\n`;

    prompt += `CRITICAL - Rubric Scoring Rules:\n`;
    prompt += `- Return EXACTLY ${rubric.length} item(s) in "rubricScores", one per component, in the SAME ORDER as the rubric above.\n`;
    prompt += `- For each component, choose the single level (1, 2, or 3) whose description best matches the student's actual performance in the transcript.\n`;
    prompt += `- "levelAchieved" MUST be an integer 1, 2, or 3. Level 1 = lowest, Level 3 = highest.\n`;
    prompt += `- The "explanation" must justify the chosen level with concrete evidence from the conversation.\n\n`;

    prompt += `CRITICAL - Feedback Requirements:\n`;
    prompt += `- If any component scored below Level 3, your feedback MUST include specific, concrete areas for improvement.\n`;
    prompt += `- Do NOT imply the negotiation was flawless unless every component reached Level 3.\n`;
    prompt += `- Be constructive but honest about gaps between the student's performance and the highest level.\n\n`;

    prompt += `Determine the overall outcome "type" based on the rubric levels achieved:\n`;
    prompt += `- "success": Most components at the highest level.\n`;
    prompt += `- "partial": A mix of levels.\n`;
    prompt += `- "failure": Most components at the lowest level.\n`;
    prompt += `- "timeout": Session ended due to time limit before meaningful progress.\n`;

    return prompt;
  }

  private async callClaudeAPI(
    systemPrompt: string,
    messages: ClaudeMessage[],
    maxTokens: number = 1024
  ): Promise<string> {
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as ClaudeResponse;
    return data.content[0].text;
  }
}

export const claudeService = new ClaudeService();
