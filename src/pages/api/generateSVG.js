import { OpenAI } from 'openai';
const HF_TOKEN = import.meta.env.HF_TOKEN;
export const POST = async ({ request }) => {
    console.log(request);
    const { prompt } = await request.json();
    const client = new OpenAI({
      baseURL: import.meta.env.HF_URL,
      apiKey: HF_TOKEN,
    });
        const chatCompletion = await client.chat.completions.create({
    model: "openai/gpt-oss-20b:hyperbolic",
    messages: [
      {
          role: "system", 
          content: "You are an SVG code generator. Generate SVG code for the following prompt." 
      },
        {
            role: "user",
            content: prompt,    
        },
    ],
  });
    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message.content || "";
    console.log('message', message); // Affiche le message généré dans la console pour le débogage
    
    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.match(/<svg[\s\S]*?<\/svg>/i);
    // Retourne une réponse JSON contenant le SVG ou une chaîne vide si aucun SVG n'est trouvé
    return new Response(JSON.stringify({ svg: svgMatch ? svgMatch[0] : "" }), {
      headers: { "Content-Type": "application/json" },
    });
};