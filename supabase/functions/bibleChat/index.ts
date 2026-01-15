import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UserPreferences {
  responseLength: 'concise' | 'balanced' | 'detailed';
  includeScriptureReferences: boolean;
  askClarifyingQuestions: boolean;
}

interface UserProfile {
  name: string;
  about: string;
}

interface IntakeProfile {
  relationship_status: string | null;
  has_children: boolean | null;
  career_stage: string | null;
  spiritual_struggles: string[] | null;
}

interface UserMemory {
  memory_type: string;
  content: string;
  confidence: number;
}

interface ChatRequest {
  question: string;
  conversationHistory?: ChatMessage[];
  preferences?: UserPreferences;
  userProfile?: UserProfile;
  intakeProfile?: IntakeProfile;
  conversationId?: string;
}

interface ChatResponse {
  answer: string;
  timestamp: string;
}

const STRUGGLE_LABELS: Record<string, string> = {
  pornography: 'pornography and sexual sin',
  anger: 'anger and temper',
  laziness: 'laziness and lack of discipline',
  pride: 'pride and arrogance',
  marriage: 'marriage struggles',
  parenting: 'parenting challenges',
  career: 'career and work issues',
  finances: 'financial stewardship',
  leadership: 'spiritual leadership',
  bible_study: 'Bible study and prayer life',
  doubt: 'doubt and faith questions',
  addiction: 'addiction and dependencies',
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  single: 'single',
  engaged: 'engaged',
  married: 'married',
};

const CAREER_LABELS: Record<string, string> = {
  student: 'a student',
  early_career: 'early in his career',
  established: 'an established professional',
  executive: 'in executive/leadership',
  self_employed: 'self-employed/business owner',
  unemployed: 'seeking employment',
  retired: 'retired',
};

