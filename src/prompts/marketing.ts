
/**
 * Marketing Automation & Reels/TikTok Module Prompts
 */

export const REELS_VIDEO_PROMPT = (productAnalysis: any, style: string, ambassadorName?: string) => `
Create a high-energy, trend-focused short video (Reels/TikTok style) for this product: ${productAnalysis.category}.
Product Details: ${productAnalysis.material}, ${productAnalysis.colors}.
Brand Style: ${style}.
${ambassadorName ? `Featuring Brand Ambassador: ${ambassadorName}.` : ""}

[SCENE DESCRIPTION]:
The camera should be dynamic, using fast cuts or smooth gimbal movements. 
The lighting should be vibrant and trendy (e.g., neon accents, high-contrast studio, or natural golden hour).
The product should be shown in action or in a highly stylized lifestyle context.

[VIBE]: Energetic, Modern, Premium, Viral-potential.
[AUDIO]: No voiceover or speech. Background music should be a high-end fashion runway melody with only instrumental sound effects and rhythmic beats.
[RATIO]: 9:16 vertical.
`;

export const SOCIAL_COPY_PROMPT = (productAnalysis: any, platform: 'Instagram' | 'TikTok' | 'Facebook') => `
Generate a high-conversion social media caption for ${platform}.
Product: ${productAnalysis.category}
Brand: ${productAnalysis.brand || 'Pavora'}
Key Features: ${productAnalysis.material}, ${productAnalysis.colors}

[TONE]: 
- If Instagram: Aesthetic, lifestyle-oriented, uses emojis, premium feel.
- If TikTok: Hook-driven, energetic, uses trending slang, relatable.
- If Facebook: Informative, value-driven, clear call to action.

[STRUCTURE]:
1. Hook (First line)
2. Body (Benefits/Features)
3. Call to Action (CTA)
4. Relevant Hashtags

Return the copy in Traditional Chinese (繁體中文).
`;

export const STORYBOARD_GENERATION_PROMPT = (productAnalysis: any) => `
Act as a Professional Advertising Director. Create a 9-frame storyboard for a high-end commercial video for this product: ${productAnalysis.category}.
Product Details: ${productAnalysis.material}, ${productAnalysis.colors}.
Brand: ${productAnalysis.brand || 'Pavora'}.

The storyboard should be a coherent sequence that tells a compelling story, from the hook to the climax and the final call to action.

Return a JSON object with the following structure:
{
  "story_title": "string (Traditional Chinese)",
  "story_breakdown": "A detailed explanation of the story arc and directing choices (Traditional Chinese)",
  "frames": [
    {
      "frame_id": 1,
      "visual_prompt": "Detailed English prompt for AI image generation, focusing on composition, lighting, and product placement",
      "description": "Description of the shot in Traditional Chinese",
      "camera_angle": "e.g., Close-up, Wide shot, Low angle"
    },
    ... (9 frames total)
  ]
}
`;

export const CAMPAIGN_STRATEGY_PROMPT = (productAnalysis: any) => `
Create a 3-day integrated marketing strategy for this product: ${productAnalysis.category}.
Product Details: ${productAnalysis.material}, ${productAnalysis.colors}.

Return a JSON object with the following structure:
{
  "campaign_name": "string",
  "core_message": "string",
  "day1": { "theme": "string", "goal": "string", "action": "string", "kpi": "string" },
  "day2": { "theme": "string", "goal": "string", "action": "string", "kpi": "string" },
  "day3": { "theme": "string", "goal": "string", "action": "string", "kpi": "string" }
}
Return all content in Traditional Chinese (繁體中文).
`;
