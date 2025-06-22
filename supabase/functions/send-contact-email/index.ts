import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const TO_EMAIL = 'engineworks.iwasaki@gmail.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AIコメンテーター <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `【お問い合わせ】${subject}`,
        reply_to: email,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">新しいお問い合わせがありました</h2>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>お名前:</strong> ${name}</p>
              <p><strong>メールアドレス:</strong> ${email}</p>
              <p><strong>件名:</strong> ${subject}</p>
            </div>
            
            <div style="background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h3 style="color: #555; margin-top: 0;">メッセージ内容:</h3>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
            
            <p style="color: #888; font-size: 12px;">
              このメールはAIコメンテーターのお問い合わせフォームから送信されました。
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});