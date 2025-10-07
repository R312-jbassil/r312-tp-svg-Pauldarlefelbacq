import pb from "../../utils/pb";

export const POST = async ({ request }) => {
    try {
        // Récupère les données envoyées dans la requête (FormData pour supporter les fichiers)
        const formData = await request.formData();
        
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const passwordConfirm = formData.get('passwordConfirm');
        const avatar = formData.get('avatar');

        // Validation basique
        if (!email || !password || !passwordConfirm) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: "Email et mot de passe requis" 
                }), 
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        if (password !== passwordConfirm) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: "Les mots de passe ne correspondent pas" 
                }), 
                { 
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Prépare les données pour PocketBase
        const data = new FormData();
        data.append('username', email.split('@')[0]); // Username basé sur l'email
        data.append('email', email);
        data.append('password', password);
        data.append('passwordConfirm', passwordConfirm);
        
        // Ajouter le nom si fourni
        if (name) {
            data.append('name', name);
        }
        
        // Ajouter l'avatar si fourni
        if (avatar && avatar.size > 0) {
            data.append('avatar', avatar);
        }

        // Crée un nouvel utilisateur dans PocketBase
        const record = await pb.collection('users').create(data);

        console.log("Nouvel utilisateur créé:", record.id);

        // Retourne une réponse de succès
        return new Response(
            JSON.stringify({ 
                success: true, 
                user: {
                    id: record.id,
                    email: record.email,
                    username: record.username
                }
            }), 
            { 
                status: 201,
                headers: { "Content-Type": "application/json" }
            }
        );

    } catch (err) {
        console.error("Erreur lors de l'inscription:", err);
        
        // Gestion des erreurs spécifiques de PocketBase
        let errorMessage = "Erreur lors de la création du compte";
        
        if (err.data?.data) {
            // Erreurs de validation PocketBase
            const errors = err.data.data;
            if (errors.email) {
                errorMessage = "Cet email est déjà utilisé";
            } else if (errors.password) {
                errorMessage = "Le mot de passe doit contenir au moins 8 caractères";
            }
        }

        return new Response(
            JSON.stringify({ 
                success: false, 
                message: errorMessage,
                error: err.message 
            }), 
            { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
};