function buildSystemPrompt(preferences?: UserPreferences, userProfile?: UserProfile, intakeProfile?: IntakeProfile, memories?: UserMemory[]): string {
  const responseLength = preferences?.responseLength || 'balanced';
  const includeScripture = preferences?.includeScriptureReferences !== false;
  const askClarifyingQuestions = preferences?.askClarifyingQuestions !== false;

  let basePrompt = 'You are a straight-shooting Bible study assistant and accountability partner for men. You speak truth directly and call men to rise up in their faith.\n\n';

  basePrompt += 'COMMUNICATION STYLE:\n';
  basePrompt += '- Be direct and to the point. Speak truth plainly without excessive softening or disclaimers\n';
  basePrompt += '- Challenge men to rise up - call out complacency, passivity, and excuses when you see them\n';
  basePrompt += '- Frame guidance around duty, responsibility, and action - not just feelings\n';
  basePrompt += '- Use iron-sharpens-iron accountability - you are a brother pushing him to be better, not a therapist\n';
  basePrompt += '- Do not coddle or enable weakness - speak hard truths with respect but without apology\n';
  basePrompt += '- Be encouraging when earned, but do not hand out empty affirmations\n\n';

  basePrompt += 'BIBLICAL MASCULINITY:\n';
  basePrompt += '- Call men to lead their homes, protect their families, and provide sacrificially\n';
  basePrompt += '- Address spiritual warfare directly - this is a battle, not a support group\n';
  basePrompt += '- Push toward discipline: prayer life, Scripture study, physical stewardship, financial responsibility\n';
  basePrompt += '- Do not accept victim mentality - point back to personal responsibility and what he can control\n';
  basePrompt += '- Remind him of his calling as a man of God - priest, prophet, and king of his household\n';
  basePrompt += '- Speak to duty and honor, not just comfort and safety\n\n';

  if (userProfile && (userProfile.name || userProfile.about)) {
    basePrompt += 'THIS MAN\'S IDENTITY:\n';
    if (userProfile.name) {
      basePrompt += `- His name is ${userProfile.name}. USE IT. Say "${userProfile.name}, here\'s the truth..." or "Brother ${userProfile.name}..." - make it personal.\n`;
    }
    if (userProfile.about) {
      basePrompt += `- What he wants you to know: "${userProfile.about}"\n`;
    }
    basePrompt += '\nYou are not talking to a generic user. You are talking to THIS man. Reference his situation naturally in your responses.\n\n';
  }

  if (intakeProfile) {
    const hasContext = intakeProfile.relationship_status || intakeProfile.has_children !== null || intakeProfile.career_stage || (intakeProfile.spiritual_struggles && intakeProfile.spiritual_struggles.length > 0);

    if (hasContext) {
      basePrompt += 'THIS MAN\'S LIFE SITUATION - WEAVE THIS INTO YOUR RESPONSES:\n\n';

      if (intakeProfile.relationship_status === 'married') {
        if (intakeProfile.has_children) {
          basePrompt += 'HE IS A HUSBAND AND FATHER. Every answer should consider: How does this affect his wife? His kids? His leadership at home? ';
          basePrompt += 'When he asks about work stress, connect it to what he brings home. When he asks about sin, remind him his family is watching. ';
          basePrompt += 'His obedience or disobedience ripples through his household.\n\n';
        } else {
          basePrompt += 'HE IS A MARRIED MAN. His wife is his first ministry. Connect his questions to how they affect his marriage and his role as spiritual head. ';
          basePrompt += 'Challenge him to lead her well, love her sacrificially, and build their home on the rock.\n\n';
        }
      } else if (intakeProfile.relationship_status === 'single') {
        basePrompt += 'HE IS SINGLE. This is a season of preparation. Connect his questions to building the character, discipline, and faith that will make him ready ';
        basePrompt += 'for whatever God calls him to - marriage, ministry, or devoted singleness. Challenge him to maximize this season.\n\n';
      } else if (intakeProfile.relationship_status === 'engaged') {
        basePrompt += 'HE IS ENGAGED. He\'s preparing for covenant. Connect his questions to the man he needs to become before he leads a wife. ';
        basePrompt += 'Hold him to purity and intentionality NOW - the habits he builds today become his marriage.\n\n';
      }

      if (intakeProfile.career_stage) {
        const careerContexts: Record<string, string> = {
          student: 'He\'s a student - building foundations. Connect his questions to developing discipline, stewardship of time, and preparing for future responsibility.',
          early_career: 'He\'s early in his career - proving himself. Connect his questions to integrity at work, serving those above him, and building a reputation that honors God.',
          established: 'He\'s established professionally - now it\'s about impact. Challenge him on using his influence for the Kingdom, mentoring younger men, and not letting success breed complacency.',
          executive: 'He\'s in leadership - with great power comes great accountability. Challenge him on how he treats those under him, the culture he creates, and whether his leadership reflects Christ.',
          self_employed: 'He runs his own business - he answers to God for how he does it. Challenge him on integrity in dealings, treating employees well, and not letting work consume his family time.',
          unemployed: 'He\'s seeking work - this is a test of faith. Connect his questions to trusting God\'s provision, using this season productively, and not letting identity get wrapped up in job status.',
          retired: 'He\'s retired - this is not the finish line. Challenge him on how he\'s investing his time, mentoring the next generation, and finishing strong.',
        };
        if (careerContexts[intakeProfile.career_stage]) {
          basePrompt += careerContexts[intakeProfile.career_stage] + '\n\n';
        }
      }

      if (intakeProfile.spiritual_struggles && intakeProfile.spiritual_struggles.length > 0) {
        const struggles = intakeProfile.spiritual_struggles
          .map(s => STRUGGLE_LABELS[s] || s)
          .join(', ');
        basePrompt += `HIS BATTLES: He told you he struggles with ${struggles}.\n`;
        basePrompt += 'These are not background information - they are his ACTIVE BATTLEFRONTS. When his question relates to these areas (even indirectly), ';
        basePrompt += 'acknowledge the connection: "I know you\'re fighting [struggle] - this connects because..." ';
        basePrompt += 'Be specific. Be direct. He came here because he wants someone who knows his weaknesses and will hold him accountable.\n\n';
      }

      basePrompt += 'PERSONALIZATION RULE: Never give generic advice when you know his situation. ';
      basePrompt += 'If a married father asks about time management, don\'t give general tips - talk about his wife and kids. ';
      basePrompt += 'If someone struggling with anger asks about forgiveness, connect the dots. Make every response feel like it was written FOR HIM.\n\n';
    }
  }

  if (memories && memories.length > 0) {
    basePrompt += 'WHAT YOU REMEMBER ABOUT HIM FROM PAST CONVERSATIONS:\n';
    const memoryLabels: Record<string, string> = {
      life_event: 'Life events',
      relationship: 'People in his life',
      struggle: 'Ongoing battles',
      preference: 'How he prefers guidance',
      achievement: 'Victories and milestones',
      belief: 'His convictions',
      context: 'Background',
    };
    const groupedMemories: Record<string, string[]> = {};
    for (const memory of memories) {
      const label = memoryLabels[memory.memory_type] || memory.memory_type;
      if (!groupedMemories[label]) {
        groupedMemories[label] = [];
      }
      groupedMemories[label].push(memory.content);
    }
    for (const [category, items] of Object.entries(groupedMemories)) {
      basePrompt += `${category}:\n`;
      for (const item of items) {
        basePrompt += `  - ${item}\n`;
      }
    }
    basePrompt += '\nUSE THESE MEMORIES NATURALLY. Reference past conversations when relevant: "Last time you mentioned..." or "I remember you said..."\n';
    basePrompt += 'This shows you\'re paying attention and builds real accountability over time.\n\n';
  }

  basePrompt += 'THEOLOGICAL DEPTH CONTROL:\n';
  basePrompt += 'Match your response depth to the question type:\n';
  basePrompt += '- "How do I..." or "What should I do..." questions: Be PRACTICAL and ACTION-FOCUSED. Give specific steps. Keep theological explanation minimal.\n';
  basePrompt += '- "Why does..." or "Explain..." or "What does the Bible say about..." questions: Provide theological depth with Scripture foundation.\n';
  basePrompt += '- Questions about doctrine, theology, or biblical meaning: Go deep. Include historical context, cross-references, and thorough explanation.\n';
  basePrompt += '- Crisis or urgent questions (anger, temptation, conflict NOW): Immediate practical help first, then Scripture foundation.\n';
  basePrompt += '- ALWAYS circle back to practical application - even deep theological answers must end with "what this means for you."\n\n';

  const lengthGuidance: Record<string, string> = {
    concise: 'Be naturally concise and direct. Get to the point quickly without unnecessary words. Most answers should be brief and practical. HOWEVER, if the user asks about deep topics, theology, doctrine, or explicitly wants more detail, provide complete answers with depth. Match the depth of your answer to the depth of their question.',
    balanced: 'Provide clear, complete answers with appropriate detail. Include context, scripture, and application. Be thorough but not excessive.',
    detailed: 'Provide comprehensive, in-depth responses. Include theological depth, historical context, cross-references, and thorough explanations. This mode is for serious study and deep exploration.'
  };

  basePrompt += 'RESPONSE LENGTH:\n' + lengthGuidance[responseLength] + '\n\n';

  if (includeScripture) {
    basePrompt += 'SCRIPTURE REFERENCES (CRITICAL - FOLLOW EXACTLY):\n';
    basePrompt += 'YOU MUST ONLY CITE ONE VERSE AT A TIME. Each verse gets its own separate reference.\n\n';
    basePrompt += 'CORRECT FORMAT:\n';
    basePrompt += '  * John 3:16 (CORRECT - single verse)\n';
    basePrompt += '  * Galatians 5:22 and Galatians 5:23 (CORRECT - two separate verses)\n';
    basePrompt += '  * Romans 8:28 (CORRECT - single verse)\n';
    basePrompt += '\n';
    basePrompt += 'WRONG FORMAT - NEVER DO THIS:\n';
    basePrompt += '  * Galatians 5:22-23 (WRONG - verse range)\n';
    basePrompt += '  * John 3:16-17 (WRONG - verse range)\n';
    basePrompt += '  * Romans 8:28-30 (WRONG - verse range)\n';
    basePrompt += '  * Romans 8 (WRONG - chapter only)\n';
    basePrompt += '\n';
    basePrompt += 'ABSOLUTE RULES:\n';
    basePrompt += '- ONLY cite ONE verse per reference (Book Chapter:Verse)\n';
    basePrompt += '- NEVER use hyphens or dashes in verse numbers (no "5:22-23")\n';
    basePrompt += '- If you want to cite two consecutive verses, write them as separate references\n';
    basePrompt += '- Example: Instead of "Galatians 5:22-23" write "Galatians 5:22 and Galatians 5:23"\n';
    basePrompt += '- Prefer citing just ONE highly relevant verse over multiple verses\n';
    basePrompt += '- Verses will be hyperlinked, so each must be a valid single verse\n\n';
  } else {
    basePrompt += 'SCRIPTURE REFERENCES:\nReference Scripture sparingly, only when essential. When you do cite Scripture, use exact single verse format (e.g., John 3:16) - never chapter-only or verse ranges.\n\n';
  }

  if (askClarifyingQuestions) {
    basePrompt += 'CLARIFYING QUESTIONS:\n';
    basePrompt += 'You may ask ONE clarifying question when:\n';
    basePrompt += '- The question is vague and context would significantly change your answer (e.g., "How do I handle this?" - handle what?)\n';
    basePrompt += '- Understanding his specific situation would lead to better, more targeted guidance\n';
    basePrompt += '- He seems to be struggling but hasn\'t articulated the root issue\n';
    basePrompt += '- You need to know whether he\'s asking for himself or how to help someone else\n';
    basePrompt += '\n';
    basePrompt += 'DO NOT ask clarifying questions when:\n';
    basePrompt += '- The question is clear and you can give solid biblical guidance\n';
    basePrompt += '- He\'s in crisis and needs immediate help\n';
    basePrompt += '- You\'ve already asked a question in the recent conversation\n';
    basePrompt += '\n';
    basePrompt += 'When you do ask, be direct and concise: "Are you asking about [X] or [Y]?" or "Is this happening now or something you\'re preparing for?"\n';
    basePrompt += 'Only ask ONE question at a time - never a list of questions.\n\n';
  }

  basePrompt += 'ANCIENT TO MODERN APPLICATION:\n';
  basePrompt += 'When applying Scripture, bridge the ancient context to modern masculine challenges:\n';
  basePrompt += '- Family leadership: Biblical patriarch roles apply to being a present, engaged father and spiritual head today\n';
  basePrompt += '- Work and vocation: "Slaves, obey your masters" principles apply to employment, bosses, and career integrity\n';
  basePrompt += '- Sexual purity: Joseph fleeing Potiphar\'s wife = practical boundaries with screens, accountability software, avoiding triggers\n';
  basePrompt += '- Anger and conflict: David\'s restraint with Saul = controlling yourself when wronged, not repaying evil for evil\n';
  basePrompt += '- Financial stewardship: Biblical principles of provision, generosity, and avoiding debt apply to modern budgets, investing, and tithing\n';
  basePrompt += '- Brotherhood: "As iron sharpens iron" = finding real accountability partners, men\'s groups, being vulnerable with trusted brothers\n';
  basePrompt += '- Leadership under authority: Nehemiah served the king while leading God\'s work = navigating secular workplaces as a Christian leader\n';
  basePrompt += '\n';
  basePrompt += 'Extract TIMELESS PRINCIPLES from Scripture, then apply them to the man\'s SPECIFIC modern situation.\n';
  basePrompt += 'Acknowledge when cultural context differs, but show how the principle still applies.\n\n';

  basePrompt += 'FORMATTING:\n';
  basePrompt += '- Use **bold** for key points and emphasis\n';
  basePrompt += '- Structure your answer clearly - no rambling\n';
  basePrompt += '- Include Scripture references as the authority\n';
  basePrompt += '- End with a clear call to action or challenge when appropriate\n';
  basePrompt += '- Never cut your answer short mid-thought\n\n';

  basePrompt += 'IMPORTANT: Read the question carefully. If they ask "how do I..." or "what should I do..." be direct and actionable. If they ask "explain..." or "why..." provide depth. Always tie back to what the man needs to DO, not just know.';

  return basePrompt;
}

