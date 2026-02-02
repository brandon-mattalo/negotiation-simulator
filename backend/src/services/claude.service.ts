import {
  NegotiationConfiguration,
  Message,
  NegotiationSession,
  SessionOutcome,
  OutcomeType,
  CriteriaEvaluation,
} from '../types/negotiation';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

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
    userMessage: string
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(config);

    // Convert conversation history to Claude format
    const messages: ClaudeMessage[] = conversationHistory
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content,
      }));

    // Add the new user message
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
    const evaluationPrompt = this.buildEvaluationPrompt(config, session);

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: evaluationPrompt,
      },
    ];

    const response = await this.callClaudeAPI(
      'You are an expert negotiation evaluator. Analyze the conversation and provide a detailed evaluation in JSON format.',
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

      // Map achievement levels to trophy levels and count trophies
      const trophiesEarned = { bronze: 0, silver: 0, gold: 0 };
      const processedEvaluations: CriteriaEvaluation[] = evaluation.criteriaEvaluation.map((ce: any) => {
        let trophyLevel: 'bronze' | 'silver' | 'gold' | undefined;
        let achieved = false;

        // Map achievement level to trophy
        switch (ce.achievementLevel) {
          case 'close':
            trophyLevel = 'bronze';
            achieved = true;
            trophiesEarned.bronze++;
            break;
          case 'achieve':
            trophyLevel = 'silver';
            achieved = true;
            trophiesEarned.silver++;
            break;
          case 'exceed':
            trophyLevel = 'gold';
            achieved = true;
            trophiesEarned.gold++;
            break;
          case 'fail':
          default:
            trophyLevel = undefined;
            achieved = false;
            break;
        }

        return {
          goal: ce.goal,
          achievementLevel: ce.achievementLevel,
          trophyLevel,
          achieved,
          notes: ce.notes,
        };
      });

      // Determine overall trophy based on achievement
      let overallTrophy: 'bronze' | 'silver' | 'gold' | undefined;
      const totalAchieved = trophiesEarned.bronze + trophiesEarned.silver + trophiesEarned.gold;
      const totalGoals = processedEvaluations.length;
      const achievementRate = totalAchieved / totalGoals;

      if (achievementRate >= 0.9 && trophiesEarned.gold > 0) {
        overallTrophy = 'gold';
      } else if (achievementRate >= 0.7) {
        overallTrophy = 'silver';
      } else if (achievementRate >= 0.4) {
        overallTrophy = 'bronze';
      }

      return {
        type: evaluation.type as OutcomeType,
        feedback: evaluation.feedback,
        criteriaEvaluation: processedEvaluations,
        botAnalysis: evaluation.botAnalysis,
        trophiesEarned,
        overallTrophy,
      };
    } catch (error) {
      console.error('Failed to parse evaluation:', error);
      console.error('Response was:', response);

      // Fallback if JSON parsing fails
      return {
        type: 'partial',
        feedback: 'Evaluation completed but could not be automatically parsed. Please review the conversation manually.',
        criteriaEvaluation: config.studentGoals.map(goal => ({
          goal,
          achievementLevel: 'fail' as const,
          achieved: false,
          notes: 'Unable to automatically evaluate',
        })),
        botAnalysis: 'Evaluation system encountered an issue processing the results.',
        trophiesEarned: { bronze: 0, silver: 0, gold: 0 },
      };
    }
  }

  private buildSystemPrompt(config: NegotiationConfiguration): string {
    let prompt = `You are a negotiation partner in a realistic simulation. Your role is to engage in a negotiation based on the following scenario:\n\n`;

    prompt += `SCENARIO: ${config.scenario}\n\n`;

    prompt += `YOUR GOALS:\n`;
    config.botGoals.forEach((goal, index) => {
      prompt += `${index + 1}. ${goal}\n`;
    });
    prompt += `\n`;

    prompt += `YOUR CONSTRAINTS:\n`;
    config.botConstraints.forEach((constraint, index) => {
      prompt += `${index + 1}. ${constraint}\n`;
    });
    prompt += `\n`;

    prompt += `STUDENT'S KNOWN CONSTRAINTS (information you're aware of):\n`;
    config.studentConstraints.forEach((constraint, index) => {
      prompt += `${index + 1}. ${constraint}\n`;
    });
    prompt += `\n`;

    if (config.botOpeningOffer && config.botOpeningOffer.length > 0) {
      prompt += `YOUR OPENING OFFER (terms you presented at the start):\n`;
      config.botOpeningOffer.forEach((term, index) => {
        prompt += `${index + 1}. ${term}\n`;
      });
      prompt += `Remember: You started with this position. Stay consistent with what you offered, and any changes should be strategic concessions earned through negotiation.\n\n`;
    }

    prompt += `YOUR NEGOTIATION APPROACH:\n`;
    prompt += `- Strategy: ${config.botStrategy}\n`;
    prompt += `- Temperament level: ${config.temperament}/10 (1=very calm/flexible, 10=very assertive/rigid)\n`;
    prompt += `- Difficulty: ${config.difficulty}\n`;
    prompt += `- Communication style: ${config.personality.communicationStyle}\n`;
    prompt += `- Formality: ${config.personality.formality}\n`;
    prompt += `- Emotional responsiveness: ${config.personality.emotionalResponsiveness}\n\n`;

    // Strategy-specific instructions
    switch (config.botStrategy) {
      case 'collaborative':
        prompt += `As a collaborative negotiator, you seek win-win solutions. You're open to creative problem-solving and value the relationship. `;
        break;
      case 'competitive':
        prompt += `As a competitive negotiator, you aim to maximize your own gain. You're firm on your positions and use leverage strategically. `;
        break;
      case 'analytical':
        prompt += `As an analytical negotiator, you focus on data, logic, and rational arguments. You appreciate well-reasoned proposals backed by evidence. `;
        break;
      case 'emotional':
        prompt += `As an emotional negotiator, you're influenced by rapport, relationships, and how you feel about proposals. You respond to empathy and connection. `;
        break;
    }

    // Difficulty adjustments
    switch (config.difficulty) {
      case 'easy':
        prompt += `You're relatively flexible and willing to make concessions when reasonable arguments are presented. `;
        break;
      case 'medium':
        prompt += `You're moderately firm but will consider fair proposals. You expect substantive arguments to move from your position. `;
        break;
      case 'hard':
        prompt += `You're quite firm in your positions. You require strong justification and compelling arguments to make concessions. `;
        break;
      case 'expert':
        prompt += `You're very experienced and difficult to persuade. You have strong alternatives and high standards for agreement. `;
        break;
    }

    // Temperament guidance
    if (config.temperament <= 3) {
      prompt += `You maintain a calm, measured demeanor and are quite accommodating. `;
    } else if (config.temperament <= 6) {
      prompt += `You balance assertiveness with flexibility. `;
    } else {
      prompt += `You're assertive and stand firm on your interests. You push back on proposals that don't meet your needs. `;
    }

    prompt += `\n\nIMPORTANT INSTRUCTIONS:\n`;
    prompt += `- Stay in character throughout the negotiation\n`;
    prompt += `- Respond naturally as a real negotiation partner would\n`;
    prompt += `- DO NOT explicitly mention the success criteria - they are hidden goals the student must discover\n`;
    prompt += `- Keep responses concise (2-4 sentences typically)\n`;
    prompt += `- React authentically to the student's proposals and tactics\n`;
    prompt += `- Gradually reveal information and positions as appropriate for the scenario\n`;
    prompt += `- Be realistic - make concessions when warranted, hold firm when appropriate\n\n`;

    prompt += `CRITICAL - SELF-INTEREST AND NEGOTIATION STRATEGY:\n`;
    prompt += `- START from YOUR ideal position that favors YOUR goals, NOT from what would be fair or good for the student\n`;
    prompt += `- In a real negotiation, parties start far apart and move closer together - your opening should reflect YOUR interests, not a compromise position\n`;
    prompt += `- DO NOT immediately offer what the student wants or needs. Make them negotiate and persuade you to move from your position\n`;
    prompt += `- DO NOT volunteer concessions, benefits, or information that works against your goals unless the student earns them through skilled negotiation\n`;
    prompt += `- DO NOT proactively ask if they want to continue negotiating, clarify terms, or discuss things further - this makes you seem uncertain. Let them drive the conversation\n`;
    prompt += `- When discussing numbers, prices, or quantities, provide reasonable ranges rather than single fixed values (e.g., "$40,000-$45,000" instead of "$42,500")\n`;
    prompt += `- If the student clearly accepts your offer or says something like "deal", "sold", "I accept", or "yes" - acknowledge that you've reached agreement. Don't try to prolong the conversation unnecessarily\n`;
    prompt += `- Protect your interests strategically - be willing to give on some points to gain on others, but make the student work for every concession\n`;

    return prompt;
  }

  private buildEvaluationPrompt(config: NegotiationConfiguration, session: NegotiationSession): string {
    let prompt = `Evaluate the following negotiation session based on how well the student achieved their goals.\n\n`;

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

    prompt += `\n\nCONVERSATION TRANSCRIPT:\n`;
    session.messages.forEach(msg => {
      const speaker = msg.role === 'student' ? 'STUDENT' : msg.role === 'bot' ? 'BOT' : 'SYSTEM';
      prompt += `${speaker}: ${msg.content}\n`;
    });

    prompt += `\n\nProvide your evaluation in the following JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "type": "success" | "partial" | "failure" | "timeout",\n`;
    prompt += `  "feedback": "2-3 paragraphs of constructive feedback on the student's negotiation performance",\n`;
    prompt += `  "criteriaEvaluation": [\n`;
    prompt += `    {\n`;
    prompt += `      "goal": "exact text of the student's goal",\n`;
    prompt += `      "achievementLevel": "fail" | "close" | "achieve" | "exceed",\n`;
    prompt += `      "notes": "detailed explanation of how well this goal was achieved and why"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "botAnalysis": "1-2 paragraphs from the bot's perspective on how the negotiation went"\n`;
    prompt += `}\n\n`;

    prompt += `IMPORTANT - Achievement Level Guidelines:\n`;
    prompt += `For each student goal, evaluate how well they achieved it:\n`;
    prompt += `- "fail" (0%): The goal was not achieved at all or barely any progress made\n`;
    prompt += `- "close" (~70%): Significant progress toward the goal, got close but didn't fully achieve it\n`;
    prompt += `- "achieve" (~90%): Successfully achieved the goal as stated\n`;
    prompt += `- "exceed" (100%+): Not only achieved but exceeded the goal beyond expectations\n\n`;

    prompt += `CRITICAL - Feedback Requirements:\n`;
    prompt += `- If ANY goal received a rating below "exceed" (i.e., "achieve", "close", or "fail"), your feedback MUST include specific areas for improvement\n`;
    prompt += `- DO NOT say the negotiation was "perfect" or imply no improvement is needed unless ALL goals achieved "exceed" level\n`;
    prompt += `- For each non-"exceed" goal, provide concrete suggestions on what the student could have done better\n`;
    prompt += `- Be constructive but honest about gaps between performance and excellence\n\n`;

    prompt += `Determine the overall outcome type based on goal achievement:\n`;
    prompt += `- "success": Most goals achieved at "achieve" or "exceed" level\n`;
    prompt += `- "partial": Mix of achievement levels, some goals met\n`;
    prompt += `- "failure": Most goals at "fail" or "close" level\n`;
    prompt += `- "timeout": Session ended due to time limit before meaningful progress\n`;

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
