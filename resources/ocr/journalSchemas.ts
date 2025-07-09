const morning = {
  title: "Morning Journal",
  description: "A simple journal format which is a morning journal.",
  type: "object",
  isMorningJournal: {
    description:
      'If there is a written sentence "MORNING PAGE" it will be true. Otherwise analyse the images and determine if its a morning journal or not. The images should have dream essence question or mood contribution or affirmations or mantra or all of them. If not it will be false.',
    type: "boolean",
  },
  isDreamt: {
    description: "answer of DID YOU DREAM? question. If its empty keep it false.",
    type: "boolean",
  },
  capturedEssence: {
    description:
      "answer of captured essence paragraph. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  moodScore: {
    description: `The circled face icon. It should be under "CIRCLE YOUR MOOD". If the first emoji is marked its 1 if last its 5. If there is no marking then keep it null.`,
    type: "number",
  },
  moodContribution: {
    description:
      "answer of What do you think contributed to your mood today? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  affirmations: [
    {
      description:
        "the text after I AM. which is in the POSITIVE AFFIRMATIONS block. If its empty keep it empty array with no element.",
      type: "string",
    },
  ],
  gratitudes: [
    {
      description:
        "the text after I AM GRATEFUL FOR: numeric. If its empty keep it empty array no element.",
      type: "string",
    },
  ],
  excitements: [
    {
      description:
        "the text after I AM EXCITED ABOUT: numeric. If its empty keep it empty array no element.",
      type: "string",
    },
  ],
  mantra: {
    description:
      "paragraph after MY MANTRA heading. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
};
const evening = {
  title: "Evening Journal",
  description: "A simple journal format which is a evening journal.",
  type: "object",
  isEveningJournal: {
    description: 'If there is a written sentence "EVENING PAGE" it will be true. Otherwise false.',
    type: "boolean",
  },
  moodScore: {
    description:
      "The circled face icon. If first its 1 if last its 5. In the MOOD TRACKER: section",
    type: "number",
  },
  insight: {
    description:
      "answer of What is one unique thought or insight you had today? question. In the THOUGHT FOR THE DAY section",
    type: "string",
  },
  insightImpact: {
    description:
      "answer of How can this insight change your perspective or actions? question. In the THOUGHT FOR THE DAY section",
    type: "string",
  },
  success: {
    description:
      "answer of Reflect on why these things went well? question. In the WHAT WENT WELL section",
    type: "string",
  },
  changes: {
    description:
      "answer of Reflect on What steps can you take to make this change happen?? question. In the CHANGES FOR TOMORROW section",
    type: "string",
  },
  dreammagic: [
    {
      description:
        "the text after I AM. which is in the DREAM MAGIC block. If its empty keep it empty array with no element.",
      type: "string",
    },
  ],
};
const gratitudeAction = {
  title: "Gratitude Action Journal",
  description: "A simple journal format which is a Gratitude Action journal.",
  type: "object",
  isGratitudeAction: {
    description:
      'If there is a written sentence "DAILY ACTION TRACKING" it will be true. Otherwise false.',
    type: "boolean",
  },
  isCompleted: {
    description: "answer of Did you complete today’s daily gratitude action?",
    type: "boolean",
  },
  note: {
    description: `paragraph after 'WRITE A DETAILED THANK-YOU NOTE TO YOURSELF'. It can be in two pages. So merge the two pages thank you note under this field.. Also keep the new line. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy. `,
    type: "string",
  },
  reflection: {
    description:
      "paragraph after If yes, how did it make you feel to express gratitude? question. In Daily Action TRACKING section.  It will be null if Did you complete today’s daily gratitude action? is no",
    type: "string",
  },
  obstacles: {
    description:
      "paragraph after If yes, how did it make you feel to express gratitude? question. In Daily Action TRACKING section. It will be null if Did you complete today’s daily gratitude action? is yes",
    type: "string",
  },
};
const weeklyReflection = {
  title: "Weekly Reflection Journal",
  description: "A simple journal format which is a weekly reflection.",
  type: "object",
  isWeeklyReflection: {
    description:
      'If there is a written sentence "WEEKLY REFLECTION" it will be true. Otherwise false.',
    type: "boolean",
  },
  wins: {
    description:
      "answer of What were your biggest wins this week? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  challenges: {
    description:
      "answer of What challenges did you overcome, and how did you do it? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  lessons: {
    description:
      "answer of What did you learn from the experiences of this week? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
};
const weeklyChallenge = {
  title: "Weekly Challenge Journal",
  description: "A simple journal format which is a weekly challenge.",
  type: "object",
  isWeeklyChallenge: {
    description:
      'If there is a written sentence "WEEKLY CHALLENGE" it will be true. Otherwise false.',
    type: "boolean",
  },
  eulogy: {
    description:
      'paragraph after "WRITE YOUR EULOGY" and "WRITE YOUR EULOGY (CONT.)". The text can be written up to three images. Read and return text from all the images. All the text written in the eulogy images. Return all of them. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  reward: {
    description:
      "answer of What reward will you give yourself for completing your weekly challenge? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  motivation: {
    description:
      "the text after Reflect on how celebrating small wins contributes to your overall happiness and motivation. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  purpose: {
    description:
      "answer of WHY IS THIS CHALLENGE IMPORTANT TO YOU? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  success: {
    description:
      "answer of WWHAT WILL SUCCESS LOOK LIKE AT THE END OF THE WEEK? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  focus: {
    description:
      "answer of What will you focus on next week to continue your growth and progress? question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.",
    type: "string",
  },
  isCompleted: {
    description: "If eulogy is written then it should be true. Else it will be false.",
    type: "boolean",
  },
};

const visionsHighestSelf = {
  title: "Your Highest Self",
  description: "A simple journal format which is a vision journal.",
  type: "object",
  isHighestSelf: {
    description:
      'If there is a written sentence "YOUR HIGHEST SELF" it will be true. Otherwise false.',
    type: "boolean",
  },
  name: {
    description:
      'paragraph after "Name and Identity:". In Highest Self section Awnswer of "If your highest self had a name, what would it be? How would you introduce yourself in this ideal form?" question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  abilities: {
    description:
      'paragraph after "Powers and Abilities:". In Highest Self section Awnswer of "Reflect on the qualities you admire in superheroes. What powers or abilities does your highest self possess? Think beyond physical abilities—consider mental strength, emotional resilience, and moral integrity." question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  purpose: {
    description:
      'paragraph after "Mission and Purpose:". In Highest Self section Awnswer of "What is the primary mission of your highest self? What are you here to achieve or protect? How do you plan to make a difference in the world?" question. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  traits: {
    description:
      'Answer paragraph after "Signature Traits: Identify the key traits that define your highest self. Are you compassionate like Wonder Woman, determined like Batman, or wise like Black Panther? Describe these traits in detail." question In Highest Self section. If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  symbolImage: {
    description: `drawing after "Symbols and Emblems:". In Highest Self section bounds of "Does your highest self have a symbol or emblem that represents your core values and mission? Draw or describe this symbol." question. Give me the image bounds for cropping. Also give me the context index number where the content was found. Object structure should be like this: '{ xMin: number; xMax: number; yMin: number; yMax: number, index: number }'.`,
    type: "object",
  },
};
const visionsMantra = {
  title: "Your Mantra",
  description: "A simple journal format which is a vision journal.",
  type: "object",
  isMantra: {
    description: 'If there is a written sentence "YOUR Mantra" it will be true. Otherwise false.',
    type: "boolean",
  },
  mantra: {
    description:
      'paragraph after "Your mantra is a powerful phrase or sentence that encapsulates your highest aspirations and values. It should inspire and motivate you every day. Write your mantra here and commit to reading it daily:". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
};
const visionsCreed = {
  title: "Your Creed",
  description: "A simple journal format which is a vision journal.",
  type: "object",
  isCreed: {
    description: 'If there is a written sentence "YOUR Creed" it will be true. Otherwise false.',
    type: "boolean",
  },
  creed: {
    description:
      'paragraph after "YOUR CREED". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
};

const visionsDiscovery = {
  title: "Your Self Discovery",
  description: "A simple journal format which is a vision journal.",
  type: "object",
  isDiscovery: {
    description:
      'If there is a written sentence "SELF DISCOVERY" it will be true. Otherwise false.',
    type: "boolean",
  },
  qualities: {
    description:
      'paragraph after "WHAT QUALITIES DO OTHERS MOST ADMIRE IN ME? Seek feedback from five people who know you well. What positive traits and behaviors do they appreciate about you?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  achievements: {
    description:
      'paragraph after "WHAT ARE MY TOP 5 ACHIEVEMENTS IN LIFE? List your most significant accomplishments. How have these achievements shaped who you are today?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  importance: {
    description:
      'paragraph after "WHAT IS MOST IMPORTANT IN MY LIFE? Prioritize your core values and relationships. What matters most to you, and why?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  selfValues: {
    description:
      'paragraph after "WHAT ARE MY PERSONAL VALUES? Define the principles and beliefs that guide your decisions and actions. Are you living in alignment with these values?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  lifestyle: {
    description:
      'paragraph after "AM I LIVING BY MY VALUES? Assess your current lifestyle and choices. Are they consistent with your declared values, and if not, what changes can you make?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  foreseen: {
    description:
      'paragraph after "IF I HAVE SIX MONTHS LEFT TO LIVE, WHAT WILL I DO? Contemplate your priorities if time were limited. What activities, goals, and relationships would you focus on?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  relationships: {
    description:
      'paragraph after "WITH WHOM WILL I SPEND TIME? Identify the people who matter most to you. How can you nurture these relationships more deeply?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  legacy: {
    description:
      'paragraph after "HOW DO I WANT TO BE REMEMBERED WHEN I’M GONE? Consider your legacy. What impact do you want to leave on the world and in the lives of others?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  improvement: {
    description:
      'paragraph after "WHAT WOULD I LIKE TO IMPROVE? Recognize areas in your life where you want to grow. What steps can you take to initiate positive change?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  selfEvaluation: {
    description:
      'paragraph after "HAVE A LOOK AT YOURSELF AS A THIRD PERSON. WHAT DO YOU SEE? Objectively evaluate your life and actions. What strengths and areas for improvement can you identify?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  interests: {
    description:
      'paragraph after "WHAT DO I LOVE? Explore your deep affections and interests. How can you integrate more of what you love into your daily routine?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  triggers: {
    description:
      'paragraph after "WHAT SCARES ME OR CAUSES ME TO PROCRASTINATE? Identify your fears and procrastination triggers. How can you confront and overcome these obstacles?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  envision: {
    description:
      'paragraph after "WHAT WOULD I DO IF I WASN’T AFRAID OF ANYTHING? Envision a fearless version of yourself. What actions would you take, and what dreams would you pursue?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  milestones: {
    description:
      'paragraph after "WHAT DOES A SUCCESSFUL LIFE LOOK LIKE FOR ME? Define success on your own terms. What milestones and experiences signify a fulfilling and accomplished life?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
  contributions: {
    description:
      'paragraph after "WHAT DO I WANT TO GIVE BACK TO THIS WORLD? Reflect on your desire to make a difference. How can you contribute positively to your community and the world?". If its empty or there is no match with the question i provide keep it null. Do not genereate on your own. Also if there is a word gynergy or Gynergy keep it. Do not rename it to energy.',
    type: "string",
  },
};

export default {
  visionsHighestSelf,
  visionsMantra,
  visionsCreed,
  visionsDiscovery,
  morning,
  evening,
  gratitudeAction,
  weeklyReflection,
  weeklyChallenge,
};
