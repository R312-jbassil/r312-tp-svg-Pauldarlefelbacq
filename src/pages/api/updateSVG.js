import pb from '../../utils/pb.js';
import { Collections } from '../../utils/pocketbase-types.js';

export async function POST({ request }) {
    try {
        const { id, code, chat_history } = await request.json();

        if (!id || !code) {
            return new Response(JSON.stringify({ 
                error: 'ID et code SVG requis' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Mettre à jour l'enregistrement dans PocketBase
        const record = await pb.collection(Collections.Svg).update(id, {
            code,
            chat_history
        });

        return new Response(JSON.stringify({ 
            success: true,
            record 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        return new Response(JSON.stringify({ 
            error: 'Erreur serveur lors de la mise à jour' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
