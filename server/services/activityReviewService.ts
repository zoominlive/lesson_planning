// Server-side service - no auth token needed as this runs on the backend

interface ActivityReviewRequest {
  activities: Array<{
    id: string;
    title: string;
    description: string;
    rating: number | null;
    ratingFeedback: string | null;
    notes: string | null;
    materialsUsed: boolean | null;
    materialFeedback: string | null;
    teacherName: string;
    roomName: string;
    completedAt: string;
  }>;
  dateRange: {
    from: Date;
    to: Date;
  };
  totalActivities: number;
  averageRating: number;
  userFilter?: {
    userId: string;
    userName: string;
  };
}

interface ActivityReviewAnalysis {
  summary: string;
  activityConcerns: Array<{
    category: "activity" | "materials" | "outcomes";
    concern: string;
    affectedActivities: string[];
    severity: "low" | "medium" | "high";
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    actionItems: string[];
  }>;
  positiveHighlights: string[];
  overallScore: number;
  generatedAt: string;
}

export class ActivityReviewService {
  private static instance: ActivityReviewService;

  private constructor() {}

  static getInstance(): ActivityReviewService {
    if (!ActivityReviewService.instance) {
      ActivityReviewService.instance = new ActivityReviewService();
    }
    return ActivityReviewService.instance;
  }

  // Server-side method to build the analysis prompt
  buildAnalysisRequest(request: ActivityReviewRequest): { prompt: string; activities: any[]; stats: any } {
    const analysisPrompt = this.buildAnalysisPrompt(request);
    
    return {
      prompt: analysisPrompt,
      activities: request.activities,
      stats: {
        totalActivities: request.totalActivities,
        averageRating: request.averageRating,
      }
    };
  }

  buildAnalysisPrompt(request: ActivityReviewRequest): string {
    const activitiesWithFeedback = request.activities.filter(
      a => a.ratingFeedback || a.notes || a.materialFeedback
    );

    // Build the base prompt
    let prompt = `
Analyze the following completed childcare activities and their feedback to identify patterns, concerns, and areas for improvement.

Overview:
- Total Activities: ${request.totalActivities}
- Average Rating: ${request.averageRating.toFixed(2)}/5
- Date Range: ${request.dateRange.from.toLocaleDateString()} to ${request.dateRange.to.toLocaleDateString()}`;

    // Add teacher-specific context if a user filter is applied
    if (request.userFilter) {
      prompt += `
- Teacher Filter Applied: ${request.userFilter.userName}

IMPORTANT: All activities in this analysis were completed by ${request.userFilter.userName}. 
Please pay special attention to:
- Any patterns in the feedback that may be related to this teacher's specific teaching style or approach
- Consistent strengths or areas for improvement across their activities
- Teacher-specific recommendations that could enhance their performance
- Whether the feedback patterns suggest any teacher-related factors affecting activity outcomes`;
    }

    prompt += `

Activities with Feedback (${activitiesWithFeedback.length}):
${activitiesWithFeedback.map(activity => `
Activity: ${activity.title}
Rating: ${activity.rating || 'N/A'}/5
Teacher: ${activity.teacherName}
Room: ${activity.roomName}
Materials Used: ${activity.materialsUsed === null ? 'Not specified' : activity.materialsUsed ? 'Yes' : 'No'}
Activity Feedback: ${activity.ratingFeedback || 'None'}
Teaching Notes: ${activity.notes || 'None'}
Material Feedback: ${activity.materialFeedback || 'None'}
`).join('\n---\n')}

Please analyze this data and provide:
1. Key concerns related to activities, materials, or children's outcomes`;

    if (request.userFilter) {
      prompt += ` (including any teacher-specific patterns for ${request.userFilter.userName})`;
    }

    prompt += `
2. Specific recommendations to address these concerns`;

    if (request.userFilter) {
      prompt += ` (include teacher-specific suggestions for ${request.userFilter.userName} if patterns are identified)`;
    }

    prompt += `
3. Positive highlights to celebrate
4. An overall effectiveness score (0-100)

Focus on practical, actionable insights that teachers and administrators can implement.`;

    if (request.userFilter) {
      prompt += `
Remember to consider teacher-specific factors since all activities were conducted by ${request.userFilter.userName}.`;
    }

    return prompt;
  }
}

export const activityReviewService = ActivityReviewService.getInstance();

export const calculateOverallScore = (activities: any[]): number => {
  if (activities.length === 0) return 0;
  
  let totalScore = 0;
  let weightedCount = 0;
  
  // Calculate weighted score based on multiple factors
  activities.forEach((activity) => {
    // Educational Outcomes weight (35%)
    const educationalRating = activity.record?.educationalRating || activity.record?.rating || 0;
    const educationalScore = educationalRating * 20; // Convert 1-5 to 0-100
    
    // Activity rating weight (25%)
    const ratingScore = (activity.record?.rating || 0) * 20; // Convert 1-5 to 0-100
    
    // Feedback sentiment weight (25%)
    let sentimentScore = 50; // Neutral baseline
    const feedback = (activity.record?.notes || '') + ' ' + (activity.record?.ratingFeedback || '');
    if (feedback.toLowerCase().includes('excellent') || feedback.toLowerCase().includes('loved') || feedback.toLowerCase().includes('great') || feedback.toLowerCase().includes('met')) {
      sentimentScore = 90;
    } else if (feedback.toLowerCase().includes('good') || feedback.toLowerCase().includes('enjoyed')) {
      sentimentScore = 70;
    } else if (feedback.toLowerCase().includes('difficult') || feedback.toLowerCase().includes('struggled') || feedback.toLowerCase().includes('lost interest') || feedback.toLowerCase().includes('not met')) {
      sentimentScore = 30;
    }
    
    // Material effectiveness weight (15%)
    const materialScore = activity.record?.materialsUsed ? 85 : 40;
    
    // Calculate weighted average for this activity
    const activityScore = (educationalScore * 0.35) + (ratingScore * 0.25) + (sentimentScore * 0.25) + (materialScore * 0.15);
    
    totalScore += activityScore;
    weightedCount++;
  });
  
  return Math.round(totalScore / weightedCount);
};