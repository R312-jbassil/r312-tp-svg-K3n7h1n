// src/pages/api/signup.js
import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export const POST = async ({ request, cookies }) => {
    // Récupère les données envoyées dans la requête
    const { email, password, passwordConfirm, name } = await request.json();

    try {
        // Validation basique côté serveur
        if (!email || !password || !passwordConfirm) {
            return new Response(
                JSON.stringify({ error: "Tous les champs sont requis" }), 
                { status: 400 }
            );
        }

        if (password !== passwordConfirm) {
            return new Response(
                JSON.stringify({ error: "Les mots de passe ne correspondent pas" }), 
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return new Response(
                JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }), 
                { status: 400 }
            );
        }

        // Création du nouvel utilisateur avec PocketBase
        const userData = {
            email,
            password,
            passwordConfirm,
            name: name || "", // Le nom est optionnel
            emailVisibility: false // Par défaut, l'email n'est pas visible publiquement
        };

        const createdUser = await pb.collection(Collections.Users).create(userData);

        // Authentification automatique après création
        const authData = await pb.collection(Collections.Users).authWithPassword(email, password);

        // Enregistre le token d'authentification dans un cookie sécurisé
        cookies.set("pb_auth", pb.authStore.exportToCookie(), {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expire dans 1 an
        });

        // Retourne les informations de l'utilisateur créé
        return new Response(
            JSON.stringify({ 
                user: authData.record,
                message: "Compte créé avec succès"
            }), 
            { status: 201 }
        );

    } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
        
        // Gestion des erreurs spécifiques de PocketBase
        if (err.status === 400) {
            // Erreur de validation (ex: email déjà utilisé)
            const errorData = err.response || {};
            let errorMessage = "Erreur lors de la création du compte";
            
            if (errorData.email) {
                errorMessage = "Cette adresse email est déjà utilisée";
            } else if (errorData.password) {
                errorMessage = "Le mot de passe ne respecte pas les critères requis";
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
            
            return new Response(
                JSON.stringify({ error: errorMessage }), 
                { status: 400 }
            );
        }

        // Erreur générique
        return new Response(
            JSON.stringify({ error: "Une erreur est survenue lors de la création du compte" }), 
            { status: 500 }
        );
    }
};