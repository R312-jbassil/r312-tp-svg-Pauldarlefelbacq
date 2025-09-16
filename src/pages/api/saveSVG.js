import PocketBase from 'pocketbase';

export const POST = async ({ request }) => {
    try {
        const { nom, svg } = await request.json();        
        const pb = new PocketBase('http://127.0.0.1:8090');

        const record = await pb.collection('svg').create({
            nom: nom,
            svg: svg
        });
        
        console.log('SVG sauvegardé:', record);
        
        return new Response(JSON.stringify({ 
            success: true, 
            id: record.id,
            message: 'SVG sauvegardé avec succès'
        }), {
            headers: { "Content-Type": "application/json" },
        });
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
