import { OpenAI } from 'openai';
const BASE_URL = import.meta.env.HF_URL;
const ACCESS_TOKEN = import.meta.env.HF_TOKEN;

export const POST = async ({ request }) => {
    try {
        // Extraction des données du corps de la requête
        const requestData = await request.json();
        console.log('Request data:', JSON.stringify(requestData, null, 2));
        
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
            // Nettoyer et valider chaque message
            messages = requestData.messages
                .filter(msg => msg && msg.role && msg.content) // Filtre les messages invalides
                .map(msg => {
                    let content = String(msg.content).trim();
                    
                    // Si le message de l'assistant contient du SVG, le résumer
                    if (msg.role === 'assistant' && content.includes('<svg')) {
                        const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/i);
                        if (svgMatch) {
                            // Remplacer le SVG complet par un résumé
                            content = '[Generated SVG code]';
                        }
                    }
                    
                    // Limiter la longueur du contenu à 1000 caractères max
                    if (content.length > 1000) {
                        content = content.substring(0, 1000) + '...';
                    }
                    
                    return {
                        role: msg.role === 'user' || msg.role === 'assistant' ? msg.role : 'user',
                        content: content
                    };
                })
                .filter(msg => msg.content.length > 0); // Retire les messages vides
        } else {
            // Fallback en cas de format inattendu
            messages = [];
        }
        
        // Validation: au moins un message
        if (messages.length === 0) {
            return new Response(JSON.stringify({ 
                error: 'No valid messages provided',
                svg: '' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        console.log('Processed messages:', JSON.stringify(messages, null, 2));
        
        // Initialisation du client OpenAI avec l'URL de base et le token d'API
        const client = new OpenAI({
            baseURL: BASE_URL, // URL de l'API
            apiKey: ACCESS_TOKEN, // Token d'accès pour l'API
        });
        
        // Création du message système pour guider le modèle
        let SystemMessage = {
            role: "system",
            content: "You are an SVG code generator. Generate SVG code for the following messages. Make sure to include ids for each part of the generated SVG. Only return the SVG code, nothing else."
        };
        
        
        let finalMessages;
        
        if (messages.length === 1) {
            // Un seul message, utiliser le format simple
            finalMessages = [SystemMessage, messages[0]];
        } else {
            // Plusieurs messages: créer un contexte résumé
            const userMessages = messages.filter(m => m.role === 'user');
            const contextSummary = messages.length > 1 
                ? `Previous context: The user has been iterating on an SVG design. Previous requests: ${userMessages.slice(0, -1).map(m => m.content).join(', ')}. `
                : '';
            
            const lastUserMessage = userMessages[userMessages.length - 1];
            const combinedPrompt = contextSummary + 'Current request: ' + lastUserMessage.content;
            
            finalMessages = [
                SystemMessage,
                {
                    role: 'user',
                    content: combinedPrompt
                }
            ];
        }
        
        console.log('Final messages to API:', JSON.stringify(finalMessages, null, 2));
        console.log('Number of messages:', finalMessages.length);
        console.log('Total message length:', JSON.stringify(finalMessages).length);
        
        // Vérifier que tous les messages ont le bon format
        const invalidMessages = finalMessages.filter(m => !m.role || !m.content || typeof m.content !== 'string');
        if (invalidMessages.length > 0) {
            console.error('Invalid messages found:', invalidMessages);
            return new Response(JSON.stringify({ 
                error: 'Invalid message format detected',
                svg: '' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // Appel à l'API pour générer le code SVG en utilisant le modèle spécifié
        try {
            const chatCompletion = await client.chat.completions.create({
                model: "openai/gpt-oss-20b:hyperbolic",
                messages: finalMessages,
                max_tokens: 2000, // Limite la longueur de la réponse
                temperature: 0.7,
                stream: false, // Désactiver le streaming
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
            
            // Retourne une réponse JSON contenant le SVG généré comme string
            return new Response(JSON.stringify({ svg: svgContent }), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (apiError) {
            console.error('API call failed:', apiError);
            console.error('API error body:', apiError.error);
            
            // Essayer de lire le corps de l'erreur pour plus de détails
            throw apiError;
        }
        
    } catch (error) {
        console.error('Error in generateSVG:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            requestID: error.requestID,
            type: error.type
        });
        
        // Si c'est une erreur 400, c'est probablement un problème de format de messages
        if (error.status === 400) {
            return new Response(JSON.stringify({ 
                error: 'Invalid message format. Please try with a simpler prompt.',
                svg: '',
                details: error.message
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        
        return new Response(JSON.stringify({ 
            error: error.message || 'Error generating SVG',
            svg: '' 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
};