import { OpenAI } from 'openai';
const BASE_URL = import.meta.env.HF_URL;
const ACCESS_TOKEN = import.meta.env.HF_TOKEN;

export const POST = async ({ request }) => {
    // Affiche la requête dans la console pour le débogage
    console.log(request);

    // Extraction des données du corps de la requête
    const requestData = await request.json();
    
    // Gestion des deux formats possibles: { prompt } ou { messages }
    let messages;
    if (requestData.prompt) {
        // Format ancien: convertir le prompt en message
        messages = [{
            role: "user",
            content: requestData.prompt
        }];
    } else if (requestData.messages && Array.isArray(requestData.messages)) {
        // Format nouveau: utiliser directement les messages
        messages = requestData.messages;
    } else {
        // Fallback en cas de format inattendu
        messages = [];
    }
    
    // Initialisation du client OpenAI avec l'URL de base et le token d'API
    const client = new OpenAI({
        baseURL: BASE_URL, // URL de l'API
        apiKey: ACCESS_TOKEN, // Token d'accès pour l'API
    });
    
    // Création du message système pour guider le modèle
    let SystemMessage = 
        {
            role: "system", // Rôle du message
            content: "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG.", // Contenu du message
        };
    
    // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
    const chatCompletion = await client.chat.completions.create({
        model: "openai/gpt-oss-20b:hyperbolic", // Nom du modèle à utiliser
        messages: [SystemMessage, ...messages] // Messages envoyés au modèle, incluant le message système et l'historique des messages
    });
    
    // Récupération du message généré par l'API
    const message = chatCompletion.choices[0].message || "";
    
    // Affiche le message généré dans la console pour le débogage
    console.log("Generated message:", message);
    console.log("Message content:", message.content);
    
    // Recherche d'un élément SVG dans le message généré
    const svgMatch = message.content ? message.content.match(/<svg[\s\S]*?<\/svg>/i) : null;
    
    console.log("SVG match found:", svgMatch ? "Yes" : "No");
    
    // Extraction du code SVG ou chaîne vide si aucun SVG trouvé
    const svgContent = svgMatch ? svgMatch[0] : "";
    
    console.log("Final SVG content length:", svgContent.length);
    console.log("SVG preview:", svgContent.substring(0, 100));
    
    // Retourne une réponse JSON contenant le SVG généré comme string
    return new Response(JSON.stringify({ svg: svgContent }), {
        headers: { "Content-Type": "application/json" }, // Définit le type de contenu de la réponse
    });
};