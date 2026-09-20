/**
 * Local Fallback Topic Planning Provider
 * 
 * Provides verified local curricula for core topics (Python, Calculus, ML, Photosynthesis, Fractions)
 * and structured synthesis for arbitrary custom topics when Gemini is offline or unconfigured.
 */

import { TopicPlanner } from "@/lib/ai/types";
import { TopicCurriculumPlan } from "@/types/topic-path";
import { generateTopicCurriculum } from "@/lib/topic-curriculum/sample-topics";

export class FallbackTopicPlanner implements TopicPlanner {
  public readonly name = "FallbackTopicPlanner";

  public async planTopic(topic: string): Promise<TopicCurriculumPlan> {
    const plan = generateTopicCurriculum(topic);
    return plan;
  }
}
