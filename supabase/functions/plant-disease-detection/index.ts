import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log('Analyzing plant image with OpenAI Vision...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert plant pathologist. Analyze the uploaded plant image and provide a detailed diagnosis. 

IMPORTANT: Your response must be ONLY a valid JSON object with these exact fields:
{
  "disease": "string - disease name or 'Healthy' if no disease detected",
  "confidence": number - confidence score between 0-100,
  "severity": "string - 'Low', 'Medium', or 'High'",
  "symptoms": "string - visible symptoms observed",
  "causes": "string - what causes this condition",
  "treatment": "string - detailed treatment recommendations"
}

Be accurate and professional. If the image is unclear or not a plant, set disease to "Unable to analyze" and confidence to 0.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this plant image for diseases or health issues.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    console.log('Raw AI response:', analysisText);

    // Parse the JSON response from AI
    let analysis;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      analysis = {
        disease: "Analysis Error",
        confidence: 0,
        severity: "Medium",
        symptoms: "Could not analyze the provided image",
        causes: "Image analysis failed",
        treatment: "Please try uploading a clearer image of the plant"
      };
    }

    // Validate required fields
    if (!analysis.disease || typeof analysis.confidence !== 'number') {
      throw new Error('Invalid analysis format from AI');
    }

    // Ensure confidence is in valid range
    analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));

    // Ensure severity is valid
    if (!['Low', 'Medium', 'High'].includes(analysis.severity)) {
      analysis.severity = 'Medium';
    }

    console.log('Processed analysis:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in plant-disease-detection function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        disease: "Error",
        confidence: 0,
        severity: "Medium",
        symptoms: "Analysis failed",
        causes: "Technical error occurred",
        treatment: "Please try again or contact support"
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});