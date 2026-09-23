import { HistoryItem, ToneMode } from '../types';

export interface SampleDraft {
  id: string;
  title: string;
  category: string;
  iconName: string;
  originalText: string;
  clichéPhrases: string[];
  humanizedVariants: {
    Formal: string;
    Natural: string;
    Academic: string;
  };
}

export const SAMPLE_DRAFTS: SampleDraft[] = [
  {
    id: 'research-paper',
    title: 'Research Paper Excerpt',
    category: 'Academic / AI Research',
    iconName: 'article',
    originalText: `In today's fast-paced digital landscape, it is fundamentally crucial to acknowledge that machine learning paradigms facilitate transformative optimization methodologies across diverse industrial verticals.

Furthermore, delving into the multifaceted nuances of synthesized text generation reveals an undeniable tapestry of algorithmic sophistication. It goes without saying that humans demand authentic voice over synthetically uniform syntax.

In conclusion, the overarching imperative rests on refining communicative friction without diluting conceptual integrity.`,
    clichéPhrases: [
      "In today's fast-paced digital landscape",
      'Furthermore, delving into',
      'It goes without saying that',
      'undeniable tapestry of algorithmic sophistication'
    ],
    humanizedVariants: {
      Formal: `Modern teams are finding that practical machine learning drives genuine speed and clarity across real-world workflows, without the unnecessary buzzwords.

Looking closer at how language models generate text, one issue stands out clearly: predictable, sterile cadence tires readers quickly. People connect with authentic rhythm, nuanced word choice, and authentic human judgment.

Ultimately, the goal isn't dumbing down ideas—it's stripping away empty filler so the original point hits with maximum clarity and weight.`,
      Natural: `AI is proving genuinely useful for everyday team productivity, but only when we skip the corporate jargon.

When you read typical AI-generated articles, the robotic, repetitive rhythm sticks out immediately. Real readers crave personality, natural variations in sentence length, and sharp human perspective.

The real win isn't oversimplifying your arguments—it's clearing out hollow fluff so your strongest insights land clearly.`,
      Academic: `Recent empirical assessments indicate that applied algorithmic frameworks reliably enhance task throughput without necessitating rhetorical hyperbole.

An analytical examination of automated text generation reveals recurring syntactical homogeneity that degrades reader engagement. Effective communication requires rhythmic prosodic variation and calibrated semantic precision.

Consequently, modern language revision protocols should prioritize eliminating formulaic transitional artifacts while preserving rigorous methodological claims.`
    }
  },
  {
    id: 'marketing-pitch',
    title: 'Marketing Pitch',
    category: 'Product Launch',
    iconName: 'campaign',
    originalText: `We are thrilled to unleash our game-changing, best-in-class generative solution that empowers modern enterprises to supercharge their workflows.

By leveraging cutting-edge deep learning capabilities, our disruptive platform seamlessly bridges the gap between raw data and actionable synergy. It is important to note that our holistic approach unlocks unprecedented scalability.`,
    clichéPhrases: [
      'thrilled to unleash our game-changing',
      'supercharge their workflows',
      'leveraging cutting-edge',
      'bridges the gap between raw data and actionable synergy',
      'unlocks unprecedented scalability'
    ],
    humanizedVariants: {
      Formal: `We are introducing a focused revision engine designed to help engineering and product teams produce clearer documentation and customer communication.

Built around direct neural intent modeling, the tool highlights repetitive prose patterns and suggests more direct phrasing. Your team maintains technical precision while cutting editing cycles in half.`,
      Natural: `We built a writing tool that actually respects your audience's time.

Instead of stuffing paragraphs with empty buzzwords, it spots robotic phrasing and turns stiff text into sharp, engaging explanations. You keep your core message, but say it twice as clearly.`,
      Academic: `This publication presents an intent-preserving text refinement system targeted at reducing communicative entropy in technical disclosures.

Utilizing parameter-efficient cadence adjustments, the pipeline quantifiably reduces formulaic n-gram clusters while maintaining semantic fidelity across complex multi-step technical summaries.`
    }
  },
  {
    id: 'executive-memo',
    title: 'Executive Memo',
    category: 'Strategic Planning',
    iconName: 'business_center',
    originalText: `Moving forward in this dynamic ecosystem, stakeholders must align to foster collaborative synergies and maximize operational efficiency.

At this juncture, it is critical to embark on a transformative journey toward our north star metrics, ensuring we leave no stone unturned in our relentless pursuit of excellence.`,
    clichéPhrases: [
      'Moving forward in this dynamic ecosystem',
      'foster collaborative synergies',
      'At this juncture',
      'embark on a transformative journey',
      'leave no stone unturned'
    ],
    humanizedVariants: {
      Formal: `Over the coming quarter, our priority is tightening operational handoffs between engineering and product delivery.

We will focus our resources on two core performance indicators: reducing deployment latency and improving first-touch resolution for enterprise accounts.`,
      Natural: `Here is our focus for next quarter: streamlining how engineering and product work together day-to-day.

We are narrowing our focus to two numbers that matter most right now: speeding up release cycles and solving customer bottlenecks faster.`,
      Academic: `Quarterly strategic resource allocation will center on standardizing cross-functional execution protocols.

Measurement benchmarks will emphasize median latency in deployment pipelines and resolution velocity within mission-critical operational streams.`
    }
  }
];

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    title: 'AI Paradigm & Semantics Paper',
    timestamp: '12 minutes ago',
    originalText: `In today's fast-paced digital landscape, it is fundamentally crucial to acknowledge that machine learning paradigms facilitate transformative optimization methodologies across diverse industrial verticals. Furthermore, delving into the multifaceted nuances of synthesized text generation reveals an undeniable tapestry of algorithmic sophistication.`,
    revisedText: `Modern teams are finding that practical machine learning drives genuine speed and clarity across real-world workflows, without the unnecessary buzzwords. Looking closer at how language models generate text, one issue stands out clearly: predictable, sterile cadence tires readers quickly.`,
    wordCount: 142,
    cadenceScore: 98,
    aiDetectedOriginal: 89,
    aiDetectedRevised: 0,
    tone: 'Formal',
    intensity: 'Balanced',
    clichéFlags: 3
  },
  {
    id: 'hist-2',
    title: 'Q3 Enterprise Architecture Brief',
    timestamp: '2 hours ago',
    originalText: `We are thrilled to unleash our game-changing, best-in-class generative solution that empowers modern enterprises to supercharge their workflows. By leveraging cutting-edge deep learning capabilities, our disruptive platform seamlessly bridges the gap between raw data and actionable synergy.`,
    revisedText: `We are introducing a focused revision engine designed to help engineering and product teams produce clearer documentation and customer communication. Built around direct neural intent modeling, the tool highlights repetitive prose patterns and suggests more direct phrasing.`,
    wordCount: 88,
    cadenceScore: 96,
    aiDetectedOriginal: 94,
    aiDetectedRevised: 2,
    tone: 'Natural',
    intensity: 'Balanced',
    clichéFlags: 5
  },
  {
    id: 'hist-3',
    title: 'Neural Language Model Review',
    timestamp: 'Yesterday at 4:15 PM',
    originalText: `Delving deep into the multifaceted considerations surrounding autonomous agents, it becomes apparent that the overarching trajectory promises to revolutionize communicative paradigms.`,
    revisedText: `Studying autonomous agents shows that their primary impact will be how directly they handle everyday communication and structured tasks.`,
    wordCount: 64,
    cadenceScore: 99,
    aiDetectedOriginal: 91,
    aiDetectedRevised: 0,
    tone: 'Academic',
    intensity: 'Expressive',
    clichéFlags: 4
  }
];