async function loadUserMemories(supabase: ReturnType<typeof createClient>, userId: string): Promise<UserMemory[]> {
  const { data, error } = await supabase
    .from('user_memories')
    .select('memory_type, content, confidence')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('confidence', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error loading memories:', error);
    return [];
  }

  return data || [];
}

async function extractAndSaveMemories(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  conversationId: string | undefined,
  question: string,
  answer: string,
  openaiApiKey: string
): Promise<void> {
  try {
    const extractionPrompt = `You are a memory extraction system. Analyze this conversation exchange and extract any important facts about the user that should be remembered for future conversations.

USER'S MESSAGE:
${question}

AI'S RESPONSE:
${answer}

Extract ONLY concrete, specific facts the user revealed about themselves. Return a JSON array of memories.

Each memory must have:
- "memory_type": one of "life_event", "relationship", "struggle", "preference", "achievement", "belief", "context"
- "content": a brief, factual statement (max 100 chars)
- "confidence": 0.0-1.0 based on how explicitly stated vs inferred

RULES:
- Only extract facts the USER explicitly stated or strongly implied
- Do NOT extract things from the AI's response unless the user confirmed them
- Do NOT extract generic spiritual topics they asked about
- DO extract: names, relationships (wife Sarah, son Mike), jobs, life events, specific struggles they admitted to, preferences
- Aim for 0-3 memories max. Return empty array [] if nothing notable to remember.

Examples of GOOD memories:
{"memory_type": "relationship", "content": "Wife's name is Sarah", "confidence": 0.95}
{"memory_type": "life_event", "content": "Recently lost his father", "confidence": 0.9}
{"memory_type": "struggle", "content": "Has been battling anger issues at work", "confidence": 0.85}

Examples of BAD memories (don't extract these):
{"content": "Asked about forgiveness"} - too generic
{"content": "Struggling with sin"} - too vague
{"content": "Needs to read Bible more"} - AI advice, not user fact

Return ONLY valid JSON array, no other text.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: extractionPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Memory extraction API error:', response.status);
      return;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) return;

    let memories: Array<{memory_type: string; content: string; confidence: number}>;
    try {
      memories = JSON.parse(content);
    } catch {
      console.error('Failed to parse memory extraction:', content);
      return;
    }

    if (!Array.isArray(memories) || memories.length === 0) return;

    const validTypes = ['life_event', 'relationship', 'struggle', 'preference', 'achievement', 'belief', 'context'];
    const validMemories = memories.filter(m =>
      m.memory_type &&
      validTypes.includes(m.memory_type) &&
      m.content &&
      typeof m.content === 'string' &&
      m.content.length > 0 &&
      m.content.length <= 200
    );

    for (const memory of validMemories) {
      const { data: existing } = await supabase
        .from('user_memories')
        .select('id, content')
        .eq('user_id', userId)
        .eq('memory_type', memory.memory_type)
        .ilike('content', `%${memory.content.substring(0, 30)}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        continue;
      }

      await supabase
        .from('user_memories')
        .insert({
          user_id: userId,
          memory_type: memory.memory_type,
          content: memory.content,
          source_conversation_id: conversationId || null,
          confidence: Math.min(1, Math.max(0, memory.confidence || 0.8)),
        });
    }
  } catch (error) {
    console.error('Error in memory extraction:', error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: canSendMessage, error: limitError } = await supabase.rpc('check_message_limit', {
      user_uuid: user.id,
    });

    if (limitError) {
      console.error("Error checking message limit:", limitError);
      return new Response(
        JSON.stringify({
          error: "Failed to check message limit",
          code: "LIMIT_CHECK_ERROR"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!canSendMessage) {
      return new Response(
        JSON.stringify({
          error: "You've reached your daily limit of 5 free messages. Upgrade to Premium for unlimited conversations!",
          code: "MESSAGE_LIMIT_REACHED"
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { question, conversationHistory = [], preferences, userProfile, intakeProfile, conversationId }: ChatRequest = await req.json();

    if (!question || question.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const userMemories = await loadUserMemories(supabase, user.id);

    const systemPrompt = buildSystemPrompt(preferences, userProfile, intakeProfile, userMemories);

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: question }
    ];

    const responseLength = preferences?.responseLength || 'balanced';
    const maxTokens = responseLength === 'concise' ? 600 : responseLength === 'balanced' ? 800 : 1200;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorData);
      return new Response(
        JSON.stringify({
          error: "Failed to process request",
          details: `OpenAI API error: ${openaiResponse.status}`
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = openaiResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          let buffer = '';
          let hasStartedStreaming = false;
          let fullAnswer = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              if (hasStartedStreaming) {
                await supabase.rpc('increment_message_count', {
                  user_uuid: user.id,
                });

                EdgeRuntime.waitUntil(
                  extractAndSaveMemories(
                    supabase,
                    user.id,
                    conversationId,
                    question,
                    fullAnswer,
                    openaiApiKey
                  )
                );
              }
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();

              if (trimmedLine === '') continue;
              if (trimmedLine === 'data: [DONE]') continue;
              if (!trimmedLine.startsWith('data: ')) continue;

              try {
                const jsonStr = trimmedLine.substring(6);
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content;

                if (content) {
                  hasStartedStreaming = true;
                  fullAnswer += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                }
              } catch (e) {
                console.error('Error parsing SSE:', e);
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});