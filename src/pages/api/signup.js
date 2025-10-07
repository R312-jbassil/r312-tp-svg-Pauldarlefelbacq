import pb from "../../utils/pb";

export const POST = async ({ request }) => {
    try {
        // Récupère les données envoyées dans la requête
        const { username, email, password, passwordConfirm } = await request.json();

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

        // Crée un nouvel utilisateur dans PocketBase
        const data = {
            username: username || email.split('@')[0], // Utilise l'email comme username si non fourni
            email: email,
            password: password,
            passwordConfirm: passwordConfirm,
        };

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
