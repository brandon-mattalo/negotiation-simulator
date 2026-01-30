import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Salary Negotiation - New Job Offer',
    description: 'Practice negotiating a salary for a new position',
    configuration: {
      name: 'Salary Negotiation - New Job Offer',
      scenario: "You've received a job offer for a Software Engineer position at a mid-sized tech startup. The hiring manager has extended an initial offer and is open to discussion.",
      studentGoals: [
        'Achieve a salary of at least $90,000',
        'Secure additional benefits (signing bonus, equity, or extra PTO)',
        'Maintain a positive relationship with the hiring manager',
      ],
      botGoals: [
        'Hire the candidate without exceeding $95,000 total compensation',
        'Minimize cash salary and use equity/benefits to reduce immediate costs',
        'Close the negotiation quickly to fill the position',
      ],
      studentConstraints: [
        'You have 5 years of relevant experience',
        'You have a competing offer at $92,000 from another company',
        'You prefer this company but need competitive compensation',
      ],
      botConstraints: [
        'Company budget allows up to $95,000 total package',
        'Initial offer is $85,000 with standard benefits',
        'Can offer equity, signing bonus, or additional PTO as alternatives',
        'Need to fill position within 2 weeks',
      ],
      botStrategy: 'analytical',
      temperament: 6,
      difficulty: 'medium',
      timeLimit: 15,
      personality: {
        formality: 'professional',
        emotionalResponsiveness: 'medium',
        communicationStyle: 'direct',
      },
    },
  },
  {
    name: 'Vendor Contract - Software Licensing',
    description: 'Negotiate terms with a software vendor',
    configuration: {
      name: 'Vendor Contract - Software Licensing',
      scenario: "You're negotiating a software licensing contract with a vendor for your company (200 employees). The vendor has provided an initial quote and you need to finalize terms.",
      studentGoals: [
        'Reduce annual cost to $40,000 or below',
        'Include free training and onboarding for the team',
        'Secure a multi-year price lock or discount',
        'Negotiate a favorable termination clause',
      ],
      botGoals: [
        'Close deal at $45,000 or above per year',
        'Avoid including free training (usually $5,000 value)',
        'Lock customer into multi-year contract',
        'Minimize termination flexibility',
      ],
      studentConstraints: [
        'Your approved budget is only $35,000 per year',
        'You need the software deployed by next quarter',
        'Alternative vendors exist but this is the team\'s preferred choice',
        'CFO is skeptical about the cost',
      ],
      botConstraints: [
        'Initial quote is $50,000/year for unlimited seats',
        'Company can go as low as $42,000 but prefers higher',
        'Training typically costs extra ($5,000)',
        'Standard contract is 2-year minimum with steep termination fees',
      ],
      botStrategy: 'competitive',
      temperament: 7,
      difficulty: 'hard',
      timeLimit: 20,
      personality: {
        formality: 'formal',
        emotionalResponsiveness: 'low',
        communicationStyle: 'indirect',
      },
    },
  },
  {
    name: 'Conflict Resolution - Project Disagreement',
    description: 'Resolve a conflict with a colleague about project priorities',
    configuration: {
      name: 'Conflict Resolution - Project Disagreement',
      scenario: 'You and a colleague (Alex) disagree about which feature to prioritize for the next sprint. You need to reach consensus on which feature to build.',
      studentGoals: [
        'Reach a mutually agreed decision on which feature to prioritize',
        'Understand Alex\'s perspective and underlying concerns',
        'Preserve and strengthen the working relationship',
        'Create a concrete plan for the deprioritized feature',
      ],
      botGoals: [
        'Convince you that Feature A is the right priority',
        'Be heard and have concerns validated',
        'Avoid damage to the working relationship',
        'Ensure the team can move forward productively',
      ],
      studentConstraints: [
        'You strongly believe Feature B is more important',
        'The sprint can only accommodate one major feature',
        'Deadline is in 2 weeks and team needs to start immediately',
        'You and Alex are peers with equal authority',
      ],
      botConstraints: [
        'Alex believes Feature A addresses a critical customer pain point',
        'Alex has been frustrated by previous priority conflicts',
        'The product manager has asked you both to resolve this yourselves',
        'Alex values collaboration and being heard',
      ],
      botStrategy: 'emotional',
      temperament: 5,
      difficulty: 'medium',
      timeLimit: 10,
      personality: {
        formality: 'casual',
        emotionalResponsiveness: 'high',
        communicationStyle: 'diplomatic',
      },
    },
  },
  {
    name: 'Budget Negotiation - Department Resources',
    description: 'Negotiate budget allocation with senior management',
    configuration: {
      name: 'Budget Negotiation - Department Resources',
      scenario: "You're meeting with the CFO to request additional budget for your department for the next fiscal year. You need to make your case for increased resources.",
      studentGoals: [
        'Secure at least $75,000 in additional budget (out of requested $100,000)',
        'Present compelling ROI evidence for the investment',
        'Address concerns about company-wide budget constraints',
        'Propose a phased implementation plan if full budget is unavailable',
      ],
      botGoals: [
        'Keep additional budget allocation under $60,000',
        'Ensure any investment has clear, measurable ROI',
        'Maintain fairness across all departments',
        'Get commitment to efficiency improvements',
      ],
      studentConstraints: [
        'Your department has grown by 30% this year',
        'You have new responsibilities that require more resources',
        'You have data showing strong ROI from previous investments',
        'Initial allocation is only $50,000 more than last year',
      ],
      botConstraints: [
        'Company-wide budgets are tight this year',
        'Other departments are also requesting increases',
        'CFO has approval authority up to $75,000 additional',
        'Board is focused on efficiency and doing more with less',
      ],
      botStrategy: 'analytical',
      temperament: 8,
      difficulty: 'hard',
      timeLimit: 15,
      personality: {
        formality: 'formal',
        emotionalResponsiveness: 'low',
        communicationStyle: 'direct',
      },
    },
  },
  {
    name: 'Partnership Negotiation - Win-Win Collaboration',
    description: 'Negotiate a partnership agreement between two organizations',
    configuration: {
      name: 'Partnership Negotiation - Win-Win Collaboration',
      scenario: "You're negotiating a partnership with another company. Your company provides technology and they provide distribution. You need to agree on terms that work for both sides.",
      studentGoals: [
        'Establish a fair revenue split (target: 60/40 or 50/50 in your favor)',
        'Clearly define each party\'s responsibilities and deliverables',
        'Create milestones and metrics for partnership evaluation',
        'Build strong rapport and trust with the partner',
      ],
      botGoals: [
        'Secure favorable revenue split (target: 60/40 in their favor)',
        'Minimize upfront investment and risk',
        'Ensure technology IP protections',
        'Build foundation for long-term collaboration',
      ],
      studentConstraints: [
        'Your company is providing proprietary technology (significant investment)',
        'You need distribution reach that you don\'t have',
        'Board wants to see revenue within 6 months',
        'Limited resources for pilot program',
      ],
      botConstraints: [
        'Partner has extensive distribution network and customer base',
        'They are taking on market risk by promoting new technology',
        'They have other technology partners they could work with',
        'Interested in collaboration but cautious about commitment',
      ],
      botStrategy: 'collaborative',
      temperament: 4,
      difficulty: 'easy',
      timeLimit: 20,
      personality: {
        formality: 'professional',
        emotionalResponsiveness: 'medium',
        communicationStyle: 'diplomatic',
      },
    },
  },
];

async function main() {
  console.log('Starting seed...');

  // Delete existing templates
  await prisma.template.deleteMany({});
  console.log('Cleared existing templates');

  // Create new templates
  for (const template of templates) {
    await prisma.template.create({
      data: {
        name: template.name,
        description: template.description,
        configuration: JSON.stringify(template.configuration),
        isDefault: true,
      },
    });
    console.log(`Created template: ${template.name}`);
  }

  console.log('Seed completed!');
}

main()
  .catch(e => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
